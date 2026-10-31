import UsuarioEntity from "../entities/usuarioEntity.js";
import UsuarioRepository from "../repositories/usuarioRepository.js";

export default class UsuarioController {

    #repo;

    constructor() {
        this.#repo = new UsuarioRepository();
    }

    async cadastrar(req, res) {
        try{
            let {nome, email, senha} = req.body;

            let entidade = new UsuarioEntity(0, nome, email, senha);
            if(!entidade.validar()) {
                return res.status(400).json({msg: "Parâmetros incorretos. Informe nome, e-mail válido e senha!"});
            }

            let existente = await this.#repo.buscarPorEmail(email);
            if(existente) {
                return res.status(409).json({msg: "Já existe um usuário cadastrado com esse e-mail!"});
            }

            await this.#repo.cadastrar(entidade);

            return res.status(201).json(entidade);
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    async buscarPorEmail(req, res) {
        try{
            let {email} = req.params;
            let usuario = await this.#repo.buscarPorEmail(email);
            if(usuario == null)
                return res.status(404).json({msg: "Usuário não encontrado!"});

            return res.status(200).json(usuario);
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    async buscarPorId(req, res) {
        try{
            let {id} = req.params;
            let usuario = await this.#repo.buscarPorId(id);
            if(usuario == null)
                return res.status(404).json({msg: "Usuário não encontrado!"});

            return res.status(200).json(usuario);
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    //retorna o usuário dono do token (usado pelo frontend para montar o contexto do usuário logado)
    async logado(req, res) {
        return res.status(200).json(req.usuarioLogado);
    }
}
