'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function SalasLobby() {
    const { usuario, logout, carregando } = useAuth();
    const router = useRouter();

    const [salas, setSalas] = useState([]);
    const [carregandoSalas, setCarregandoSalas] = useState(true);

    const [nomeNovaSala, setNomeNovaSala] = useState('');
    const [criandoSala, setCriandoSala] = useState(false);
    const [erroCriar, setErroCriar] = useState('');

    const [codigoEntrar, setCodigoEntrar] = useState('');
    const [entrandoSala, setEntrandoSala] = useState(false);
    const [erroEntrar, setErroEntrar] = useState('');

    const [copiadoId, setCopiadoId] = useState(null);

    const API_URL = 'http://localhost:5000';

    async function carregarSalas() {
        setCarregandoSalas(true);
        try {
            const res = await fetch(`${API_URL}/sala`, {
                method: 'GET',
                credentials: 'include'
            });
            if (res.ok) {
                const dados = await res.json();
                setSalas(Array.isArray(dados) ? dados : []);
            }
        } catch (ex) {
            console.error('Erro ao listar salas:', ex);
        } finally {
            setCarregandoSalas(false);
        }
    }

    useEffect(() => {
        if (!carregando && usuario) {
            carregarSalas();
        }
    }, [carregando, usuario]);

    async function handleCriarSala(e) {
        e.preventDefault();
        setErroCriar('');
        if (!nomeNovaSala.trim()) {
            setErroCriar('Informe um nome para a sala.');
            return;
        }

        setCriandoSala(true);
        try {
            const res = await fetch(`${API_URL}/sala`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nomeNovaSala.trim() })
            });
            const dados = await res.json();
            if (!res.ok) {
                throw new Error(dados?.msg || 'Erro ao criar sala.');
            }

            const novaSalaId = dados.id;
            // Entra na sala recém-criada
            const resEntrar = await fetch(`${API_URL}/sala/${novaSalaId}/entrar`, {
                method: 'POST',
                credentials: 'include'
            });

            if (resEntrar.ok) {
                router.push(`/mesa/${novaSalaId}`);
            } else {
                setNomeNovaSala('');
                carregarSalas();
            }
        } catch (ex) {
            setErroCriar(ex.message);
        } finally {
            setCriandoSala(false);
        }
    }

    async function handleEntrarPorCodigo(e, idManual) {
        if (e) e.preventDefault();
        const idSala = idManual || codigoEntrar.trim();
        setErroEntrar('');

        if (!idSala) {
            setErroEntrar('Digite o código numérico da sala.');
            return;
        }

        setEntrandoSala(true);
        try {
            const res = await fetch(`${API_URL}/sala/${idSala}/entrar`, {
                method: 'POST',
                credentials: 'include'
            });
            const dados = await res.json();
            if (!res.ok) {
                throw new Error(dados?.msg || 'Não foi possível entrar na sala.');
            }

            router.push(`/mesa/${idSala}`);
        } catch (ex) {
            setErroEntrar(ex.message);
        } finally {
            setEntrandoSala(false);
        }
    }

    function copiarCodigo(id) {
        navigator.clipboard.writeText(String(id));
        setCopiadoId(id);
        setTimeout(() => setCopiadoId(null), 2000);
    }

    if (carregando) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Carregando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 d-flex flex-column">
            {/* Header / Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 shadow-sm">
                <div className="container">
                    <Link className="navbar-brand font-weight-bold d-flex align-items-center" href="/salas">
                        <i className="fas fa-dice text-warning mr-2 fa-lg"></i>
                        <span>FIPP<span className="text-warning">21</span></span>
                        <span className="badge badge-secondary ml-2 small">Lobby</span>
                    </Link>

                    <div className="ml-auto d-flex align-items-center">
                        <span className="text-white mr-3 d-none d-md-inline">
                            <i className="fas fa-user-circle mr-1 text-warning"></i>
                            <strong>{usuario?.nome}</strong>
                        </span>
                        <Link className="btn btn-outline-light btn-sm mr-2" href="/" title="Regras e Informações">
                            <i className="fas fa-info-circle mr-1"></i> Regras
                        </Link>
                        <button className="btn btn-danger btn-sm" onClick={logout} title="Encerrar Sessão">
                            <i className="fas fa-sign-out-alt mr-1"></i> Sair
                        </button>
                    </div>
                </div>
            </nav>

            {/* Conteúdo Principal */}
            <main className="container py-4 flex-grow-1">
                {/* Banner de boas vindas */}
                <div className="card text-white mb-4 shadow-sm" style={{
                    background: "linear-gradient(135deg, #115738 0%, #08291a 100%)",
                    borderLeft: "6px solid #d4af37"
                }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <h2 className="font-weight-bold mb-1">
                                    Mesa de Blackjack - Área Restrita
                                </h2>
                                <p className="mb-0 text-white-50">
                                    Crie uma sala exclusiva para convidar outros jogadores ou digite o código de uma sala existente.
                                </p>
                            </div>
                            <div className="col-md-4 text-md-right mt-3 mt-md-0">
                                <span className="badge badge-warning text-dark p-2 font-weight-bold">
                                    <i className="fas fa-coins mr-1"></i> Saldo Inicial por Mesa: R$ 1.000,00
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Card: Entrar por Código */}
                    <div className="col-lg-6 mb-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center">
                                <i className="fas fa-key text-primary mr-2 fa-lg"></i>
                                <h5 className="font-weight-bold mb-0 text-dark">Entrar em uma Sala por Código</h5>
                            </div>
                            <div className="card-body p-4">
                                <p className="text-muted small mb-3">
                                    Tem o código fornecido pelo criador da sala? Digite-o abaixo para se sentar à mesa:
                                </p>
                                <form onSubmit={(e) => handleEntrarPorCodigo(e)}>
                                    <div className="form-group mb-3">
                                        <label className="font-weight-bold text-dark small" htmlFor="codigoSala">
                                            Código da Sala (ID):
                                        </label>
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text bg-light text-muted">#</span>
                                            </div>
                                            <input
                                                id="codigoSala"
                                                type="number"
                                                min="1"
                                                className="form-control"
                                                placeholder="Ex: 5"
                                                value={codigoEntrar}
                                                onChange={(e) => setCodigoEntrar(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    {erroEntrar && (
                                        <div className="alert alert-danger small py-2 mb-3" role="alert">
                                            <i className="fas fa-exclamation-triangle mr-1"></i> {erroEntrar}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block font-weight-bold shadow-sm"
                                        disabled={entrandoSala}
                                    >
                                        {entrandoSala ? (
                                            <span><i className="fas fa-spinner fa-spin mr-1"></i> Entrando...</span>
                                        ) : (
                                            <span><i className="fas fa-sign-in-alt mr-1"></i> Entrar na Mesa</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Card: Criar Nova Sala */}
                    <div className="col-lg-6 mb-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center">
                                <i className="fas fa-plus-circle text-success mr-2 fa-lg"></i>
                                <h5 className="font-weight-bold mb-0 text-dark">Criar Nova Sala de Jogo</h5>
                            </div>
                            <div className="card-body p-4">
                                <p className="text-muted small mb-3">
                                    Dê um nome para a sua sala. Ao criar, você será colocado diretamente na mesa.
                                </p>
                                <form onSubmit={handleCriarSala}>
                                    <div className="form-group mb-3">
                                        <label className="font-weight-bold text-dark small" htmlFor="nomeSala">
                                            Nome da Sala:
                                        </label>
                                        <input
                                            id="nomeSala"
                                            type="text"
                                            maxLength="200"
                                            className="form-control"
                                            placeholder="Ex: Mesa dos Campeões"
                                            value={nomeNovaSala}
                                            onChange={(e) => setNomeNovaSala(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {erroCriar && (
                                        <div className="alert alert-danger small py-2 mb-3" role="alert">
                                            <i className="fas fa-exclamation-triangle mr-1"></i> {erroCriar}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn btn-success btn-block font-weight-bold shadow-sm"
                                        disabled={criandoSala}
                                    >
                                        {criandoSala ? (
                                            <span><i className="fas fa-spinner fa-spin mr-1"></i> Criando...</span>
                                        ) : (
                                            <span><i className="fas fa-plus mr-1"></i> Criar e Entrar na Sala</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção: Minhas Salas */}
                <div className="card border-0 shadow-sm mt-2">
                    <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <i className="fas fa-crown text-warning mr-2 fa-lg"></i>
                            <h5 className="font-weight-bold mb-0 text-dark">Salas Disponíveis</h5>
                        </div>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={carregarSalas}
                            disabled={carregandoSalas}
                            title="Atualizar lista"
                        >
                            <i className={`fas fa-sync-alt ${carregandoSalas ? 'fa-spin' : ''}`}></i> Atualizar
                        </button>
                    </div>

                    <div className="card-body p-0">
                        {carregandoSalas ? (
                            <div className="text-center py-5 text-muted">
                                <i className="fas fa-spinner fa-spin fa-2x mb-2"></i>
                                <p className="mb-0">Carregando suas salas...</p>
                            </div>
                        ) : salas.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="fas fa-folder-open fa-3x mb-3 text-gray-300"></i>
                                <h5>Você ainda não criou nenhuma sala</h5>
                                <p className="small mb-0">Utilize o formulário acima para criar sua primeira sala de Blackjack!</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th style={{ width: "120px" }}>Código</th>
                                            <th>Nome da Sala</th>
                                            <th className="text-center" style={{ width: "160px" }}>Compartilhar</th>
                                            <th className="text-right" style={{ width: "160px" }}>Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salas.map((sala) => (
                                            <tr key={sala.id}>
                                                <td>
                                                    <span className="badge badge-dark px-2 py-1 font-weight-bold">
                                                        #{sala.id}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong className="text-dark">{sala.nome}</strong>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        className="btn btn-light btn-sm border text-secondary"
                                                        onClick={() => copiarCodigo(sala.id)}
                                                        title="Copiar código da sala"
                                                    >
                                                        <i className="fas fa-copy mr-1"></i>
                                                        {copiadoId === sala.id ? (
                                                            <span className="text-success font-weight-bold">Copiado!</span>
                                                        ) : (
                                                            <span>Copiar #{sala.id}</span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        className="btn btn-warning btn-sm font-weight-bold text-dark px-3 shadow-sm"
                                                        onClick={() => handleEntrarPorCodigo(null, sala.id)}
                                                    >
                                                        <i className="fas fa-play mr-1"></i> Jogar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-top py-3 text-center text-muted small">
                FIPP21 - Plataforma de Jogo 21 Multiplayer &bull; Sessão ativa como {usuario?.nome}
            </footer>
        </div>
    );
}

