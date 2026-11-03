import Repository from "./repository.js";

export default class CartaRepository extends Repository {

    constructor() {
        super();
    }

    //par_id fica null quando a carta é do dealer
    async cadastrar(carta) {
        let sql = `INSERT INTO tb_carta (car_codigo, car_imagem, car_ordem, car_visivel, car_valor, car_naipe, par_id, rod_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        let valores = [carta.codigo, carta.imagem, carta.ordem, carta.visivel, carta.valor, carta.naipe,
            carta.participante?.id ?? null, carta.rodada.id];
        let result = await this.banco.ExecutaComandoLastInserted(sql, valores);

        carta.id = result;

        return true;
    }

    async revelar(id) {
        let sql = "UPDATE tb_carta SET car_visivel = 'S' WHERE car_id = ?";
        let valores = [id];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }
}
