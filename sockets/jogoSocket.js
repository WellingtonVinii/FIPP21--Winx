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
