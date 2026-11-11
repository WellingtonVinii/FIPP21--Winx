'use client';
import React, { useState } from 'react';

import Link from "next/link";
import { useRouter } from 'next/navigation';

import styles from "./login.module.css";

export default function FormLogin() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [entrando, setEntrando] = useState(false);
    const router = useRouter();

    async function entrar(evento) {
        evento.preventDefault();
        setErro("");
        setSucesso("");
        setEntrando(true);

        try {
            const resposta = await fetch("http://localhost:5000/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });
            const resultado = await resposta.json();
            if (!resposta.ok) {
                throw new Error(resultado?.msg || "Não foi possível fazer login.");
            }
            setSucesso(`Login realizado com sucesso! Bem-vindo(a), ${resultado.usuario.nome}.`);
            router.push('/salas');
        } catch (ex) {
            setErro(ex instanceof TypeError ? "Não foi possível conectar ao servidor." : ex.message);
        } finally {
            setEntrando(false);
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.cardBody}>
                <h2 className={styles.title}>Bem-vindo(a)</h2>
                <form onSubmit={entrar}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="email">E-mail</label>
                        <input
                            autoComplete="email"
                            autoFocus
                            className={styles.input}
                            id="email"
                            onChange={(evento) => setEmail(evento.target.value)}
                            placeholder="Digite seu e-mail"
                            required
                            type="email"
                            value={email}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="senha">Senha</label>
                        <input
                            autoComplete="current-password"
                            className={styles.input}
                            id="senha"
                            onChange={(evento) => setSenha(evento.target.value)}
                            placeholder="Digite sua senha"
                            required
                            type="password"
                            value={senha}
                        />
                    </div>
                    
                    <button className={styles.btnSubmit} disabled={entrando} type="submit">
                        {entrando ? "Entrando..." : "Entrar"}
                    </button>

                    {erro && <div className={`${styles.alert} ${styles.alertError}`} role="alert">{erro}</div>}
                    {sucesso && <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">{sucesso}</div>}
                </form>
                
                <div className={styles.linkContainer}>
                    <span className={styles.linkText}>Ainda não tem uma conta? </span>
                    <Link className={styles.link} href="/cadastro">Criar agora</Link>
                </div>
            </div>
        </div>
    );
}