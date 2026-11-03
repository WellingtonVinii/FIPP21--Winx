import Repository from "./repository.js";

export default class TurnoRepository extends Repository {

    constructor() {
        super();
    }

    //par_id fica null quando o turno é do dealer
    async cadastrar(turno) {
        let sql = "INSERT INTO tb_turno (tur_somacartas, tur_status, par_id, rod_id) VALUES (?, ?, ?, ?)";
        let valores = [turno.somaCartas, turno.status, turno.participante?.id ?? null, turno.rodada.id];
        let result = await this.banco.ExecutaComandoLastInserted(sql, valores);

        turno.id = result;

        return true;
    }

    async atualizar(turno) {
        let sql = "UPDATE tb_turno SET tur_somacartas = ?, tur_status = ? WHERE tur_id = ?";
        let valores = [turno.somaCartas, turno.status, turno.id];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }
}
