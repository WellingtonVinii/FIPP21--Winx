import Entity from "./entity.js";

export default class UsuarioEntity extends Entity {
    #id;
    #nome;
    #email;
    #senha;

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
    get email() {
        return this.#email;
    }
    set email(value) {
        this.#email = value;
    }
    get senha() {
        return this.#senha;
    }
    set senha(value) {
        this.#senha = value;
    }

    constructor(id, nome, email, senha) {
        super();
        this.#id = id;
        this.#nome = nome;
        this.#email = email;
        this.#senha = senha;
    }

    static toMap(row) {
        return new UsuarioEntity(row["usu_id"], row["usu_nome"], row["usu_email"], row["usu_senha"]);
    }

    //a senha nunca deve ser devolvida nas respostas da API
    toJSON() {
        let json = super.toJSON();
        delete json.senha;
        return json;
    }

    validar() {
        if(this.#nome && this.#email && this.#senha && this.#email.includes("@")) {
            return true;
        }

        return false;
    }
}
