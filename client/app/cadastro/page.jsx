'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import styles from "./cadastro.module.css";

export default function Cadastro() {
    const router = useRouter();
    const { login } = useAuth();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("erro");
    const [carregando, setCarregando] = useState(false);

    async function cadastrar(e) {
        e.preventDefault();
        setMensagem("");

        if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
            setTipoMensagem("erro");
            setMensagem("Preencha todos os campos.");
            return;
        }

        if (senha !== confirmarSenha) {
            setTipoMensagem("erro");
            setMensagem("As senhas não coincidem.");
            return;
        }

        if (senha.length < 6) {
            setTipoMensagem("erro");
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
                    nome: nome.trim(),
                    email: email.trim(),
                    senha: senha
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                setTipoMensagem("erro");
                setMensagem(dados.msg || dados.mensagem || "Erro ao cadastrar usuário.");
                setCarregando(false);
                return;
            }

            // Realiza login automático com as credenciais recém-criadas e redireciona direto para o lobby/salas
            try {
                await login(email.trim(), senha);
                setTipoMensagem("sucesso");
                setMensagem("Conta criada com sucesso! Entrando na mesa...");

                setTimeout(() => {
                    router.push("/salas");
                }, 800);
            } catch (erroLogin) {
                setTipoMensagem("sucesso");
                setMensagem("Conta criada com sucesso! Redirecionando para o login...");
                setTimeout(() => {
                    router.push("/login");
                }, 1200);
            }

        } catch (erro) {
            setTipoMensagem("erro");
            setMensagem("Não foi possível conectar ao servidor.");
            setCarregando(false);
        }
    }

    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <header className={styles.headerArea}>
                    <h1 className={styles.logo}>
                        <i className="fas fa-dice text-warning"></i>
                        <span>FIPP<span>21</span></span>
                    </h1>
                    <div className={styles.naipes}>
                        <span>♠</span>
                        <span className={styles.naipesVermelho}>♥</span>
                        <span className={styles.naipesVermelho}>♦</span>
                        <span>♣</span>
                    </div>
                    <p className={styles.subtitulo}>
                        Crie sua conta para entrar na mesa de Blackjack
                    </p>
                </header>

                <div className={styles.feltDivider}>
                    <span className={styles.titulo}>Novo Jogador</span>
                </div>

                <form onSubmit={cadastrar} className={styles.form}>
                    <div className={styles.campo}>
                        <label className={styles.label}>
                            <i className="fas fa-user"></i> Nome completo
                        </label>
                        <div className={styles.inputContainer}>
                            <i className={`fas fa-user ${styles.inputIcon}`}></i>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Digite seu nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                disabled={carregando}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.campo}>
                        <label className={styles.label}>
                            <i className="fas fa-envelope"></i> E-mail
                        </label>
                        <div className={styles.inputContainer}>
                            <i className={`fas fa-envelope ${styles.inputIcon}`}></i>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={carregando}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.campo}>
                        <label className={styles.label}>
                            <i className="fas fa-lock"></i> Senha
                        </label>
                        <div className={styles.inputContainer}>
                            <i className={`fas fa-lock ${styles.inputIcon}`}></i>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="Mínimo de 6 caracteres"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                disabled={carregando}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.campo}>
                        <label className={styles.label}>
                            <i className="fas fa-shield-alt"></i> Confirmar senha
                        </label>
                        <div className={styles.inputContainer}>
                            <i className={`fas fa-shield-alt ${styles.inputIcon}`}></i>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="Repita sua senha"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                disabled={carregando}
                                required
                            />
                        </div>
                    </div>

                    {mensagem && (
                        <div className={tipoMensagem === "sucesso" ? styles.mensagemSucesso : styles.mensagemErro}>
                            <i className={tipoMensagem === "sucesso" ? "fas fa-check-circle" : "fas fa-exclamation-triangle"}></i>
                            <span>{mensagem}</span>
                        </div>
                    )}

                    <button type="submit" className={styles.btnCadastrar} disabled={carregando}>
                        {carregando ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Cadastrando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-user-plus mr-1"></i> Criar Conta e Jogar
                            </>
                        )}
                    </button>
                </form>

                <footer className={styles.footerArea}>
                    <div>
                        Já possui uma conta?{" "}
                        <Link href="/login" className={styles.linkLogin}>
                            Fazer login
                        </Link>
                    </div>
                    <div>
                        <Link href="/" className={styles.linkVoltar}>
                            <i className="fas fa-arrow-left"></i> Página Inicial
                        </Link>
                    </div>
                </footer>
            </div>
        </main>
    );
}
