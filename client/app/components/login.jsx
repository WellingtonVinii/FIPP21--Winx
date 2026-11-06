'use client'

import Link from "next/link";
import { useState } from "react";

export default function FormLogin() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [entrando, setEntrando] = useState(false);

    async function entrar(evento) {
        evento.preventDefault();
        setErro("");
        setSucesso("");
        setEntrando(true);

        try {
            const resposta = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha })
                }
            );
            const resultado = await resposta.json();
            if (!resposta.ok) {
                throw new Error(resultado?.msg || "Não foi possível fazer login.");
            }
            setSucesso("Login realizado com sucesso! Bem-vindo(a), " + resultado.usuario.nome + ".");
        } catch (ex) {
            setErro(ex instanceof TypeError ? "Não foi possível conectar ao servidor." : ex.message);
        } finally {
            setEntrando(false);
        }
    }

    return (
        <div className="bg-gray-100 min-vh-100 d-flex align-items-center">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-8 col-md-6 col-lg-4">
                        <div className="card border-0 shadow-sm rounded-0">
                            <div className="card-body px-4 pt-4 pb-3">
                                <form onSubmit={entrar}>
                                    <div className="form-group">
                                        <label className="text-gray-900 mb-1" htmlFor="email">E-mail:</label>
                                        <input
                                            autoComplete="email"
                                            autoFocus
                                            className="form-control"
                                            id="email"
                                            onChange={(evento) => setEmail(evento.target.value)}
                                            required
                                            type="email"
                                            value={email}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-gray-900 mb-1" htmlFor="senha">Senha:</label>
                                        <input
                                            autoComplete="current-password"
                                            className="form-control"
                                            id="senha"
                                            onChange={(evento) => setSenha(evento.target.value)}
                                            required
                                            type="password"
                                            value={senha}
                                        />
                                    </div>
                                    <button className="btn btn-light btn-sm btn-block border" disabled={entrando} type="submit">
                                        {entrando ? "ENTRANDO..." : "ENTRAR"}
                                    </button>
                                    {erro && <div className="alert alert-danger small mt-3 mb-0" role="alert">{erro}</div>}
                                    {sucesso && <div className="alert alert-success small mt-3 mb-0" role="alert">{sucesso}</div>}
                                </form>
                                <Link className="d-inline-block mt-5" href="/cadastro">Criar uma conta</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
