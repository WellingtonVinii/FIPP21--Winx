import RodadaEntity from "../entities/rodadaEntity.js";
import Repository from "./repository.js";

export default class RodadaRepository extends Repository {

    constructor() {
        super();
    }

    async cadastrar(rodada) {
        let sql = "INSERT INTO tb_rodada (rod_codigobaralho, rod_dtinicio, sal_id) VALUES (?, NOW(), ?)";
        let valores = [rodada.codigoBaralho, rodada.sala.id];
        let result = await this.banco.ExecutaComandoLastInserted(sql, valores);

        rodada.id = result;

        return true;
    }

    async finalizar(id) {
        let sql = "UPDATE tb_rodada SET rod_dtfim = NOW() WHERE rod_id = ?";
        let valores = [id];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    //rodadas que ficaram sem data de fim (ex.: servidor reiniciado no meio do jogo)
    async listarAbertas() {
        let sql = "SELECT * FROM tb_rodada WHERE rod_dtfim IS NULL";
        let rows = await this.banco.ExecutaComando(sql);

        let entidades = [];
        for(let row of rows) {
            entidades.push(RodadaEntity.toMap(row));
        }

        return entidades;
    }
}
