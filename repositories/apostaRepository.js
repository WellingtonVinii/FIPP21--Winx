import ApostaEntity from "../entities/apostaEntity.js";
import Repository from "./repository.js";

export default class ApostaRepository extends Repository {

    constructor() {
        super();
    }

    async cadastrar(aposta) {
        let sql = "INSERT INTO tb_aposta (apo_valor, par_id, rod_id) VALUES (?, ?, ?)";
        let valores = [aposta.valor, aposta.participante.id, aposta.rodada.id];
        let result = await this.banco.ExecutaComandoLastInserted(sql, valores);

        aposta.id = result;

        return true;
    }

    async listarPorRodada(rodadaId) {
        let sql = "SELECT * FROM tb_aposta WHERE rod_id = ?";
        let valores = [rodadaId];
        let rows = await this.banco.ExecutaComando(sql, valores);

        let entidades = [];
        for(let row of rows) {
            entidades.push(ApostaEntity.toMap(row));
        }

        return entidades;
    }
}
