'use client';

import Link from "next/link";
import { useAuth } from "./context/AuthContext";

export default function PaginaInstitucional() {
    const { usuario, carregando } = useAuth();

    return (
        <div className="bg-light min-vh-100 d-flex flex-column">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-3">
                <div className="container">
                    <Link className="navbar-brand font-weight-bold d-flex align-items-center" href="/">
                        <i className="fas fa-dice text-warning mr-2 fa-lg"></i>
                        <span className="text-white">FIPP<span className="text-warning">21</span></span>
                    </Link>
                    <div className="ml-auto d-flex align-items-center">
                        {!carregando && (
                            usuario ? (
                                <div className="d-flex align-items-center">
                                    <span className="text-white-50 mr-3 d-none d-sm-inline">
                                        Olá, <strong className="text-white">{usuario.nome}</strong>
                                    </span>
                                    <Link className="btn btn-warning btn-sm font-weight-bold px-3 shadow-sm" href="/salas">
                                        <i className="fas fa-gamepad mr-1"></i> Ir para o Lobby
                                    </Link>
                                </div>
                            ) : (
                                <div className="d-flex">
                                    <Link className="btn btn-outline-light btn-sm mr-2 px-3" href="/login">
                                        <i className="fas fa-sign-in-alt mr-1"></i> Entrar
                                    </Link>
                                    <Link className="btn btn-warning btn-sm font-weight-bold px-3 text-dark" href="/cadastro">
                                        Cadastrar
                                    </Link>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="py-5" style={{
                background: "linear-gradient(135deg, #6c1256, #22031d)",
                color: "#ffffff",
                borderBottom: "4px solid #d4af37"
            }}>
                <div className="container py-4 text-center">
                    <span className="badge badge-warning text-dark px-3 py-2 text-uppercase font-weight-bold mb-3 shadow-sm">
                        Plataforma Oficial de Blackjack Multiplayer
                    </span>
                    <h1 className="display-4 font-weight-bold mb-3">
                        Desafie o Crupiê no <span className="text-warning">FIPP21</span>
                    </h1>
                    <p className="lead text-white-50 mx-auto mb-4" style={{ maxWidth: "720px" }}>
                        Entre em salas em tempo real com seus colegas, faça suas apostas, compre cartas e teste sua estratégia no clássico jogo 21 (Blackjack).
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                        <Link className="btn btn-warning btn-lg font-weight-bold text-dark px-4 mr-3 shadow" href={usuario ? "/salas" : "/login"}>
                            <i className="fas fa-play mr-2"></i> {usuario ? "Acessar Salas de Jogo" : "Jogar Agora"}
                        </Link>
                        <a className="btn btn-outline-light btn-lg px-4" href="#regras">
                            <i className="fas fa-book-open mr-2"></i> Ver as Regras
                        </a>
                    </div>
                </div>
            </header>

            {/* Destaques / Features */}
            <section className="py-5 bg-white">
                <div className="container">
                    <div className="row text-center">
                        <div className="col-md-4 mb-4">
                            <div className="card border-0 shadow-sm h-100 p-4">
                                <div className="text-primary mb-3">
                                    <i className="fas fa-users fa-3x"></i>
                                </div>
                                <h4 className="font-weight-bold text-dark">Salas Multiplayer</h4>
                                <p className="text-muted mb-0">
                                    Crie salas com código exclusivo ou participe das salas dos seus amigos. Até 7 jogadores disputando contra o Crupiê na mesma mesa.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="card border-0 shadow-sm h-100 p-4">
                                <div className="text-warning mb-3">
                                    <i className="fas fa-bolt fa-3x"></i>
                                </div>
                                <h4 className="font-weight-bold text-dark">Tempo Real via WebSocket</h4>
                                <p className="text-muted mb-0">
                                    Cartas distribuídas instantaneamente, contagem de pontos sincronizada e turnos dinâmicos sem necessidade de recarregar a página.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="card border-0 shadow-sm h-100 p-4">
                                <div className="text-success mb-3">
                                    <i className="fas fa-coins fa-3x"></i>
                                </div>
                                <h4 className="font-weight-bold text-dark">Banca Inicial de R$ 1.000</h4>
                                <p className="text-muted mb-0">
                                    Todos os participantes começam com R$ 1.000 em fichas. Ganhe 1:1 nas vitórias e 3:2 no lendário Blackjack natural!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Regras do Jogo */}
            <section id="regras" className="py-5 bg-light border-top">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="font-weight-bold text-dark">Regras do 21 (Blackjack)</h2>
                        <p className="text-muted lead">Conheça o regulamento oficial e a mecânica das partidas</p>
                    </div>

                    <div className="row mb-5">
                        <div className="col-lg-6 mb-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-dark text-white font-weight-bold d-flex align-items-center">
                                    <i className="fas fa-bullseye text-warning mr-2"></i> Objetivo do Jogo
                                </div>
                                <div className="card-body">
                                    <p className="text-dark">
                                        O objetivo é obter uma pontuação maior que a do <strong>Crupiê (Dealer)</strong> sem ultrapassar <strong>21 pontos</strong>.
                                    </p>
                                    <div className="alert alert-info py-2 mb-0">
                                        <i className="fas fa-info-circle mr-1"></i> Cada jogador compete individualmente contra o Crupiê, nunca entre si!
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 mb-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-dark text-white font-weight-bold d-flex align-items-center">
                                    <i className="fas fa-layer-group text-warning mr-2"></i> Valores das Cartas
                                </div>
                                <div className="card-body">
                                    <ul className="list-group list-group-flush text-dark">
                                        <li className="list-group-item px-0 py-2">
                                            <strong>Cartas Numéricas (2 a 10):</strong> Valem seu valor de face.
                                        </li>
                                        <li className="list-group-item px-0 py-2">
                                            <strong>Figuras (Valete, Dama, Rei):</strong> Valem 10 pontos cada.
                                        </li>
                                        <li className="list-group-item px-0 py-2">
                                            <strong>Ás (A):</strong> Vale 1 ou 11 pontos, dependendo do que for mais vantajoso para a sua mão.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-dark text-white font-weight-bold">
                            <i className="fas fa-play-circle text-warning mr-2"></i> Como Funciona Cada Rodada
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-3 mb-3">
                                    <div className="p-3 bg-light rounded border h-100">
                                        <h5 className="font-weight-bold text-primary">1. Apostas</h5>
                                        <p className="small text-muted mb-0">
                                            Antes das cartas serem dadas, cada jogador faz sua aposta individual (mínimo de R$ 10).
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-3">
                                    <div className="p-3 bg-light rounded border h-100">
                                        <h5 className="font-weight-bold text-primary">2. Distribuição</h5>
                                        <p className="small text-muted mb-0">
                                            Cada jogador recebe 2 cartas visíveis. O dealer recebe 1 visível e 1 oculta (virada para baixo).
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-3">
                                    <div className="p-3 bg-light rounded border h-100">
                                        <h5 className="font-weight-bold text-primary">3. Turnos</h5>
                                        <p className="small text-muted mb-0">
                                            Na sua vez, escolha <strong>Pedir Carta (Hit)</strong> para somar pontos ou <strong>Parar (Stand)</strong>. Se passar de 21, estoura (bust)!
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-3">
                                    <div className="p-3 bg-light rounded border h-100">
                                        <h5 className="font-weight-bold text-primary">4. Crupiê</h5>
                                        <p className="small text-muted mb-0">
                                            O dealer revela a carta oculta e segue regras automáticas: compra obrigatoriamente com 16 ou menos, e para com 17 ou mais.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagamentos */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-dark text-white font-weight-bold">
                            <i className="fas fa-trophy text-warning mr-2"></i> Tabela de Resolução e Pagamentos
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-striped table-hover mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Cenário</th>
                                            <th>Resultado</th>
                                            <th>Retorno Financeiro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Blackjack Natural (21 com 2 cartas)</strong></td>
                                            <td><span className="badge badge-warning text-dark">Blackjack</span></td>
                                            <td>Recebe aposta de volta + ganho de 3:2 (Aposta R$ 50 &rarr; Total R$ 125)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Pontuação maior que o Crupiê (sem estourar)</strong></td>
                                            <td><span className="badge badge-success">Vitória</span></td>
                                            <td>Recebe aposta de volta + ganho 1:1 (Aposta R$ 50 &rarr; Total R$ 100)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Crupiê estoura (mais de 21)</strong></td>
                                            <td><span className="badge badge-success">Vitória</span></td>
                                            <td>Todos os jogadores ativos que não estouraram vencem (1:1)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Mesma pontuação que o Crupiê</strong></td>
                                            <td><span className="badge badge-info">Empate (Push)</span></td>
                                            <td>Aposta é devolvida integralmente (sem perdas ou ganhos)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Estourou (&gt; 21) ou pontuação menor que o Crupiê</strong></td>
                                            <td><span className="badge badge-danger">Derrota</span></td>
                                            <td>Perde o valor apostado na rodada</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-dark text-white-50 py-4 mt-auto">
                <div className="container text-center">
                    <p className="mb-1 text-white font-weight-bold">FIPP21 - Projeto de Jogo 21 Multiplayer</p>
                    <small>Desenvolvido para a disciplina de Prática de Fábrica de Software (PFS2)</small>
                </div>
            </footer>
        </div>
    );
}

