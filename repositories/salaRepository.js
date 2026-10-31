import SalaEntity from "../entities/salaEntity.js";
import Repository from "./repository.js";

export default class SalaRepository extends Repository {

    constructor() {
        super();
    }

    async cadastrar(sala) {
        let sql = "INSERT INTO tb_sala (sal_nome, usu_id) VALUES (?, ?)";
        let valores = [sala.nome, sala.usuario.id];
        let result = await this.banco.ExecutaComandoLastInserted(sql, valores);

        sala.id = result;

        return true;
    }

    //salas criadas pelo usuário, com a quantidade de participantes ativos
    async listarPorUsuario(usuarioId) {
        let sql = `SELECT s.*, u.usu_nome,
                    (SELECT COUNT(*) FROM tb_participante p WHERE p.sal_id = s.sal_id AND p.par_dtsaida IS NULL) AS qtd_participantes
                   FROM tb_sala s
                   INNER JOIN tb_usuario u ON u.usu_id = s.usu_id
                   WHERE s.usu_id = ?
                   ORDER BY s.sal_id DESC`;
        let valores = [usuarioId];
        let rows = await this.banco.ExecutaComando(sql, valores);

        let entidades = [];
        for(let row of rows) {
            entidades.push(SalaEntity.toMap(row));
        }

        return entidades;
    }

    async buscarPorId(id) {
        let sql = `SELECT s.*, u.usu_nome FROM tb_sala s
                   INNER JOIN tb_usuario u ON u.usu_id = s.usu_id
                   WHERE s.sal_id = ?`;
        let valores = [id];
        let rows = await this.banco.ExecutaComando(sql, valores);

        if(rows.length > 0) {
            return SalaEntity.toMap(rows[0]);
        }

        return null;
    }
}
