import JogoController from '../controllers/jogoController.js';
import { canalSala } from './salaSocket.js';
import { getIO } from './socket.js';

//envia o estado atualizado do jogo para todos que estão no canal da sala
export function notificarJogo(salaId, estado) {
    let io = getIO();
    if(!io) return;

    io.to(canalSala(salaId)).emit('jogo:estado', estado);
}

export function notificarErroJogo(salaId, msg) {
    let io = getIO();
    if(!io) return;

    io.to(canalSala(salaId)).emit('jogo:erro', {msg});
}

/*
 * Jogadas feitas pelo WebSocket. O cliente envia { salaId, ... } e pode passar um callback
 * que recebe { ok: true, estado } ou { ok: false, msg }.
 * O novo estado também é enviado para toda a sala pelo evento 'jogo:estado'.
 */
export default function jogoSocket(io, socket) {
    let usuarioId = socket.data.usuario.id;
    let controller = new JogoController();

    function jogada(evento, executar) {
        socket.on(evento, async (dados, responder) => {
            if(typeof responder != 'function') responder = () => {};
            try {
                let estado = await executar(dados ?? {});
                responder({ok: true, estado});
            }
            catch(ex) {
                //erros de regra do jogo têm status e uma mensagem para o jogador
                if(!ex.status) console.error(ex);
                let msg = ex.status ? ex.message : "Erro ao processar a jogada";
                responder({ok: false, msg});
                socket.emit('jogo:erro', {msg});
            }
        });
    }

    jogada('jogo:apostar', (dados) => controller.apostar(dados.salaId, usuarioId, dados.valor));
    jogada('jogo:pedir', (dados) => controller.pedir(dados.salaId, usuarioId));
    jogada('jogo:parar', (dados) => controller.parar(dados.salaId, usuarioId));
    jogada('jogo:novaRodada', (dados) => controller.novaRodada(dados.salaId, usuarioId));
}
