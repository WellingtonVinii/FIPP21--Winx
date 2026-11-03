import Entity from "./entity.js";

//participante == null representa uma carta do dealer
export default class CartaEntity extends Entity {
    #id;
    #codigo;
    #imagem;
    #ordem;
    #visivel;
    #valor;
    #naipe;
    #participante;
    #rodada;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get codigo() {
        return this.#codigo;
    }
    set codigo(value) {
        this.#codigo = value;
    }
    get imagem() {
        return this.#imagem;
    }
    set imagem(value) {
        this.#imagem = value;
    }
    get ordem() {
        return this.#ordem;
    }
    set ordem(value) {
        this.#ordem = value;
    }
    get visivel() {
        return this.#visivel;
    }
    set visivel(value) {
        this.#visivel = value;
    }
    get valor() {
        return this.#valor;
    }
    set valor(value) {
        this.#valor = value;
    }
    get naipe() {
        return this.#naipe;
    }
    set naipe(value) {
        this.#naipe = value;
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

    constructor(id, codigo, imagem, ordem, visivel, valor, naipe, participante, rodada) {
        super();
        this.#id = id;
        this.#codigo = codigo;
        this.#imagem = imagem;
        this.#ordem = ordem;
        this.#visivel = visivel;
        this.#valor = valor;
        this.#naipe = naipe;
        this.#participante = participante;
        this.#rodada = rodada;
    }

    //valor da carta a partir do valor informado pela deckofcardsapi (o Ás é salvo como 11)
    static valorPorNome(nome) {
        if(nome == "ACE")
            return 11;
        if(nome == "KING" || nome == "QUEEN" || nome == "JACK")
            return 10;

        return Number(nome);
    }

    //soma da mão: o Ás vale 11 e passa a valer 1 se a soma ultrapassar 21
    static somar(cartas) {
        let soma = 0;
        let ases = 0;
        for(let carta of cartas) {
            soma += carta.valor;
            if(carta.valor == 11) ases++;
        }
        while(soma > 21 && ases > 0) {
            soma -= 10;
            ases--;
        }
        return soma;
    }
}
