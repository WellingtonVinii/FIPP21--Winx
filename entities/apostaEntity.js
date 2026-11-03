import Entity from "./entity.js";
import ParticipanteEntity from "./participanteEntity.js";
import RodadaEntity from "./rodadaEntity.js";

export default class ApostaEntity extends Entity {
    static APOSTA_MINIMA = 10;

    #id;
    #valor;
    #participante;
    #rodada;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get valor() {
        return this.#valor;
    }
    set valor(value) {
        this.#valor = value;
    }
    get participante() {
        return this.#participante;
    }
    set participante(value) {
        this.#participante = value;
    }
    get rodada() {
        return this.#rodada;
    }
    set rodada(value) {
        this.#rodada = value;
    }

    constructor(id, valor, participante, rodada) {
        super();
        this.#id = id;
        this.#valor = valor;
        this.#participante = participante;
        this.#rodada = rodada;
    }

    static toMap(row) {
        //o mysql2 devolve DECIMAL como string, por isso a conversão do valor
        return new ApostaEntity(row["apo_id"], Number(row["apo_valor"]), new ParticipanteEntity(row["par_id"]), new RodadaEntity(row["rod_id"]));
    }

    validar(saldo) {
        return this.#valor >= ApostaEntity.APOSTA_MINIMA && this.#valor <= saldo;
    }

    //valor total devolvido ao jogador (aposta + ganhos) de acordo com o resultado
    pagamento(resultado) {
        let multiplicador = { Blackjack: 2.5, Ganhou: 2, Empate: 1 };  //3:2, 1:1 e devolução da aposta
        return Math.round(this.#valor * (multiplicador[resultado] ?? 0) * 100) / 100;
    }
}
