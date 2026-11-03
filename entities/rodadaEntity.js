import Entity from "./entity.js";
import SalaEntity from "./salaEntity.js";

export default class RodadaEntity extends Entity {
    #id;
    #codigoBaralho;
    #dtInicio;
    #dtFim;
    #sala;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get codigoBaralho() {
        return this.#codigoBaralho;
    }
    set codigoBaralho(value) {
        this.#codigoBaralho = value;
    }
    get dtInicio() {
        return this.#dtInicio;
    }
    set dtInicio(value) {
        this.#dtInicio = value;
    }
    get dtFim() {
        return this.#dtFim;
    }
    set dtFim(value) {
        this.#dtFim = value;
    }
    get sala() {
        return this.#sala;
    }
    set sala(value) {
        this.#sala = value;
    }

    constructor(id, codigoBaralho, dtInicio, dtFim, sala) {
        super();
        this.#id = id;
        this.#codigoBaralho = codigoBaralho;
        this.#dtInicio = dtInicio;
        this.#dtFim = dtFim;
        this.#sala = sala;
    }

    static toMap(row) {
        return new RodadaEntity(row["rod_id"], row["rod_codigobaralho"], row["rod_dtinicio"], row["rod_dtfim"], new SalaEntity(row["sal_id"]));
    }
}
