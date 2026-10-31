import ParticipanteEntity from "../entities/participanteEntity.js";
import Repository from "./repository.js";

export default class ParticipanteRepository extends Repository {

    constructor() {
        super();
    }

    //a ordem é a próxima posição dentro da sala
    async cadastrar(participante) {
        let sql = `INSERT INTO tb_participante (par_dtentrada, par_ordem, par_saldo, sal_id, usu_id)
                   SELECT NOW(), COALESCE(MAX(par_ordem), 0) + 1, ?, ?, ?
                   FROM tb_participante WHERE sal_id = ?`;
        let valores = [participante.saldo, participante.sala.id, participante.usuario.id, participante.sala.id];
        let result = await this.banco.ExecutaComandoLastInserted(sql, valores);

        participante.id = result;

        return true;
    }

    //participação ativa (sem data de saída) do usuário na sala
    async buscarAtivo(salaId, usuarioId) {
        let sql = "SELECT * FROM tb_participante WHERE sal_id = ? AND usu_id = ? AND par_dtsaida IS NULL";
        let valores = [salaId, usuarioId];
        let rows = await this.banco.ExecutaComando(sql, valores);

        if(rows.length > 0) {
            return ParticipanteEntity.toMap(rows[0]);
        }

        return null;
    }

    async listarAtivosPorSala(salaId) {
        let sql = `SELECT p.*, u.usu_nome FROM tb_participante p
                   INNER JOIN tb_usuario u ON u.usu_id = p.usu_id
                   WHERE p.sal_id = ? AND p.par_dtsaida IS NULL
                   ORDER BY p.par_ordem`;
        let valores = [salaId];
        let rows = await this.banco.ExecutaComando(sql, valores);

        let entidades = [];
        for(let row of rows) {
            entidades.push(ParticipanteEntity.toMap(row));
        }

        return entidades;
    }

    async registrarSaida(id) {
        let sql = "UPDATE tb_participante SET par_dtsaida = NOW() WHERE par_id = ?";
        let valores = [id];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }
}
