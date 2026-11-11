'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { obterSocket } from '../../utils/socket';
import styles from '../mesa.module.css';

const VERSO_CARTA = "https://deckofcardsapi.com/static/img/back.png";
const API_URL = "http://localhost:5000";

export default function MesaJogoPage({ params }) {
    const routeParams = useParams();
    // Desempacota params de forma segura para Next.js 15/16 App Router
    const resolvedParams = typeof React.use === 'function' && params ? React.use(params) : (params || routeParams);
    const salaId = Number(resolvedParams?.id || routeParams?.id);

    const { usuario, carregando: authCarregando } = useAuth();
    const router = useRouter();

    const [sala, setSala] = useState(null);
    const [participantes, setParticipantes] = useState([]);
    const [jogo, setJogo] = useState(null);
    const [carregandoMesa, setCarregandoMesa] = useState(true);

    const [socketConectado, setSocketConectado] = useState(false);
    const [valorAposta, setValorAposta] = useState(10);
    const [processandoAcao, setProcessandoAcao] = useState(false);
    const [notificacao, setNotificacao] = useState(null);
    const [copiado, setCopiado] = useState(false);
    const [drawerAberto, setDrawerAberto] = useState(false);
    const [confirmandoSaida, setConfirmandoSaida] = useState(false);
    const [saindo, setSaindo] = useState(false);

    // Contagem regressiva em segundos calculada a partir de jogo.prazo
    const [tempoRestante, setTempoRestante] = useState(null);

    const socketRef = useRef(null);

    function mostrarMensagem(texto, tipo = 'info') {
        setNotificacao({ texto, tipo });
        setTimeout(() => {
            setNotificacao((atual) => (atual?.texto === texto ? null : atual));
        }, 4000);
    }

    // Inicialização da sala e conexão do socket
    useEffect(() => {
        if (authCarregando) return;

        // sem sessão validada ou com código inválido não há como abrir a mesa: volta para o lobby
        if (!usuario || !salaId) {
            router.replace('/salas');
            return;
        }

        let socket = null;

        async function inicializarMesa() {
            try {
                // 1. Garante que o participante está registrado na sala
                const resEntrar = await fetch(`${API_URL}/sala/${salaId}/entrar`, {
                    method: 'POST',
                    credentials: 'include'
                });

                if (!resEntrar.ok) {
                    const erroData = await resEntrar.json();
                    throw new Error(erroData?.msg || 'Erro ao entrar na sala.');
                }

                // 2. Busca informações da sala
                const resSala = await fetch(`${API_URL}/sala/${salaId}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (resSala.ok) {
                    const dadosSala = await resSala.json();
                    setSala(dadosSala);
                    setParticipantes(dadosSala.participantes || []);
                }

                // 3. Conecta WebSocket
                socket = obterSocket();
                socketRef.current = socket;

                socket.on('connect', () => {
                    setSocketConectado(true);
                    socket.emit('sala:entrar', salaId);
                });

                socket.on('disconnect', () => {
                    setSocketConectado(false);
                });

                socket.on('connect_error', (erro) => {
                    console.error('Falha na conexão em tempo real:', erro?.message);
                    setSocketConectado(false);
                });

                socket.on('sala:participantes', (lista) => {
                    setParticipantes(Array.isArray(lista) ? lista : []);
                });

                socket.on('jogo:estado', (estado) => {
                    setJogo(estado);
                    setCarregandoMesa(false);
                });

                socket.on('jogo:erro', ({ msg }) => {
                    mostrarMensagem(msg || 'Erro ao processar jogada.', 'danger');
                });

                socket.on('erro', ({ msg }) => {
                    mostrarMensagem(msg || 'Erro na sala.', 'danger');
                });

                socket.on('sala:removido', (dados) => {
                    if (Number(dados?.sala) === salaId) {
                        alert('Você foi removido da sala.');
                        router.push('/salas');
                    }
                });

            } catch (ex) {
                console.error('Falha ao inicializar mesa:', ex);
                mostrarMensagem(ex.message, 'danger');
                setTimeout(() => router.push('/salas'), 2500);
            }
        }

        inicializarMesa();

        return () => {
            if (socket) {
                socket.emit('sala:sair', salaId);
                socket.disconnect();
            }
        };
    }, [authCarregando, usuario, salaId]);

    // Atualização contínua do timer de prazo
    useEffect(() => {
        if (!jogo?.prazo) {
            setTempoRestante(null);
            return;
        }

        function atualizarTimer() {
            const agora = Date.now();
            const diferenca = Math.ceil((jogo.prazo - agora) / 1000);
            setTempoRestante(diferenca > 0 ? diferenca : 0);
        }

        atualizarTimer();
        const intervalo = setInterval(atualizarTimer, 500);
        return () => clearInterval(intervalo);
    }, [jogo?.prazo]);

    // Identificação do jogador atual na mesa
    const meuParticipante = participantes.find((p) => p.usuario?.id === usuario?.id);
    const meuJogador = jogo?.jogadores?.find((j) => j.usuario?.id === usuario?.id);
    const saldoAtual = meuJogador ? meuJogador.saldo : (meuParticipante?.saldo ?? 1000);
    const ehMinhaVez = jogo?.fase === 'jogando' && meuJogador && jogo?.vez === meuJogador.participante;

    // Ações do Jogo
    function handleApostar() {
        if (!socketRef.current || processandoAcao) return;
        const valor = Number(valorAposta);

        if (isNaN(valor) || valor < 10) {
            mostrarMensagem("A aposta mínima é de R$ 10,00.", "warning");
            return;
        }
        if (valor > saldoAtual) {
            mostrarMensagem(`Saldo insuficiente! Seu saldo é de R$ ${saldoAtual.toFixed(2)}.`, "warning");
            return;
        }

        setProcessandoAcao(true);
        socketRef.current.emit('jogo:apostar', { salaId, valor }, (resposta) => {
            setProcessandoAcao(false);
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.msg || "Erro ao realizar aposta.", "danger");
            } else {
                mostrarMensagem(`Aposta de R$ ${valor.toFixed(2)} confirmada!`, "success");
            }
        });
    }

    function handlePedirCarta() {
        if (!socketRef.current || processandoAcao || !ehMinhaVez) return;
        setProcessandoAcao(true);
        socketRef.current.emit('jogo:pedir', { salaId }, (resposta) => {
            setProcessandoAcao(false);
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.msg || "Não foi possível pedir carta.", "danger");
            }
        });
    }

    function handleParar() {
        if (!socketRef.current || processandoAcao || !ehMinhaVez) return;
        setProcessandoAcao(true);
        socketRef.current.emit('jogo:parar', { salaId }, (resposta) => {
            setProcessandoAcao(false);
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.msg || "Não foi possível parar o turno.", "danger");
            }
        });
    }

    function handleNovaRodada() {
        if (!socketRef.current || processandoAcao) return;
        setProcessandoAcao(true);
        socketRef.current.emit('jogo:novaRodada', { salaId }, (resposta) => {
            setProcessandoAcao(false);
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.msg || "Não foi possível iniciar a rodada.", "danger");
            }
        });
    }

    async function handleSairDaSala() {
        setSaindo(true);
        try {
            if (socketRef.current) {
                socketRef.current.emit('sala:sair', salaId);
            }
            await fetch(`${API_URL}/sala/${salaId}/sair`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (ex) {
            console.error('Erro ao sair:', ex);
        } finally {
            router.push('/salas');
        }
    }

    function copiarCodigo() {
        navigator.clipboard.writeText(String(salaId));
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    function adicionarFicha(valor) {
        setValorAposta((prev) => {
            const novo = (Number(prev) || 0) + valor;
            return Math.min(novo, saldoAtual);
        });
    }

    // Tela de carregamento
    if (carregandoMesa && !jogo) {
        return (
            <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-white" style={{ background: 'radial-gradient(circle at 50% 30%, #2e083d 0%, #150221 65%, #090010 100%)' }}>
                <i className="fas fa-wand-magic-sparkles fa-spin fa-3x mb-3" style={{ color: '#ff2a85' }}></i>
                <h4 className="font-weight-bold" style={{ color: '#ffd700' }}>Conectando à Mesa de Alfea #{salaId}...</h4>
                <p className="text-white-50">Sintonizando o poder das fadas em tempo real ✨</p>
            </div>
        );
    }

    return (
        <div className={styles.mesaContainer}>
            {/* Header da Mesa */}
            <header className={styles.mesaHeader}>
                <div className={styles.mesaHeaderTitle}>
                    <button
                        className="btn btn-outline-danger btn-sm font-weight-bold"
                        onClick={() => setConfirmandoSaida(true)}
                        title="Sair da sala de jogo"
                    >
                        <i className="fas fa-arrow-left mr-1"></i> Sair da Mesa
                    </button>
                    <div>
                        <h5 className="font-weight-bold text-white mb-0 d-flex align-items-center">
                            <span>{sala?.nome || `Sala #${salaId}`}</span>
                            <span
                                className={`ml-2 ${styles.codigoBadge}`}
                                onClick={copiarCodigo}
                                title="Clique para copiar o código da sala"
                            >
                                <i className="fas fa-sparkles mr-1 text-warning"></i>
                                #{salaId} {copiado ? '(Copiado!)' : ''}
                            </span>
                        </h5>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <span className="badge p-2 text-white-50 mr-2" style={{ background: 'rgba(35, 4, 30, 0.9)', border: '1px solid rgba(255, 42, 133, 0.4)' }}>
                        <i className={`fas fa-circle mr-1 ${socketConectado ? 'text-success' : 'text-danger'}`}></i>
                        {socketConectado ? 'Ao vivo ✨' : 'Reconectando...'}
                    </span>

                    <button
                        className="btn btn-sm text-white mr-2"
                        style={{ background: 'rgba(45, 6, 38, 0.95)', border: '1.5px solid rgba(255, 112, 166, 0.5)' }}
                        onClick={() => setDrawerAberto(true)}
                    >
                        <i className="fas fa-sparkles mr-1 text-warning"></i>
                        <span>Fadas na Mesa ({participantes.length}/4)</span>
                    </button>

                    <div className="d-flex align-items-center px-2 px-md-3 py-1 rounded shadow-sm" style={{ background: 'rgba(45, 6, 38, 0.95)', border: '1.5px solid #ff70a6' }}>
                        <i className="fas fa-gem text-warning mr-2"></i>
                        <div>
                            <small className="d-block font-weight-bold" style={{ fontSize: '0.65rem', color: '#ffd700' }}>MEU SALDO MÁGICO</small>
                            <span className="font-weight-bold" style={{ fontSize: '0.95rem', color: '#ffe66d' }}>
                                R$ {saldoAtual.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Notificação Toast */}
            {notificacao && (
                <div
                    className={`alert alert-${notificacao.tipo} position-fixed shadow-lg`}
                    style={{ top: '65px', left: '50%', transform: 'translateX(-50%)', zIndex: 1050, minWidth: '320px', textAlign: 'center' }}
                    role="alert"
                >
                    <i className="fas fa-info-circle mr-2"></i>
                    <strong>{notificacao.texto}</strong>
                </div>
            )}

            {/* O Campo do Feltro Verde */}
            <main className={styles.feltTableArea}>
                <div className={styles.feltTable}>
                    {/* Marcas de água clássicas da mesa com Tema Winx */}
                    <div className={styles.feltRulesWatermark}>
                        <div className={styles.feltRulesText}>✨ CLUBE DAS WINX • ENCHANTIX 21 ✨</div>
                        <div className={styles.feltRulesSubtext}>Poder Mágico de Alfea • Crupiê para a partir de 17</div>
                    </div>
                    <div className={styles.feltArcLine}></div>

                    {/* Crupiê / Dealer (Diretora Faragonda) */}
                    <section className={styles.dealerSection}>
                        <div className={styles.dealerBadge}>
                            <i className="fas fa-crown mr-1"></i>
                            <span>Diretora Faragonda (Crupiê)</span>
                        </div>

                        {/* Cartas do Dealer */}
                        <div className={styles.cardsRow}>
                            {jogo?.dealer?.cartas && jogo.dealer.cartas.length > 0 ? (
                                jogo.dealer.cartas.map((carta, index) => (
                                    <img
                                        key={index}
                                        src={carta.oculta ? VERSO_CARTA : carta.imagem}
                                        alt={carta.oculta ? "Carta Oculta" : `${carta.valor} de ${carta.naipe}`}
                                        className={styles.cardItem}
                                    />
                                ))
                            ) : (
                                <div className="text-white-50 font-italic small py-4">
                                    <i className="fas fa-clone mr-1"></i> Aguardando distribuição das cartas
                                </div>
                            )}
                        </div>

                        {/* Pontuação do Dealer */}
                        {jogo?.dealer?.cartas && jogo.dealer.cartas.length > 0 && (
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <span className={styles.scorePill}>
                                    Pontos: {jogo.dealer.soma}
                                </span>
                                {jogo.dealer.status === "Estourou" && (
                                    <span className="badge badge-danger font-weight-bold px-2 py-1">
                                        ESTOUROU!
                                    </span>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Centro da Mesa: Status da Fase & Cronômetro Mágico */}
                    <section className={styles.tableCenter}>
                        {jogo?.fase === 'aguardando' && (
                            <div className="text-center">
                                <div className={styles.phasePill}>
                                    <i className="fas fa-magic mr-1"></i>
                                    <span>Mesa Encantada Aguardando</span>
                                </div>
                                <p className="text-white-50 small mb-2">
                                    Clique abaixo para conjurar e iniciar a rodada com as fadas
                                </p>
                                <button
                                    className={styles.btnNovaRodada}
                                    onClick={handleNovaRodada}
                                    disabled={processandoAcao}
                                >
                                    <i className="fas fa-wand-magic-sparkles mr-2"></i> Conjurar Rodada ✨
                                </button>
                            </div>
                        )}

                        {jogo?.fase === 'apostas' && (
                            <div className="text-center">
                                <div className={styles.phasePill}>
                                    <i className="fas fa-gem text-warning mr-1"></i>
                                    <span>Apostas Mágicas</span>
                                    {tempoRestante !== null && (
                                        <span className="badge badge-warning text-dark ml-2">
                                            {tempoRestante}s
                                        </span>
                                    )}
                                </div>
                                <div className={styles.timerBar}>
                                    <div
                                        className={styles.timerFill}
                                        style={{ width: `${Math.min(100, ((tempoRestante ?? 0) / 30) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {jogo?.fase === 'jogando' && (
                            <div className="text-center">
                                <div className={styles.phasePill}>
                                    <i className="fas fa-bolt text-warning mr-1"></i>
                                    <span>Turno das Fadas</span>
                                    {tempoRestante !== null && (
                                        <span className="badge badge-light text-dark ml-2">
                                            {tempoRestante}s
                                        </span>
                                    )}
                                </div>
                                <div className={styles.timerBar}>
                                    <div
                                        className={styles.timerFill}
                                        style={{ width: `${Math.min(100, ((tempoRestante ?? 0) / 30) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {jogo?.fase === 'dealer' && (
                            <div className="text-center">
                                <div className={styles.phasePill} style={{ borderColor: '#ff2a85', color: '#ffc6ff' }}>
                                    <i className="fas fa-crown mr-1"></i>
                                    <span>Magia de Alfea (Crupiê)</span>
                                </div>
                                <p className="text-white-50 small mb-0">A Guardiã compra até 16 e para a partir de 17...</p>
                            </div>
                        )}

                        {jogo?.fase === 'finalizada' && (
                            <div className="text-center">
                                <div className={styles.phasePill} style={{ borderColor: '#06d6a0', color: '#70e000' }}>
                                    <i className="fas fa-star text-warning mr-1"></i>
                                    <span>Rodada Encantada Finalizada</span>
                                    {tempoRestante !== null && (
                                        <span className="badge badge-light text-dark ml-2">
                                            {tempoRestante}s
                                        </span>
                                    )}
                                </div>
                                <p className="text-white-50 small mb-0">
                                    Próxima rodada iniciando em instantes...
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Assentos dos Jogadores (Arco Inferior) */}
                    <section className={styles.playersArc}>
                        {jogo?.jogadores && jogo.jogadores.length > 0 ? (
                            jogo.jogadores.map((jogador) => {
                                const ehMeuCard = jogador.usuario?.id === usuario?.id;
                                const ehVezDele = jogo.fase === 'jogando' && jogo.vez === jogador.participante;

                                return (
                                    <div
                                        key={jogador.participante}
                                        className={`${styles.playerStation} ${ehMeuCard ? styles.playerStationVoce : ''} ${ehVezDele ? styles.playerStationVez : ''}`}
                                    >
                                        {ehVezDele && (
                                            <div className={styles.turnIndicatorBadge}>
                                                <i className="fas fa-star mr-1"></i> {ehMeuCard ? "Sua Vez Mágica! ✨" : "Jogando ✨"}
                                            </div>
                                        )}

                                        <div className={styles.playerHeader}>
                                            <span className={styles.playerName} title={jogador.usuario?.nome}>
                                                {jogador.usuario?.nome}
                                            </span>
                                            {ehMeuCard && <span className={styles.voceTag}>Você</span>}
                                        </div>

                                        <div className={styles.playerDetails}>
                                            <span className={styles.playerSaldo}>
                                                R$ {jogador.saldo.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Aposta do Jogador */}
                                        {jogador.aposta ? (
                                            <div className={styles.playerApostaChip}>
                                                <i className="fas fa-gem text-warning"></i>
                                                <span>Aposta: R$ {jogador.aposta.toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <div className="text-white-50 small mb-2 font-italic">
                                                Aguardando aposta
                                            </div>
                                        )}

                                        {/* Cartas do Jogador */}
                                        <div className={styles.cardsRow} style={{ minHeight: '85px' }}>
                                            {jogador.cartas && jogador.cartas.length > 0 ? (
                                                jogador.cartas.map((c, i) => (
                                                    <img
                                                        key={i}
                                                        src={c.imagem}
                                                        alt={`${c.valor} de ${c.naipe}`}
                                                        className={styles.cardItem}
                                                        style={{ width: '60px', height: '84px' }}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-white-50 small font-italic py-3">Sem cartas</div>
                                            )}
                                        </div>

                                        {/* Pontuação */}
                                        {jogador.cartas && jogador.cartas.length > 0 && (
                                            <div className="mt-1">
                                                <span className={styles.scorePill}>
                                                    {jogador.soma} pts
                                                </span>
                                            </div>
                                        )}

                                        {/* Badges de Resultado / Status */}
                                        {jogador.blackjack && (
                                            <div className={styles.resultadoBadgeBlackjack}>
                                                ★ ENCHANTIX! (BLACKJACK) ★
                                            </div>
                                        )}

                                        {jogador.status === 'Estourou' && (
                                            <div className={styles.resultadoBadgeBust}>
                                                FEITIÇO ESTOUROU!
                                            </div>
                                        )}

                                        {jogo.fase === 'finalizada' && jogador.resultado && (
                                            <>
                                                {jogador.resultado === 'Ganhou' && (
                                                    <div className={styles.resultadoBadgeWin}>
                                                        VITÓRIA MÁGICA! (+R$ {jogador.pagamento?.toFixed(2)})
                                                    </div>
                                                )}
                                                {jogador.resultado === 'Empate' && (
                                                    <div className={styles.resultadoBadgePush}>
                                                        EMPATE ENCANTADO
                                                    </div>
                                                )}
                                                {jogador.resultado === 'Perdeu' && (
                                                    <div className={styles.resultadoBadgeLoss}>
                                                        PERDEU APOSTA
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-white-50 py-4 w-100">
                                <p className="mb-0">Aguardando participantes elegíveis entrarem na rodada...</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Painel Inferior de Controle / Ações do Jogador */}
            <footer className={styles.actionDock}>
                {/* 1. Painel da Fase de Apostas */}
                {jogo?.fase === 'apostas' && (
                    <div className={styles.betPanel}>
                        {meuJogador?.aposta ? (
                            <div className="d-flex align-items-center text-warning font-weight-bold">
                                <i className="fas fa-check-circle mr-2 fa-lg text-success"></i>
                                <span>Aposta confirmada: R$ {meuJogador.aposta.toFixed(2)}. Aguardando os demais jogadores...</span>
                            </div>
                        ) : (
                            <>
                                <span className="font-weight-bold text-white small mr-2">
                                    ESCOLHA SUAS GEMAS MÁGICAS <span className="text-white-50">(Saldo: <strong className="text-warning">R$ {saldoAtual.toFixed(2)}</strong>)</span>:
                                </span>
                                <div className={styles.chipsContainer}>
                                    <div className={`${styles.chipBtn} ${styles.chip10}`} onClick={() => adicionarFicha(10)} title="Bloom (Fogo do Dragão) +10">10</div>
                                    <div className={`${styles.chipBtn} ${styles.chip25}`} onClick={() => adicionarFicha(25)} title="Flora (Natureza) +25">25</div>
                                    <div className={`${styles.chipBtn} ${styles.chip50}`} onClick={() => adicionarFicha(50)} title="Stella (Luz e Sol) +50">50</div>
                                    <div className={`${styles.chipBtn} ${styles.chip100}`} onClick={() => adicionarFicha(100)} title="Tecna (Energia) +100">100</div>
                                    <div className={`${styles.chipBtn} ${styles.chip250}`} onClick={() => adicionarFicha(250)} title="Aisha & Musa (Ondas e Som) +250">250</div>
                                    <button
                                        type="button"
                                        className="btn btn-outline-warning btn-sm font-weight-bold ml-1"
                                        onClick={() => setValorAposta(saldoAtual)}
                                        title="Apostar todo o saldo com poder máximo"
                                    >
                                        PODER TOTAL (ALL-IN)
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-light btn-sm ml-1"
                                        onClick={() => setValorAposta(10)}
                                        title="Redefinir para aposta mínima"
                                    >
                                        Min (10)
                                    </button>
                                </div>

                                <div className={styles.betInputGroup}>
                                    <span className="text-warning font-weight-bold mr-1">R$</span>
                                    <input
                                        type="number"
                                        min="10"
                                        max={saldoAtual}
                                        value={valorAposta}
                                        onChange={(e) => setValorAposta(Math.max(0, Number(e.target.value)))}
                                        className={styles.betInput}
                                    />
                                </div>

                                <button
                                    className={styles.btnApostar}
                                    onClick={handleApostar}
                                    disabled={processandoAcao || saldoAtual < 10}
                                >
                                    <i className="fas fa-wand-magic-sparkles mr-1"></i> CONJURAR APOSTA R$ {Number(valorAposta).toFixed(2)}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* 2. Painel da Fase de Jogar (HIT / STAND) */}
                {jogo?.fase === 'jogando' && (
                    <div className="d-flex align-items-center justify-content-center w-100">
                        {ehMinhaVez ? (
                            <div className={styles.hitStandGroup}>
                                <button
                                    className={styles.btnHit}
                                    onClick={handlePedirCarta}
                                    disabled={processandoAcao}
                                >
                                    <i className="fas fa-wand-magic-sparkles mr-2"></i>
                                    PEDIR CARTA (HIT) ✨
                                </button>

                                <button
                                    className={styles.btnStand}
                                    onClick={handleParar}
                                    disabled={processandoAcao}
                                >
                                    <i className="fas fa-star mr-2"></i>
                                    PARAR TURNO (STAND) 🌟
                                </button>
                            </div>
                        ) : (
                            <div className="text-white-50 d-flex align-items-center">
                                <i className="fas fa-hourglass-half mr-2 text-warning fa-spin"></i>
                                <span>Aguardando a jogada do jogador da vez...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Painel do Crupiê Jogando */}
                {jogo?.fase === 'dealer' && (
                    <div className="text-warning font-weight-bold d-flex align-items-center">
                        <i className="fas fa-dice fa-spin mr-2"></i>
                        <span>O Crupiê está revelando a carta oculta e comprando cartas...</span>
                    </div>
                )}

                {/* 4. Painel de Rodada Finalizada */}
                {jogo?.fase === 'finalizada' && (
                    <div className="d-flex align-items-center text-white">
                        <i className="fas fa-trophy text-warning mr-2 fa-lg"></i>
                        <span className="font-weight-bold">
                            Fim da rodada! A próxima rodada iniciará automaticamente em instantes...
                        </span>
                    </div>
                )}

                {/* 5. Painel Aguardando */}
                {jogo?.fase === 'aguardando' && (
                    <div className="d-flex align-items-center">
                        <span className="text-white-50 mr-3">Pronto para começar?</span>
                        <button
                            className="btn btn-warning btn-sm font-weight-bold text-dark px-3"
                            onClick={handleNovaRodada}
                            disabled={processandoAcao}
                        >
                            <i className="fas fa-play mr-1"></i> Começar Nova Rodada
                        </button>
                    </div>
                )}
            </footer>

            {/* Aviso de confirmação para sair da mesa */}
            {confirmandoSaida && (
                <div className={styles.confirmOverlay} onClick={() => !saindo && setConfirmandoSaida(false)}>
                    <div
                        className={styles.confirmBox}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirmSaidaTitulo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.confirmIcon}>
                            <i className="fas fa-door-open"></i>
                        </div>
                        <h5 id="confirmSaidaTitulo" className={styles.confirmTitle}>Sair da mesa?</h5>
                        <p className={styles.confirmText}>
                            Você vai deixar <strong className="text-white">{sala?.nome || `a Sala #${salaId}`}</strong> e
                            voltar para o lobby.
                            {meuJogador?.aposta && jogo?.fase !== 'finalizada' ? ' Sua aposta desta rodada continua valendo.' : ''}
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                type="button"
                                className={styles.btnConfirmFicar}
                                onClick={() => setConfirmandoSaida(false)}
                                disabled={saindo}
                                autoFocus
                            >
                                <i className="fas fa-wand-magic-sparkles mr-1"></i> Continuar jogando
                            </button>
                            <button
                                type="button"
                                className={styles.btnConfirmSair}
                                onClick={handleSairDaSala}
                                disabled={saindo}
                            >
                                {saindo ? (
                                    <span><i className="fas fa-spinner fa-spin mr-1"></i> Saindo...</span>
                                ) : (
                                    <span><i className="fas fa-arrow-left mr-1"></i> Sair da mesa</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Gaveta Lateral de Participantes */}
            {drawerAberto && (
                <div className={styles.drawerOverlay} onClick={() => setDrawerAberto(false)}>
                    <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'rgba(255, 42, 133, 0.4)' }}>
                            <h5 className="font-weight-bold text-white mb-0">
                                <i className="fas fa-wand-magic-sparkles text-warning mr-2"></i> Fadas na Mesa
                            </h5>
                            <button
                                className="btn btn-sm btn-outline-light"
                                onClick={() => setDrawerAberto(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="mb-3 p-2 rounded" style={{ background: 'rgba(38, 4, 30, 0.9)', border: '1px solid rgba(255, 42, 133, 0.4)' }}>
                            <small className="text-white-50 d-block">Código Mágico da Sala:</small>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="font-weight-bold h5 mb-0" style={{ color: '#ffd700' }}>#{salaId}</span>
                                <button className="btn btn-sm btn-outline-warning" onClick={copiarCodigo}>
                                    {copiado ? 'Copiado! ✨' : 'Copiar ✨'}
                                </button>
                            </div>
                        </div>

                        <ul className="list-unstyled mb-0">
                            {participantes.map((p, idx) => (
                                <li
                                    key={p.id}
                                    className="p-2 mb-2 rounded d-flex justify-content-between align-items-center"
                                    style={{ background: 'rgba(38, 4, 30, 0.85)', border: '1px solid rgba(255, 112, 166, 0.3)' }}
                                >
                                    <div>
                                        <strong className="text-white d-block">
                                            {p.usuario?.nome} {p.usuario?.id === usuario?.id ? '(Você ✨)' : ''}
                                        </strong>
                                        <small className="text-white-50">Posição #{idx + 1}</small>
                                    </div>
                                    <span className="badge px-2 py-1 font-weight-bold" style={{ background: 'linear-gradient(135deg, #ff2a85 0%, #7209b7 100%)', color: '#fff' }}>
                                        R$ {Number(p.saldo || 0).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}