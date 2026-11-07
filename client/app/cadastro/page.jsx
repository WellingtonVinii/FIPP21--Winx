'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cadastro.module.css";

export default function Cadastro() {

    const router = useRouter();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [mensagem, setMensagem] = useState("");
    const [carregando, setCarregando] = useState(false);

    async function cadastrar(e) {

        e.preventDefault();

        setMensagem("");

        if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
            setMensagem("Preencha todos os campos.");
            return;
        }

        if (senha !== confirmarSenha) {
            setMensagem("As senhas não são iguais.");
            return;
        }

        if (senha.length < 6) {
            setMensagem("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        try {

            setCarregando(true);

            const resposta = await fetch("http://localhost:5000/usuario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: nome,
                    email: email,
                    senha: senha
                })
            });

            

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem(dados.mensagem || "Erro ao cadastrar usuário.");
                return;
            }

            setMensagem("Cadastro realizado com sucesso!");

            setTimeout(() => {
                router.push("/login");
            }, 1500);

        } catch (erro) {

            setMensagem("Não foi possível conectar ao servidor.");

        } finally {

            setCarregando(false);

        }
    }

    return (

        <main className={styles.container}>

            <div className={styles.card}>

                <h1>FIPP<span>21</span></h1>

                <p className={styles.subtitulo}>
                    Crie sua conta e venha jogar Blackjack!
                </p>

                <h2>Criar conta</h2>

                <form onSubmit={cadastrar}>

                    <label>Nome completo</label>

                    <input
                        type="text"
                        placeholder="Digite seu nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                    />

                    <label>E-mail</label>

                    <input
                        type="email"
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label>Senha</label>

                    <input
                        type="password"
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />

                    <label>Confirmar senha</label>

                    <input
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                    />

                    {mensagem && (
                        <p className={styles.mensagem}>
                            {mensagem}
                        </p>
                    )}

                    <button type="submit" disabled={carregando}>
                        {carregando ? "Cadastrando..." : "Cadastrar"}
                    </button>

                </form>

                <p className={styles.login}>
                    Já possui uma conta?
                    {" "}
                    <a href="/login">Faça login</a>
                </p>

            </div>

        </main>
    );
}
