'use client'
import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./login.module.css";

export default function PaginaLogin() {

    let email = useRef("");
    let senha = useRef("");

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [carregando, setCarregando] = useState(false);

    async function entrar(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        let obj = {
            email: email.current.value.trim(),
            senha: senha.current.value
        }

        if (!obj.email || !obj.senha) {
            setErro("Preencha o e-mail e a senha!");
            return;
        }

        setCarregando(true);
        try {
            let response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(obj)
            });
            let corpo = await response.json();

            if (response.ok) {
                setSucesso("Login realizado com sucesso! Bem-vindo(a), " + corpo.usuario.nome + ".");
            }
            else {
                setErro(corpo.msg);
            }
        }
        catch (ex) {
            setErro("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
        }
        setCarregando(false);
    }

    return (
        <div className={styles.pagina}>
            <form className={styles.cartao} onSubmit={entrar}>
                <div className={styles.campo}>
                    <label htmlFor="email">E-mail:</label>
                    <input ref={email} id="email" type="email" autoComplete="email" autoFocus></input>
                </div>
                <div className={styles.campo}>
                    <label htmlFor="senha">Senha:</label>
                    <input ref={senha} id="senha" type="password" autoComplete="current-password"></input>
                </div>

                <button className={styles.botao} type="submit" disabled={carregando}>
                    {carregando ? "ENTRANDO..." : "ENTRAR"}
                </button>

                {
                    erro ?
                    <div className={styles.erro}>{erro}</div>
                    :
                    <></>
                }
                {
                    sucesso ?
                    <div className={styles.sucesso}>{sucesso}</div>
                    :
                    <></>
                }

                <Link className={styles.link} href="/cadastro">Criar uma conta</Link>
            </form>
        </div>
    )
}
