import Entity from "./entity.js";

//participante == null representa o turno do dealer
export default class TurnoEntity extends Entity {
    #id;
    #somaCartas;
    #status;
    #participante;
    #rodada;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get somaCartas() {
        return this.#somaCartas;
    }
    set somaCartas(value) {
        this.#somaCartas = value;
    }
    get status() {
        return this.#status;
    }
    set status(value) {
        this.#status = value;
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

    constructor(id, somaCartas, status, participante, rodada) {
        super();
        this.#id = id;
        this.#somaCartas = somaCartas;
        this.#status = status;
        this.#participante = participante;
        this.#rodada = rodada;
    }

    /*
     * Compara a mão do jogador com a do dealer. Cada mão: { soma, blackjack }
     * Retorna: "Estourou", "Blackjack", "Ganhou", "Empate" ou "Perdeu"
     */
    static resultado(jogador, dealer) {
        //estourou: perde mesmo que o dealer também estoure
        if(jogador.soma > 21)
            return "Estourou";
        if(jogador.blackjack && dealer.blackjack)
            return "Empate";
        if(jogador.blackjack)
            return "Blackjack";
        //blackjack do dealer ganha de qualquer 21 feito com mais de duas cartas
        if(dealer.blackjack)
            return "Perdeu";
        if(dealer.soma > 21 || jogador.soma > dealer.soma)
            return "Ganhou";
        if(jogador.soma == dealer.soma)
            return "Empate";

        return "Perdeu";
    }

    //o enum de tur_status não tem "Empate", então o empate fica com status null
    static statusDoResultado(resultado) {
        let status = { Estourou: "Estourou", Blackjack: "Ganhou", Ganhou: "Ganhou", Perdeu: "Perdeu", Empate: null };
        return status[resultado];
    }
}
