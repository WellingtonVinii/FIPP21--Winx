'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const router = useRouter();

    const API_URL = "http://localhost:5000";

    async function verificarUsuario() {
        try {
            const resposta = await fetch(`${API_URL}/usuario/logado`, {
                method: "GET",
                credentials: "include"
            });
            if (resposta.ok) {
                const dados = await resposta.json();
                setUsuario(dados);
                return dados;
            } else {
                setUsuario(null);
                return null;
            }
        } catch (ex) {
            console.error("Erro ao verificar autenticação:", ex);
            setUsuario(null);
            return null;
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        verificarUsuario();
    }, []);

    async function login(email, senha) {
        setCarregando(true);
        try {
            const resposta = await fetch(`${API_URL}/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();
            if (!resposta.ok) {
                throw new Error(dados?.msg || "E-mail ou senha incorretos.");
            }

            setUsuario(dados.usuario);
            return dados.usuario;
        } finally {
            setCarregando(false);
        }
    }

    async function logout() {
        try {
            await fetch(`${API_URL}/login/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (ex) {
            console.error("Erro ao realizar logout:", ex);
        } finally {
            setUsuario(null);
            router.push("/login");
        }
    }

    return (
        <AuthContext.Provider value={{ usuario, carregando, login, logout, verificarUsuario }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const contexto = useContext(AuthContext);
    if (!contexto) {
        throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
    }
    return contexto;
}

