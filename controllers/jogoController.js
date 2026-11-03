import ApostaEntity from "../entities/apostaEntity.js";
import CartaEntity from "../entities/cartaEntity.js";
import ParticipanteEntity from "../entities/participanteEntity.js";
import RodadaEntity from "../entities/rodadaEntity.js";
import SalaEntity from "../entities/salaEntity.js";
import TurnoEntity from "../entities/turnoEntity.js";
import ApostaRepository from "../repositories/apostaRepository.js";
import BaralhoRepository from "../repositories/baralhoRepository.js";
import CartaRepository from "../repositories/cartaRepository.js";
import ParticipanteRepository from "../repositories/participanteRepository.js";
import RodadaRepository from "../repositories/rodadaRepository.js";
import TurnoRepository from "../repositories/turnoRepository.js";
import { notificarErroJogo, notificarJogo } from "../sockets/jogoSocket.js";
import { notificarParticipantes } from "../sockets/salaSocket.js";

const TEMPO_APOSTAS = 30000;        //tempo para os jogadores apostarem
const TEMPO_TURNO = 30000;          //tempo de cada jogador; ao acabar o jogador "para" automaticamente
const TEMPO_PROXIMA_RODADA = 8000;  //pausa para ver o resultado antes da próxima rodada
const PAUSA_DEALER = 1000;          //intervalo entre as cartas do dealer
const VERSO_CARTA = "https://deckofcardsapi.com/static/img/back.png";

//fases da rodada
const FASE = {
    AGUARDANDO: "aguardando",
    APOSTAS: "apostas",
    JOGANDO: "jogando",
    DEALER: "dealer",
    FINALIZADA: "finalizada"
};

/*
 * O jogo de cada sala fica em memória (fase, jogadores, cartas, timers) e tudo é gravado no banco.
 * Os Maps ficam fora da classe para que todas as instâncias do controller enxerguem o mesmo jogo.
 * Cada sala tem uma fila para que duas ações nunca sejam processadas ao mesmo tempo.
 */
const jogos = new Map();
const filas = new Map();

//erro de regra do jogo, com o status HTTP que deve ser devolvido
class JogoErro extends Error {
    constructor(status, msg) {
        super(msg);
        this.status = status;
    }
}

function espera(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

export default class JogoController {

    #baralhoRepo;
    #participanteRepo;
    #rodadaRepo;
    #apostaRepo;
    #turnoRepo;
    #cartaRepo;

    constructor() {
        this.#baralhoRepo = new BaralhoRepository();
        this.#participanteRepo = new ParticipanteRepository();
        this.#rodadaRepo = new RodadaRepository();
        this.#apostaRepo = new ApostaRepository();
        this.#turnoRepo = new TurnoRepository();
        this.#cartaRepo = new CartaRepository();
    }

    // ---------- requisição HTTP (rota /jogo) ----------

    async obterEstado(req, res) {
        try{
            let {salaId} = req.params;
            return res.status(200).json(this.estadoPublico(salaId));
        }
        catch(error) {
            console.error(error);
            return res.status(500).json({msg: "Erro ao processar requisição"});
        }
    }

    // ---------- jogadas (chamadas pelo jogoSocket) ----------
    // cada jogada devolve o novo estado do jogo ou lança um JogoErro com a mensagem para o jogador

    novaRodada(salaId, usuarioId) {
        salaId = Number(salaId);
        return this.#executar(salaId, async () => {
            let jogo = jogos.get(salaId);
            if(jogo && jogo.fase != FASE.AGUARDANDO) {
                throw new JogoErro(409, "Já existe uma rodada em andamento!");
            }
            let participante = await this.#participanteRepo.buscarAtivo(salaId, usuarioId);
            if(!participante) {
                throw new JogoErro(403, "Você não está participando dessa sala!");
            }

            await this.#iniciarRodada(salaId);
            return this.estadoPublico(salaId);
        });
    }

    apostar(salaId, usuarioId, valor) {
        salaId = Number(salaId);
        valor = arredondar(Number(valor));
        return this.#executar(salaId, async () => {
            let jogo = jogos.get(salaId);
            if(!jogo || jogo.fase != FASE.APOSTAS) {
                throw new JogoErro(409, "Não é o momento de apostar!");
            }
            let jogador = jogo.jogadores.find(j => j.participante.usuario.id == usuarioId);
            if(!jogador) {
                throw new JogoErro(403, "Você não está participando desta rodada!");
            }
            if(jogador.aposta) {
                throw new JogoErro(409, "Você já apostou nesta rodada!");
            }

            let aposta = new ApostaEntity(0, valor, jogador.participante, jogo.rodada);
            if(!aposta.validar(jogador.participante.saldo)) {
                throw new JogoErro(400, `A aposta deve ser de no mínimo ${ApostaEntity.APOSTA_MINIMA} e no máximo o seu saldo (${jogador.participante.saldo})!`);
            }

            //só debita se ainda houver saldo no banco
            let debitou = await this.#participanteRepo.debitar(jogador.participante.id, valor);
            if(!debitou) {
                throw new JogoErro(400, "Saldo insuficiente para essa aposta!");
            }
            jogador.participante.saldo = arredondar(jogador.participante.saldo - valor);

            await this.#apostaRepo.cadastrar(aposta);
            jogador.aposta = aposta;

            await notificarParticipantes(salaId);

            //todos apostaram: não precisa esperar o tempo acabar
            if(jogo.jogadores.every(j => j.aposta)) {
                await this.#encerrarApostas(jogo);
            }
            else {
                this.#notificar(jogo);
            }

            return this.estadoPublico(salaId);
        });
    }

    //pedir carta (hit)
    pedir(salaId, usuarioId) {
        salaId = Number(salaId);
        return this.#executar(salaId, async () => {
            let jogo = jogos.get(salaId);
            let jogador = this.#jogadorDaVez(jogo, usuarioId);

            let [carta] = await this.#comprar(jogo, 1);
            await this.#darCarta(jogo, jogador, carta, true);

            let soma = jogador.turno.somaCartas;
            if(soma > 21) {
                jogador.turno.status = "Estourou";
                await this.#turnoRepo.atualizar(jogador.turno);
                await this.#parar(jogo, jogador);
            }
            else if(soma == 21) {
                await this.#parar(jogo, jogador);
            }
            else {
                //nova carta: o tempo do turno recomeça
                this.#agendar(jogo, TEMPO_TURNO, () => this.#parar(jogo, jogador));
                this.#notificar(jogo);
            }

            return this.estadoPublico(salaId);
        });
    }

    //parar (stand)
    parar(salaId, usuarioId) {
        salaId = Number(salaId);
        return this.#executar(salaId, async () => {
            let jogo = jogos.get(salaId);
            let jogador = this.#jogadorDaVez(jogo, usuarioId);

            await this.#parar(jogo, jogador);
            return this.estadoPublico(salaId);
        });
    }

    // ---------- eventos da sala (chamados pelo SalaController) ----------

    //quando alguém entra na sala o jogo é iniciado (se ainda não houver rodada)
    aoEntrar(salaId) {
        salaId = Number(salaId);
        return this.#executar(salaId, async () => {
            let jogo = jogos.get(salaId);
            if(!jogo || jogo.fase == FASE.AGUARDANDO) {
                await this.#iniciarRodada(salaId);
            }
            else if(jogo.fase == FASE.APOSTAS) {
                //as cartas ainda não foram distribuídas, então quem chegou já pode apostar
                await this.#incluirElegiveis(jogo);
                this.#notificar(jogo);
            }
            //com as cartas já distribuídas, quem entrou joga apenas na próxima rodada
        });
    }

    aoSair(salaId, participanteId) {
        salaId = Number(salaId);
        return this.#executar(salaId, async () => {
            let jogo = jogos.get(salaId);
            if(!jogo) return;

            let jogador = jogo.jogadores.find(j => j.participante.id == participanteId);
            if(!jogador) return;

            if(jogo.fase == FASE.APOSTAS) {
                if(!jogador.aposta) {
                    jogo.jogadores = jogo.jogadores.filter(j => j != jogador);
                }
                else {
                    jogador.saiu = true;
                }
                if(jogo.jogadores.every(j => j.aposta)) {
                    await this.#encerrarApostas(jogo);
                    return;
                }
            }
            else if(jogo.fase == FASE.JOGANDO) {
                //quem sai durante a rodada para com as cartas que tem
                jogador.saiu = true;
                if(jogo.vez == participanteId) {
                    await this.#parar(jogo, jogador);
                    return;
                }
            }

            this.#notificar(jogo);
        });
    }

    //estado enviado para o frontend (a carta oculta do dealer não é revelada)
    estadoPublico(salaId) {
        salaId = Number(salaId);
        let jogo = jogos.get(salaId);
        if(!jogo) {
            return { sala: salaId, rodada: null, fase: FASE.AGUARDANDO, prazo: null, vez: null, apostaMinima: ApostaEntity.APOSTA_MINIMA, jogadores: [], dealer: null };
        }

        let cartaPublica = (c) => c.visivel == 'S'
            ? { codigo: c.codigo, imagem: c.imagem, valor: c.valor, naipe: c.naipe, oculta: false }
            : { codigo: null, imagem: VERSO_CARTA, valor: null, naipe: null, oculta: true };

        return {
            sala: salaId,
            rodada: jogo.rodada?.id ?? null,
            fase: jogo.fase,
            prazo: jogo.prazo,
            vez: jogo.vez,
            apostaMinima: ApostaEntity.APOSTA_MINIMA,
            jogadores: jogo.jogadores.map(j => ({
                participante: j.participante.id,
                usuario: { id: j.participante.usuario.id, nome: j.participante.usuario.nome },
                ordem: j.participante.ordem,
                saldo: j.participante.saldo,
                aposta: j.aposta?.valor ?? null,
                cartas: j.cartas.map(cartaPublica),
                soma: CartaEntity.somar(j.cartas),
                blackjack: j.blackjack,
                status: j.turno?.status ?? null,
                resultado: j.resultado,
                pagamento: j.pagamento
            })),
            dealer: jogo.dealer ? {
                cartas: jogo.dealer.cartas.map(cartaPublica),
                soma: CartaEntity.somar(jogo.dealer.cartas.filter(c => c.visivel == 'S')),
                status: jogo.dealer.turno.status
            } : null
        };
    }

    //se o servidor reiniciar no meio de uma rodada ela é encerrada e as apostas devolvidas
    async recuperarRodadasAbertas() {
        let rodadas = await this.#rodadaRepo.listarAbertas();
        for(let rodada of rodadas) {
            let apostas = await this.#apostaRepo.listarPorRodada(rodada.id);
            for(let aposta of apostas) {
                await this.#participanteRepo.creditar(aposta.participante.id, aposta.valor);
            }
            await this.#rodadaRepo.finalizar(rodada.id);
        }
        if(rodadas.length > 0) {
            console.log(`${rodadas.length} rodada(s) aberta(s) encerrada(s) e apostas devolvidas`);
        }
    }

    // ---------- controle interno ----------

    #executar(salaId, acao) {
        let anterior = filas.get(salaId) ?? Promise.resolve();
        let atual = anterior.catch(() => {}).then(acao);
        filas.set(salaId, atual);
        return atual;
    }

    //agenda a próxima ação automática da sala (fim das apostas, fim do turno, próxima rodada)
    #agendar(jogo, ms, acao) {
        clearTimeout(jogo.timer);
        let etapa = ++jogo.etapa;
        jogo.prazo = Date.now() + ms;
        jogo.timer = setTimeout(() => {
            this.#executar(jogo.salaId, async () => {
                //ignora o timer se o jogo já mudou de etapa enquanto ele aguardava na fila
                if(jogo.etapa != etapa) return;
                await acao();
            }).catch(ex => this.#falha(jogo, ex));
        }, ms);
    }

    #cancelarAgendamento(jogo) {
        clearTimeout(jogo.timer);
        jogo.etapa++;
        jogo.prazo = null;
    }

    #falha(jogo, ex) {
        console.error(ex);
        notificarErroJogo(jogo.salaId, ex instanceof JogoErro ? ex.message : "Erro ao processar o jogo");
    }

    #notificar(jogo) {
        notificarJogo(jogo.salaId, this.estadoPublico(jogo.salaId));
    }

    async #comprar(jogo, quantidade) {
        try {
            return await this.#baralhoRepo.comprar(jogo.rodada.codigoBaralho, quantidade);
        }
        catch(ex) {
            console.error(ex);
            throw new JogoErro(502, "Não foi possível comprar cartas do baralho. Tente novamente!");
        }
    }

    #novoJogador(participante) {
        return { participante, aposta: null, turno: null, cartas: [], blackjack: false, terminou: false, saiu: false, resultado: null, pagamento: 0 };
    }

    #jogadorDaVez(jogo, usuarioId) {
        if(!jogo || jogo.fase != FASE.JOGANDO) {
            throw new JogoErro(409, "Não é o momento de jogar!");
        }
        let jogador = jogo.jogadores.find(j => j.participante.id == jogo.vez);
        if(!jogador || jogador.participante.usuario.id != usuarioId) {
            throw new JogoErro(403, "Não é a sua vez!");
        }
        return jogador;
    }

    // ---------- etapas da rodada ----------

    async #iniciarRodada(salaId) {
        let anterior = jogos.get(salaId);
        if(anterior) clearTimeout(anterior.timer);

        let jogo = { salaId, fase: FASE.AGUARDANDO, rodada: null, jogadores: [], dealer: null, vez: null, prazo: null, timer: null, etapa: 0 };
        jogos.set(salaId, jogo);

        let participantes = await this.#participanteRepo.listarElegiveisPorSala(salaId, ParticipanteEntity.SALDO_MINIMO);
        if(participantes.length == 0) {
            this.#notificar(jogo);
            return;
        }

        try {
            let rodada = new RodadaEntity(0, await this.#baralhoRepo.novo(), null, null, new SalaEntity(salaId));
            await this.#rodadaRepo.cadastrar(rodada);
            jogo.rodada = rodada;
        }
        catch(ex) {
            //sem baralho a sala continua aguardando; qualquer participante pode tentar uma nova rodada
            this.#falha(jogo, new JogoErro(502, "Não foi possível criar o baralho. Tente iniciar uma nova rodada!"));
            console.error(ex);
            this.#notificar(jogo);
            return;
        }

        jogo.fase = FASE.APOSTAS;
        jogo.jogadores = participantes.map(p => this.#novoJogador(p));
        this.#agendar(jogo, TEMPO_APOSTAS, () => this.#encerrarApostas(jogo));
        this.#notificar(jogo);
    }

    async #incluirElegiveis(jogo) {
        let participantes = await this.#participanteRepo.listarElegiveisPorSala(jogo.salaId, ParticipanteEntity.SALDO_MINIMO);
        for(let p of participantes) {
            if(!jogo.jogadores.some(j => j.participante.id == p.id)) {
                jogo.jogadores.push(this.#novoJogador(p));
            }
        }
    }

    async #encerrarApostas(jogo) {
        //quem não apostou não joga esta rodada
        jogo.jogadores = jogo.jogadores.filter(j => j.aposta);

        if(jogo.jogadores.length == 0) {
            this.#cancelarAgendamento(jogo);
            await this.#rodadaRepo.finalizar(jogo.rodada.id);
            jogo.fase = FASE.AGUARDANDO;
            this.#notificar(jogo);
            return;
        }

        try {
            await this.#distribuir(jogo);
        }
        catch(ex) {
            await this.#cancelarRodada(jogo, ex);
        }
    }

    //usado quando o baralho falha no meio da rodada: devolve as apostas e encerra a rodada
    async #cancelarRodada(jogo, ex) {
        this.#falha(jogo, ex);
        this.#cancelarAgendamento(jogo);

        for(let jogador of jogo.jogadores) {
            if(jogador.aposta) {
                await this.#participanteRepo.creditar(jogador.participante.id, jogador.aposta.valor);
            }
        }
        await this.#rodadaRepo.finalizar(jogo.rodada.id);

        jogo.fase = FASE.AGUARDANDO;
        jogo.jogadores = [];
        jogo.dealer = null;
        jogo.vez = null;
        this.#notificar(jogo);
        await notificarParticipantes(jogo.salaId);
    }

    async #distribuir(jogo) {
        this.#cancelarAgendamento(jogo);

        //duas cartas para cada jogador e duas para o dealer, compradas de uma vez
        let cartas = await this.#comprar(jogo, jogo.jogadores.length * 2 + 2);

        for(let jogador of jogo.jogadores) {
            jogador.turno = new TurnoEntity(0, 0, "Jogando", jogador.participante, jogo.rodada);
            await this.#turnoRepo.cadastrar(jogador.turno);

            await this.#darCarta(jogo, jogador, cartas.shift(), true);
            await this.#darCarta(jogo, jogador, cartas.shift(), true);

            //blackjack natural: 21 com as duas primeiras cartas, não precisa jogar
            jogador.blackjack = jogador.turno.somaCartas == 21;
            jogador.terminou = jogador.blackjack;
        }

        jogo.dealer = { participante: null, turno: new TurnoEntity(0, 0, "Jogando", null, jogo.rodada), cartas: [] };
        await this.#turnoRepo.cadastrar(jogo.dealer.turno);
        await this.#darCarta(jogo, jogo.dealer, cartas.shift(), true);
        await this.#darCarta(jogo, jogo.dealer, cartas.shift(), false); //carta oculta

        jogo.fase = FASE.JOGANDO;
        await this.#proximoJogador(jogo);
    }

    async #darCarta(jogo, mao, carta, visivel) {
        carta.ordem = mao.cartas.length + 1;
        carta.visivel = visivel ? 'S' : 'N';
        carta.participante = mao.participante;
        carta.rodada = jogo.rodada;
        await this.#cartaRepo.cadastrar(carta);

        mao.cartas.push(carta);
        mao.turno.somaCartas = CartaEntity.somar(mao.cartas);
        await this.#turnoRepo.atualizar(mao.turno);
    }

    //os jogadores jogam um por vez, na ordem de entrada na sala
    async #proximoJogador(jogo) {
        for(let j of jogo.jogadores) {
            if(j.saiu) j.terminou = true;
        }

        let jogador = jogo.jogadores.find(j => !j.terminou);
        if(!jogador) {
            try {
                await this.#turnoDealer(jogo);
            }
            catch(ex) {
                await this.#cancelarRodada(jogo, ex);
            }
            return;
        }

        jogo.vez = jogador.participante.id;
        this.#agendar(jogo, TEMPO_TURNO, () => this.#parar(jogo, jogador));
        this.#notificar(jogo);
    }

    async #parar(jogo, jogador) {
        jogador.terminou = true;
        await this.#proximoJogador(jogo);
    }

    async #turnoDealer(jogo) {
        this.#cancelarAgendamento(jogo);
        jogo.fase = FASE.DEALER;
        jogo.vez = null;

        let dealer = jogo.dealer;
        let oculta = dealer.cartas.find(c => c.visivel == 'N');
        if(oculta) {
            oculta.visivel = 'S';
            await this.#cartaRepo.revelar(oculta.id);
        }
        this.#notificar(jogo);

        //se todos estouraram o dealer já venceu e não precisa comprar
        let alguemNaDisputa = jogo.jogadores.some(j => j.turno.status != "Estourou");
        while(alguemNaDisputa && dealer.turno.somaCartas < 17) {
            await espera(PAUSA_DEALER);
            let [carta] = await this.#comprar(jogo, 1);
            await this.#darCarta(jogo, dealer, carta, true);
            this.#notificar(jogo);
        }

        //o dealer não tem status de vitória/derrota própria; fica null quando para
        dealer.turno.status = dealer.turno.somaCartas > 21 ? "Estourou" : null;
        await this.#turnoRepo.atualizar(dealer.turno);

        await espera(PAUSA_DEALER);
        await this.#resolver(jogo);
    }

    async #resolver(jogo) {
        let maoDealer = {
            soma: jogo.dealer.turno.somaCartas,
            blackjack: jogo.dealer.cartas.length == 2 && jogo.dealer.turno.somaCartas == 21
        };

        for(let jogador of jogo.jogadores) {
            jogador.resultado = TurnoEntity.resultado({ soma: jogador.turno.somaCartas, blackjack: jogador.blackjack }, maoDealer);
            jogador.pagamento = jogador.aposta.pagamento(jogador.resultado);

            jogador.turno.status = TurnoEntity.statusDoResultado(jogador.resultado);
            await this.#turnoRepo.atualizar(jogador.turno);

            if(jogador.pagamento > 0) {
                await this.#participanteRepo.creditar(jogador.participante.id, jogador.pagamento);
                jogador.participante.saldo = arredondar(jogador.participante.saldo + jogador.pagamento);
            }
        }

        await this.#rodadaRepo.finalizar(jogo.rodada.id);
        jogo.fase = FASE.FINALIZADA;

        this.#agendar(jogo, TEMPO_PROXIMA_RODADA, () => this.#iniciarRodada(jogo.salaId));
        this.#notificar(jogo);
        await notificarParticipantes(jogo.salaId);
    }
}
