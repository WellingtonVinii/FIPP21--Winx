import UsuarioEntity from "../entities/usuarioEntity.js";
import UsuarioRepository from "../repositories/usuarioRepository.js";

export default class UsuarioController {

    #repo;

    contructor() {
        this.#repo = new UsuarioRepository();
    }

    async cadastrar(req, res) {
        try{
            let {nome, email, senha} = req.body;

            let entidade = new UsuarioEntity(0, nome, email, senha);
            if(entidade.validar()){
                let result = await this.#repo.cadastrar(entidade);

                return res.status(201).json(entidade);
            }
        }
        catch(error) {
            res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    async buscarPorEmail(req, res) {
        try{
            let email = req.params.email;
            let result = await this.#repo.buscarPorEmail(email);
            return res.status(200).json(result);
        }
        catch(error) {
            res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    async buscarPorId(req, res) {
        try{
            let id = req.params.id; 
            let result = await this.#repo.buscarPorId(id);
            return res.status(200).json(result);
        }
        catch(error) {
            res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }
}