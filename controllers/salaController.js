import ParticipanteEntity from "../entities/participanteEntity.js";
import SalaEntity from "../entities/salaEntity.js";
import ParticipanteRepository from "../repositories/participanteRepository.js";
import SalaRepository from "../repositories/salaRepository.js";
import { notificarParticipantes, removerDoCanal } from "../sockets/salaSocket.js";
import JogoController from "./jogoController.js";

export default class SalaController {

    #repo;
    #participanteRepo;
    #jogo;

    constructor() {
        this.#repo = new SalaRepository();
        this.#participanteRepo = new ParticipanteRepository();
        this.#jogo = new JogoController();
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
            let salas = await this.#repo.listar();

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
                this.#jogo.aoEntrar(sala.id).catch(console.error);
                return res.status(200).json(participante);
            }

            participante = new ParticipanteEntity(0, null, null, null, ParticipanteEntity.SALDO_INICIAL, sala, req.usuarioLogado);
            let entrou = await this.#participanteRepo.cadastrar(participante, SalaEntity.MAX_JOGADORES);
            if(!entrou) {
                return res.status(409).json({msg: `A sala está cheia! O máximo é de ${SalaEntity.MAX_JOGADORES} jogadores.`});
            }

            participante = await this.#participanteRepo.buscarAtivo(sala.id, req.usuarioLogado.id);

            await notificarParticipantes(sala.id);

            //quando alguém entra na sala o jogo é iniciado (não precisa esperar o baralho para responder)
            this.#jogo.aoEntrar(sala.id).catch(console.error);

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
            let saiu = await this.removerParticipante(id, req.usuarioLogado.id);
            if(!saiu)
                return res.status(404).json({msg: "Você não está participando dessa sala!"});

            return res.status(200).json({msg: "Você saiu da sala!"});
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    //usado pela rota de saída e pelo socket (quando o jogador desconecta e não volta)
    async removerParticipante(salaId, usuarioId) {
        let participante = await this.#participanteRepo.buscarAtivo(salaId, usuarioId);
        if(participante == null)
            return false;

        let result = await this.#participanteRepo.registrarSaida(participante.id);
        if(!result)
            throw new Error("Erro ao registrar a saída do participante");

        //quem saiu deixa de receber os eventos da sala
        await removerDoCanal(salaId, usuarioId);
        await notificarParticipantes(salaId);
        await this.#jogo.aoSair(salaId, participante.id);

        return true;
    }
}
