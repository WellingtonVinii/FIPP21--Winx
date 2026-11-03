import ParticipanteRepository from '../repositories/participanteRepository.js';
import JogoController from '../controllers/jogoController.js';
import { getIO } from './socket.js';

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

export default function salaSocket(io, socket) {

    //o cliente entra no canal depois de ter entrado na sala pela API (POST /sala/:id/entrar)
    socket.on('sala:entrar', async (salaId) => {
        try {
            let participanteRepo = new ParticipanteRepository();
            let participante = await participanteRepo.buscarAtivo(salaId, socket.usuario.id);
            if(participante == null) {
                return socket.emit('erro', {msg: "Você não está participando dessa sala!"});
            }

            socket.join(canalSala(salaId));
            socket.emit('sala:participantes', await participanteRepo.listarAtivosPorSala(salaId));
            //quem acabou de abrir a sala já recebe o jogo como está (ex.: após um F5)
            socket.emit('jogo:estado', new JogoController().estadoPublico(salaId));
        }
        catch(ex) {
            console.error(ex);
            socket.emit('erro', {msg: "Erro ao entrar no canal da sala"});
        }
    });

    socket.on('sala:sair', (salaId) => {
        socket.leave(canalSala(salaId));
    });
}
