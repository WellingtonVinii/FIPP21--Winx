import Entity from "./entity.js";
import UsuarioEntity from "./usuarioEntity.js";

export default class SalaEntity extends Entity {
    static MAX_JOGADORES = 4;   //além dos jogadores a mesa tem o dealer

    #id;
    #nome;
    #usuario;
    #participantes;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get nome() {
        return this.#nome;
    }
    set nome(value) {
        this.#nome = value;
    }
    get usuario() {
        return this.#usuario;
    }
    set usuario(value) {
        this.#usuario = value;
    }
    get participantes() {
        return this.#participantes;
    }
    set participantes(value) {
        this.#participantes = value;
    }

    constructor(id, nome, usuario, participantes) {
        super();
        this.#id = id;
        this.#nome = nome;
        this.#usuario = usuario;
        this.#participantes = participantes;
    }

    static toMap(row) {
        let sala = new SalaEntity(row["sal_id"], row["sal_nome"], new UsuarioEntity(row["usu_id"]));
        //para junções com a tabela de usuário (dono da sala)
        if(row["usu_nome"] != null) {
            sala.usuario.nome = row["usu_nome"];
        }
        //quantidade de participantes ativos, quando vier na consulta
        if(row["qtd_participantes"] != null) {
            sala.participantes = Number(row["qtd_participantes"]);
        }
        return sala;
    }

    validar() {
        if(this.#nome && this.#nome.trim().length > 0 && this.#nome.length <= 200 && this.#usuario?.id > 0) {
            return true;
        }

        return false;
    }
}
