import ParticipanteEntity from "../entities/participanteEntity.js";
import SalaEntity from "../entities/salaEntity.js";
import ParticipanteRepository from "../repositories/participanteRepository.js";
import SalaRepository from "../repositories/salaRepository.js";
import { notificarParticipantes } from "../sockets/salaSocket.js";

const SALDO_INICIAL = 1000;

export default class SalaController {

    #repo;
    #participanteRepo;

    constructor() {
        this.#repo = new SalaRepository();
        this.#participanteRepo = new ParticipanteRepository();
    }

    async cadastrar(req, res) {
        try{
            let {nome} = req.body;

            let entidade = new SalaEntity(0, nome, req.usuarioLogado);
            if(!entidade.validar()) {
                return res.status(400).json({msg: "Informe um nome para a sala (até 200 caracteres)!"});
            }

            await this.#repo.cadastrar(entidade);

            return res.status(201).json(entidade);
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    async listar(req, res) {
        try{
            let salas = await this.#repo.listarPorUsuario(req.usuarioLogado.id);

            return res.status(200).json(salas);
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    async obter(req, res) {
        try{
            let {id} = req.params;
            let sala = await this.#repo.buscarPorId(id);
            if(sala == null)
                return res.status(404).json({msg: "Sala não encontrada!"});

            sala.participantes = await this.#participanteRepo.listarAtivosPorSala(sala.id);

            return res.status(200).json(sala);
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    //entrar na sala através do código (id da sala)
    async entrar(req, res) {
        try{
            let {id} = req.params;
            let sala = await this.#repo.buscarPorId(id);
            if(sala == null)
                return res.status(404).json({msg: "Sala não encontrada! Confira o código informado."});

            //se o usuário já está na sala devolve a participação atual
            let participante = await this.#participanteRepo.buscarAtivo(sala.id, req.usuarioLogado.id);
            if(participante) {
                return res.status(200).json(participante);
            }

            participante = new ParticipanteEntity(0, null, null, null, SALDO_INICIAL, sala, req.usuarioLogado);
            await this.#participanteRepo.cadastrar(participante);

            participante = await this.#participanteRepo.buscarAtivo(sala.id, req.usuarioLogado.id);

            await notificarParticipantes(sala.id);

            return res.status(201).json(participante);
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    async sair(req, res) {
        try{
            let {id} = req.params;
            let participante = await this.#participanteRepo.buscarAtivo(id, req.usuarioLogado.id);
            if(participante == null)
                return res.status(404).json({msg: "Você não está participando dessa sala!"});

            let result = await this.#participanteRepo.registrarSaida(participante.id);
            if(result) {
                await notificarParticipantes(id);
                return res.status(200).json({msg: "Você saiu da sala!"});
            }

            throw new Error("Erro ao registrar a saída do participante");
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }
}
