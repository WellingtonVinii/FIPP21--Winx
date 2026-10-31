import AuthMiddleware from '../middlewares/authMiddleware.js';
import salaSocket from './salaSocket.js';

let ioInstancia = null;

//permite que os controllers emitam eventos sem receber o io por parâmetro
export function getIO() {
    return ioInstancia;
}

//recupera o token do cabeçalho de cookies enviado no handshake
function lerToken(cookies) {
    if(!cookies) return null;

    let item = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('token='));
    return item ? decodeURIComponent(item.substring('token='.length)) : null;
}

export default function socketInit(io) {
    ioInstancia = io;

    //mesmo JWT da API: só conecta quem estiver logado
    io.use((socket, next) => {
        try {
            let token = lerToken(socket.handshake.headers.cookie);
            if(!token)
                return next(new Error("Token não encontrado!"));

            let auth = new AuthMiddleware();
            socket.usuario = auth.verificar(token);
            next();
        }
        catch(ex) {
            next(new Error("Token inválido!"));
        }
    });

    io.on('connection', (socket) => {
        salaSocket(io, socket);

        socket.on('disconnect', () => {
            //a saída da sala só acontece pela rota /sala/:id/sair, assim um F5 não remove o participante
        });
    });
}
