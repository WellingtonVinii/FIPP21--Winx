'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from './salas.module.css';

export default function SalasLobby() {
    const { usuario, logout, carregando, verificarUsuario } = useAuth();
    const router = useRouter();
    const montado = useRef(true);

    const [salas, setSalas] = useState([]);
    const [carregandoSalas, setCarregandoSalas] = useState(true);
    const [erroSalas, setErroSalas] = useState('');

    const [nomeNovaSala, setNomeNovaSala] = useState('');
    const [criandoSala, setCriandoSala] = useState(false);
    const [erroCriar, setErroCriar] = useState('');

    const [codigoEntrar, setCodigoEntrar] = useState('');
    const [entrandoSala, setEntrandoSala] = useState(false);
    const [erroEntrar, setErroEntrar] = useState('');

    const [copiadoId, setCopiadoId] = useState(null);

    const API_URL = 'http://localhost:5000';
    const MAX_JOGADORES = 4; // mesmo limite do back (SalaEntity.MAX_JOGADORES)

    async function carregarSalas() {
        setCarregandoSalas(true);
        setErroSalas('');
        // se o servidor não responder (ainda subindo ou reiniciando), continua carregando e tentando
        while (montado.current) {
            try {
                const res = await fetch(`${API_URL}/sala`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (res.ok) {
                    const dados = await res.json();
                    setSalas(Array.isArray(dados) ? dados : []);
                    break;
                }
                if (res.status < 500) {
                    const dados = await res.json().catch(() => null);
                    setErroSalas(dados?.msg || 'Não foi possível carregar as salas.');
                    break;
                }
            } catch (ex) {
                console.warn('Servidor indisponível ao listar as salas, tentando novamente...');
            }
            await new Promise((resolver) => setTimeout(resolver, 1500));
        }
        setCarregandoSalas(false);
    }

    useEffect(() => {
        montado.current = true;
        return () => {
            montado.current = false;
        };
    }, []);

    // botão "Atualizar": se a sessão não foi validada, tenta validar de novo antes de listar
    async function atualizar() {
        if (usuario) {
            carregarSalas();
            return;
        }

        setCarregandoSalas(true);
        setErroSalas('');
        const logado = await verificarUsuario();
        if (!logado) {
            setCarregandoSalas(false);
            setErroSalas('Não foi possível validar a sua sessão. Tente atualizar ou entre novamente.');
        }
        // se validou, o efeito abaixo carrega as salas
    }

    useEffect(() => {
        if (carregando) return;

        if (usuario) {
            carregarSalas();
        } else {
            // sessão não validada (servidor fora do ar ou token recusado): não fica carregando para sempre
            setCarregandoSalas(false);
            setErroSalas('Não foi possível validar a sua sessão. Tente atualizar ou entre novamente.');
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
            <div className={styles.telaCarregando}>
                <i className="fas fa-magic fa-spin fa-3x mb-3"></i>
                <h5 className="font-weight-bold mb-0">Abrindo os portões de Alfea...</h5>
            </div>
        );
    }

    return (
        <div className={styles.lobby}>
            {/* Cabeçalho */}
            <nav className={styles.header}>
                <div className={`container ${styles.headerInner}`}>
                    <Link className={styles.brand} href="/salas">
                        <i className="fas fa-magic"></i>
                        <span>FIPP<span className={styles.brandDestaque}>21</span></span>
                        <span className={styles.brandTag}>Lobby</span>
                    </Link>

                    <div className={styles.headerAcoes}>
                        <span className={styles.usuarioChip}>
                            <i className="fas fa-user-circle"></i>
                            {usuario?.nome}
                        </span>
                        <Link className={styles.btnHeader} href="/" title="Regras e Informações">
                            <i className="fas fa-info-circle"></i> Regras
                        </Link>
                        <button className={styles.btnHeaderSair} onClick={logout} title="Encerrar Sessão">
                            <i className="fas fa-sign-out-alt"></i> Sair
                        </button>
                    </div>
                </div>
            </nav>

            {/* Conteúdo Principal */}
            <main className={`container ${styles.main}`}>
                {/* Banner de boas-vindas */}
                <section className={styles.hero}>
                    <div>
                        <h2 className={styles.heroTitulo}>
                            ✨ Boas-vindas a Alfea{usuario?.nome ? `, ${usuario.nome}` : ''}!
                        </h2>
                        <p className={styles.heroTexto}>
                            Crie uma sala, digite o código de uma sala existente ou escolha uma das mesas encantadas abaixo.
                        </p>
                    </div>
                    <div className={styles.heroSaldo}>
                        <i className="fas fa-gem"></i>
                        <div>
                            <small>Saldo inicial por mesa</small>
                            <strong>R$ 1.000,00</strong>
                        </div>
                    </div>
                </section>

                <div className="row">
                    {/* Entrar por Código */}
                    <div className="col-lg-6 mb-4">
                        <div className={styles.painel}>
                            <div className={styles.painelHeader}>
                                <h5 className={styles.painelTitulo}>
                                    <i className="fas fa-key"></i> Entrar em uma Sala por Código
                                </h5>
                            </div>
                            <div className={styles.painelBody}>
                                <p className={styles.painelTexto}>
                                    Tem o código fornecido pelo criador da sala? Digite-o abaixo para se sentar à mesa:
                                </p>
                                <form onSubmit={(e) => handleEntrarPorCodigo(e)}>
                                    <label className={styles.label} htmlFor="codigoSala">
                                        Código da Sala (ID)
                                    </label>
                                    <div className={styles.inputGrupo}>
                                        <span className={styles.inputPrefixo}>#</span>
                                        <input
                                            id="codigoSala"
                                            type="number"
                                            min="1"
                                            className={styles.input}
                                            placeholder="Ex: 5"
                                            value={codigoEntrar}
                                            onChange={(e) => setCodigoEntrar(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {erroEntrar && (
                                        <div className={styles.erro} role="alert">
                                            <i className="fas fa-exclamation-triangle"></i> {erroEntrar}
                                        </div>
                                    )}
                                    <button type="submit" className={styles.btnEntrar} disabled={entrandoSala}>
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

                    {/* Criar Nova Sala */}
                    <div className="col-lg-6 mb-4">
                        <div className={styles.painel}>
                            <div className={styles.painelHeader}>
                                <h5 className={styles.painelTitulo}>
                                    <i className="fas fa-plus-circle"></i> Criar Nova Sala de Jogo
                                </h5>
                            </div>
                            <div className={styles.painelBody}>
                                <p className={styles.painelTexto}>
                                    Dê um nome para a sua sala. Ao criar, você já entra direto na mesa.
                                </p>
                                <form onSubmit={handleCriarSala}>
                                    <label className={styles.label} htmlFor="nomeSala">
                                        Nome da Sala
                                    </label>
                                    <input
                                        id="nomeSala"
                                        type="text"
                                        maxLength="200"
                                        className={`${styles.input} ${styles.inputSolo}`}
                                        placeholder="Ex: Mesa das Fadas"
                                        value={nomeNovaSala}
                                        onChange={(e) => setNomeNovaSala(e.target.value)}
                                        required
                                    />
                                    {erroCriar && (
                                        <div className={styles.erro} role="alert">
                                            <i className="fas fa-exclamation-triangle"></i> {erroCriar}
                                        </div>
                                    )}
                                    <button type="submit" className={styles.btnCriar} disabled={criandoSala}>
                                        {criandoSala ? (
                                            <span><i className="fas fa-spinner fa-spin mr-1"></i> Criando...</span>
                                        ) : (
                                            <span><i className="fas fa-magic mr-1"></i> Criar e Entrar na Sala</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Salas Disponíveis (todas as salas, de qualquer usuário) */}
                <section className={styles.painel}>
                    <div className={styles.painelHeader}>
                        <h5 className={styles.painelTitulo}>
                            <i className="fas fa-crown"></i> Salas Disponíveis
                            {!carregandoSalas && !erroSalas && salas.length > 0 && (
                                <span className={styles.contador}>{salas.length}</span>
                            )}
                        </h5>
                        <button
                            className={styles.btnAtualizar}
                            onClick={atualizar}
                            disabled={carregandoSalas}
                            title="Atualizar lista"
                        >
                            <i className={`fas fa-sync-alt ${carregandoSalas ? 'fa-spin' : ''}`}></i> Atualizar
                        </button>
                    </div>

                    {carregandoSalas ? (
                        <div className={styles.estado}>
                            <i className="fas fa-magic fa-spin fa-2x"></i>
                            <p className="mb-0">Carregando salas...</p>
                        </div>
                    ) : erroSalas ? (
                        <div className={`${styles.estado} ${styles.estadoErro}`}>
                            <i className="fas fa-exclamation-triangle fa-2x"></i>
                            <p className="mb-0">{erroSalas}</p>
                        </div>
                    ) : salas.length === 0 ? (
                        <div className={styles.estado}>
                            <i className="fas fa-hat-wizard fa-3x"></i>
                            <h5>Nenhuma sala disponível no momento</h5>
                            <p className="small mb-0">Utilize o formulário acima para criar a primeira sala de Blackjack!</p>
                        </div>
                    ) : (
                        <div className={styles.gradeSalas}>
                            {salas.map((sala) => {
                                const ocupadas = sala.participantes ?? 0;
                                const cheia = ocupadas >= MAX_JOGADORES;
                                const copiado = copiadoId === sala.id;

                                return (
                                    <article key={sala.id} className={`${styles.salaCard} ${cheia ? styles.salaCardCheia : ''}`}>
                                        <div className={styles.salaTopo}>
                                            <button
                                                type="button"
                                                className={`${styles.salaCodigo} ${copiado ? styles.salaCodigoCopiado : ''}`}
                                                onClick={() => copiarCodigo(sala.id)}
                                                title="Copiar código da sala"
                                            >
                                                <i className={`fas ${copiado ? 'fa-check' : 'fa-copy'}`}></i>
                                                {copiado ? 'Copiado!' : `#${sala.id}`}
                                            </button>

                                            <span
                                                className={`${styles.vagas} ${cheia ? styles.vagasCheia : ''}`}
                                                title={cheia ? 'Sala cheia' : `${MAX_JOGADORES - ocupadas} vaga(s) livre(s)`}
                                            >
                                                <span className={styles.pontos}>
                                                    {Array.from({ length: MAX_JOGADORES }, (_, i) => (
                                                        <span
                                                            key={i}
                                                            className={`${styles.ponto} ${i < ocupadas ? styles.pontoOcupado : ''}`}
                                                        ></span>
                                                    ))}
                                                </span>
                                                {cheia ? 'Cheia' : `${ocupadas}/${MAX_JOGADORES}`}
                                            </span>
                                        </div>

                                        <h6 className={styles.salaNome} title={sala.nome}>{sala.nome}</h6>

                                        <div className={styles.salaDono}>
                                            <i className="fas fa-crown"></i>
                                            <span className={styles.salaDonoNome}>{sala.usuario?.nome}</span>
                                            {sala.usuario?.id === usuario?.id && (
                                                <span className={styles.voceTag}>Você</span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className={styles.btnJogar}
                                            onClick={() => handleEntrarPorCodigo(null, sala.id)}
                                            disabled={entrandoSala}
                                        >
                                            <i className="fas fa-play mr-1"></i> Jogar
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* Rodapé */}
            <footer className={styles.footer}>
                FIPP21 - Plataforma de Jogo 21 Multiplayer &bull; Sessão ativa como <strong>{usuario?.nome}</strong>
            </footer>
        </div>
    );
}
