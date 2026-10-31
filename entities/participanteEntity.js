import Entity from "./entity.js";
import SalaEntity from "./salaEntity.js";
import UsuarioEntity from "./usuarioEntity.js";

export default class ParticipanteEntity extends Entity {
    #id;
    #dtEntrada;
    #dtSaida;
    #ordem;
    #saldo;
    #sala;
    #usuario;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get dtEntrada() {
        return this.#dtEntrada;
    }
    set dtEntrada(value) {
        this.#dtEntrada = value;
    }
    get dtSaida() {
        return this.#dtSaida;
    }
    set dtSaida(value) {
        this.#dtSaida = value;
    }
    get ordem() {
        return this.#ordem;
    }
    set ordem(value) {
        this.#ordem = value;
    }
    get saldo() {
        return this.#saldo;
    }
    set saldo(value) {
        this.#saldo = value;
    }
    get sala() {
        return this.#sala;
    }
    set sala(value) {
        this.#sala = value;
    }
    get usuario() {
        return this.#usuario;
    }
    set usuario(value) {
        this.#usuario = value;
    }

    constructor(id, dtEntrada, dtSaida, ordem, saldo, sala, usuario) {
        super();
        this.#id = id;
        this.#dtEntrada = dtEntrada;
        this.#dtSaida = dtSaida;
        this.#ordem = ordem;
        this.#saldo = saldo;
        this.#sala = sala;
        this.#usuario = usuario;
    }

    static toMap(row) {
        //o mysql2 devolve DECIMAL como string, por isso a conversão do saldo
        let participante = new ParticipanteEntity(row["par_id"], row["par_dtentrada"], row["par_dtsaida"], row["par_ordem"],
            Number(row["par_saldo"]), new SalaEntity(row["sal_id"]), new UsuarioEntity(row["usu_id"]));
        //para junções com a tabela de usuário
        if(row["usu_nome"] != null) {
            participante.usuario.nome = row["usu_nome"];
        }
        return participante;
    }
}
