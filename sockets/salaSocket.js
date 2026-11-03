import JogoController from '../controllers/jogoController.js';
import SalaController from '../controllers/salaController.js';
import ParticipanteRepository from '../repositories/participanteRepository.js';
import { getIO } from './socket.js';

//tempo para o jogador voltar (F5, queda de internet) antes de ser retirado da sala
const TEMPO_RECONEXAO = 60000;

//saídas agendadas por sala e usuário
const saidas = new Map();

//nome do canal do socket.io para cada sala
export function canalSala(salaId) {
    return `sala:${salaId}`;
}

//envia a lista atualizada de participantes para todos que estão na sala
export async function notificarParticipantes(salaId) {
    let io = getIO();
    if(!io) return;

    try {
        let participanteRepo = new ParticipanteRepository();
        let participantes = await participanteRepo.listarAtivosPorSala(salaId);
        io.to(canalSala(salaId)).emit('sala:participantes', participantes);
    }
    catch(ex) {
        console.error(ex);
    }
}

//tira do canal todas as conexões do usuário (ele pode estar com a sala aberta em mais de uma aba)
export async function removerDoCanal(salaId, usuarioId) {
    let io = getIO();
    if(!io) return;

    cancelarSaida(salaId, usuarioId);

    let sockets = await io.in(canalSala(salaId)).fetchSockets();
    for(let s of sockets) {
        if(s.data.usuario.id == usuarioId) {
            s.emit('sala:removido', {sala: Number(salaId)});
            s.leave(canalSala(salaId));
        }
    }
}

function chaveSaida(salaId, usuarioId) {
    return `${salaId}:${usuarioId}`;
}

function cancelarSaida(salaId, usuarioId) {
    let chave = chaveSaida(salaId, usuarioId);
    clearTimeout(saidas.get(chave));
    saidas.delete(chave);
}

//o jogador deixou de acompanhar a sala: se não voltar a tempo ele sai da sala
function agendarSaida(io, salaId, usuarioId) {
    cancelarSaida(salaId, usuarioId);

    let chave = chaveSaida(salaId, usuarioId);
    saidas.set(chave, setTimeout(async () => {
        saidas.delete(chave);
        try {
            //se ele ainda tem alguma conexão no canal (voltou ou tem outra aba aberta) continua na sala
            let sockets = await io.in(canalSala(salaId)).fetchSockets();
            if(sockets.some(s => s.data.usuario.id == usuarioId)) return;

            await new SalaController().removerParticipante(salaId, usuarioId);
        }
        catch(ex) {
            console.error(ex);
        }
    }, TEMPO_RECONEXAO));
}

export default function salaSocket(io, socket) {
    let usuarioId = socket.data.usuario.id;
    socket.data.salas = new Set();

    //o cliente entra no canal depois de ter entrado na sala pela API (POST /sala/:id/entrar)
    socket.on('sala:entrar', async (salaId) => {
        try {
            salaId = Number(salaId);
            let participanteRepo = new ParticipanteRepository();
            let participante = await participanteRepo.buscarAtivo(salaId, usuarioId);
            if(participante == null) {
                return socket.emit('erro', {msg: "Você não está participando dessa sala!"});
            }

            socket.join(canalSala(salaId));
            socket.data.salas.add(salaId);
            cancelarSaida(salaId, usuarioId);

            socket.emit('sala:participantes', await participanteRepo.listarAtivosPorSala(salaId));
            //quem acabou de abrir a sala já recebe o jogo como está (ex.: após um F5)
            socket.emit('jogo:estado', new JogoController().estadoPublico(salaId));
        }
        catch(ex) {
            console.error(ex);
            socket.emit('erro', {msg: "Erro ao entrar no canal da sala"});
        }
    });

    //saiu da tela da sala sem sair dela: conta como desconexão
    socket.on('sala:sair', (salaId) => {
        salaId = Number(salaId);
        socket.leave(canalSala(salaId));
        socket.data.salas.delete(salaId);
        agendarSaida(io, salaId, usuarioId);
    });

    socket.on('disconnect', () => {
        for(let salaId of socket.data.salas) {
            agendarSaida(io, salaId, usuarioId);
        }
    });
}
