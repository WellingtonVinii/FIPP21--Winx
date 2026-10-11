import UsuarioEntity from "../entities/usuarioEntity.js";
import Repository from "./repository.js";

export default class UsuarioRepository extends Repository {

    constructor() {
        super();
    }

    async cadastrar(usuario) {
        let sql = " INSERT INTO tb_usuario (usu_nome, usu_email, usu_senha) VALUES (?, ?, ?)";
        let valores = [usuario.nome, usuario.email, usuario.senha];
        let result = await this.banco.ExecutaComandoLastInserted(sql, valores);

        usuario.id = result;

        return true;
    }

    async buscarPorEmail(email) {
        let sql = "SELECT * FROM tb_usuario WHERE usu_email = ?";
        let valores = [email];
        let rows = await this.banco.ExecutaComando(sql, valores);

        if(rows.length > 0) {
            return UsuarioEntity.toMap(rows[0]);
        }

        return null;
    }

    async buscarPorId(id) {
        let sql = "SELECT * FROM tb_usuario WHERE usu_id = ?";
        let valores = [id];
        let rows = await this.banco.ExecutaComando(sql, valores);

        if(rows.length > 0) {
            return UsuarioEntity.toMap(rows[0]);
        }

        return null;
    }
}   