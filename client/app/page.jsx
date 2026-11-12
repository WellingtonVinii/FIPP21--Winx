'use client';

import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import styles from "./home.module.css";

export default function PaginaInstitucional() {
    const { usuario, carregando } = useAuth();

    return (
        <div className={styles.pagina}>
            {/* Cabeçalho */}
            <nav className={styles.header}>
                <div className={`container ${styles.headerInner}`}>
                    <Link className={styles.brand} href="/">
                        <i className="fas fa-magic"></i>
                        <span>FIPP<span className={styles.destaque}>21</span></span>
                    </Link>
                    <div className={styles.headerAcoes}>
                        {!carregando && (
                            usuario ? (
                                <>
                                    <span className={styles.saudacao}>
                                        Olá, <strong>{usuario.nome}</strong>
                                    </span>
                                    <Link className={styles.btnDourado} href="/salas">
                                        <i className="fas fa-gamepad"></i> Ir para o Lobby
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link className={styles.btnContorno} href="/login">
                                        <i className="fas fa-sign-in-alt"></i> Entrar
                                    </Link>
                                    <Link className={styles.btnDourado} href="/cadastro">
                                        Cadastrar
                                    </Link>
                                </>
                            )
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <header className={styles.hero}>
                <div className="container">
                    <span className={styles.heroSelo}>
                        ✨ Plataforma Oficial de Blackjack Multiplayer
                    </span>
                    <h1 className={styles.heroTitulo}>
                        Desafie o Crupiê no <span className={styles.destaque}>FIPP21</span>
                    </h1>
                    <p className={styles.heroTexto}>
                        Entre em salas em tempo real com seus colegas, faça suas apostas, compre cartas e teste sua estratégia no clássico jogo 21 (Blackjack).
                    </p>
                    <div className={styles.heroAcoes}>
                        <Link className={styles.btnPrincipal} href={usuario ? "/salas" : "/login"}>
                            <i className="fas fa-play"></i> {usuario ? "Acessar Salas de Jogo" : "Jogar Agora"}
                        </Link>
                        <a className={styles.btnSecundario} href="#regras">
                            <i className="fas fa-book-open"></i> Ver as Regras
                        </a>
                    </div>
                </div>
            </header>

            {/* Destaques */}
            <section className={styles.secao}>
                <div className="container">
                    <div className="row">
                        <div className="col-md-4 mb-4">
                            <div className={styles.destaqueCard}>
                                <div className={styles.destaqueIcone}>
                                    <i className="fas fa-users"></i>
                                </div>
                                <h4>Salas Multiplayer</h4>
                                <p>
                                    Crie salas com código exclusivo ou participe das salas dos seus amigos. Até 4 jogadores disputando contra o Crupiê na mesma mesa.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className={styles.destaqueCard}>
                                <div className={styles.destaqueIcone}>
                                    <i className="fas fa-bolt"></i>
                                </div>
                                <h4>Tempo Real via WebSocket</h4>
                                <p>
                                    Cartas distribuídas instantaneamente, contagem de pontos sincronizada e turnos dinâmicos sem necessidade de recarregar a página.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className={styles.destaqueCard}>
                                <div className={styles.destaqueIcone}>
                                    <i className="fas fa-gem"></i>
                                </div>
                                <h4>Banca Inicial de R$ 1.000</h4>
                                <p>
                                    Todos os participantes começam com R$ 1.000 em fichas. Ganhe 1:1 nas vitórias e 3:2 no lendário Blackjack natural!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Regras do Jogo */}
            <section id="regras" className={`${styles.secao} ${styles.secaoRegras}`}>
                <div className="container">
                    <h2 className={styles.secaoTitulo}>Regras do 21 (Blackjack)</h2>
                    <p className={styles.secaoSubtitulo}>Conheça o regulamento oficial e a mecânica das partidas</p>

                    <div className="row">
                        <div className="col-lg-6 mb-4">
                            <div className={styles.painel}>
                                <div className={styles.painelHeader}>
                                    <i className="fas fa-bullseye"></i> Objetivo do Jogo
                                </div>
                                <div className={styles.painelBody}>
                                    <p>
                                        O objetivo é obter uma pontuação maior que a do <strong>Crupiê (Dealer)</strong> sem ultrapassar <strong>21 pontos</strong>.
                                    </p>
                                    <div className={styles.aviso}>
                                        <i className="fas fa-info-circle"></i>
                                        <span>Cada jogador compete individualmente contra o Crupiê, nunca entre si!</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 mb-4">
                            <div className={styles.painel}>
                                <div className={styles.painelHeader}>
                                    <i className="fas fa-layer-group"></i> Valores das Cartas
                                </div>
                                <div className={styles.painelBody}>
                                    <ul className={styles.listaCartas}>
                                        <li>
                                            <strong>Cartas Numéricas (2 a 10):</strong> Valem seu valor de face.
                                        </li>
                                        <li>
                                            <strong>Figuras (Valete, Dama, Rei):</strong> Valem 10 pontos cada.
                                        </li>
                                        <li>
                                            <strong>Ás (A):</strong> Vale 1 ou 11 pontos, dependendo do que for mais vantajoso para a sua mão.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.painel} ${styles.painelLargo}`}>
                        <div className={styles.painelHeader}>
                            <i className="fas fa-play-circle"></i> Como Funciona Cada Rodada
                        </div>
                        <div className={styles.painelBody}>
                            <div className="row">
                                <div className="col-md-6 col-lg-3 mb-3">
                                    <div className={styles.etapa}>
                                        <span className={styles.etapaNumero}>1</span>
                                        <h5>Apostas</h5>
                                        <p>
                                            Antes das cartas serem dadas, cada jogador faz sua aposta individual (mínimo de R$ 10).
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-6 col-lg-3 mb-3">
                                    <div className={styles.etapa}>
                                        <span className={styles.etapaNumero}>2</span>
                                        <h5>Distribuição</h5>
                                        <p>
                                            Cada jogador recebe 2 cartas visíveis. O dealer recebe 1 visível e 1 oculta (virada para baixo).
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-6 col-lg-3 mb-3">
                                    <div className={styles.etapa}>
                                        <span className={styles.etapaNumero}>3</span>
                                        <h5>Turnos</h5>
                                        <p>
                                            Na sua vez, escolha <strong>Pedir Carta (Hit)</strong> para somar pontos ou <strong>Parar (Stand)</strong>. Se passar de 21, estoura (bust)!
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-6 col-lg-3 mb-3">
                                    <div className={styles.etapa}>
                                        <span className={styles.etapaNumero}>4</span>
                                        <h5>Crupiê</h5>
                                        <p>
                                            O dealer revela a carta oculta e segue regras automáticas: compra obrigatoriamente com 16 ou menos, e para com 17 ou mais.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagamentos */}
                    <div className={`${styles.painel} ${styles.painelLargo}`}>
                        <div className={styles.painelHeader}>
                            <i className="fas fa-trophy"></i> Tabela de Resolução e Pagamentos
                        </div>
                        <div className={styles.tabelaWrap}>
                            <table className={styles.tabela}>
                                <thead>
                                    <tr>
                                        <th>Cenário</th>
                                        <th>Resultado</th>
                                        <th>Retorno Financeiro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Blackjack Natural (21 com 2 cartas)</strong></td>
                                        <td><span className={`${styles.selo} ${styles.seloBlackjack}`}>Blackjack</span></td>
                                        <td>Recebe aposta de volta + ganho de 3:2 (Aposta R$ 50 &rarr; Total R$ 125)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Pontuação maior que o Crupiê (sem estourar)</strong></td>
                                        <td><span className={`${styles.selo} ${styles.seloVitoria}`}>Vitória</span></td>
                                        <td>Recebe aposta de volta + ganho 1:1 (Aposta R$ 50 &rarr; Total R$ 100)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Crupiê estoura (mais de 21)</strong></td>
                                        <td><span className={`${styles.selo} ${styles.seloVitoria}`}>Vitória</span></td>
                                        <td>Todos os jogadores ativos que não estouraram vencem (1:1)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Mesma pontuação que o Crupiê</strong></td>
                                        <td><span className={`${styles.selo} ${styles.seloEmpate}`}>Empate (Push)</span></td>
                                        <td>Aposta é devolvida integralmente (sem perdas ou ganhos)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Estourou (&gt; 21) ou pontuação menor que o Crupiê</strong></td>
                                        <td><span className={`${styles.selo} ${styles.seloDerrota}`}>Derrota</span></td>
                                        <td>Perde o valor apostado na rodada</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Rodapé */}
            <footer className={styles.footer}>
                <p>FIPP21 - Projeto de Jogo 21 Multiplayer</p>
                <small>Desenvolvido para a disciplina de Prática de Fábrica de Software (PFS2)</small>
            </footer>
        </div>
    );
}
