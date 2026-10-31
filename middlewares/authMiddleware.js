import jwt from 'jsonwebtoken';
import UsuarioRepository from '../repositories/usuarioRepository.js';

const SEGREDO_JWT = "FIPP21_SEGREDO_JWT_BLACKJACK";

export default class AuthMiddleware {

    token(id, nome, email) {
        let token = jwt.sign({
            id: id,
            nome: nome,
            email: email
        }, SEGREDO_JWT);

        return token;
    }

    //valida o token e devolve as informações do usuário (usado também pelo websocket)
    verificar(token) {
        return jwt.verify(token, SEGREDO_JWT);
    }

    async validar(req, res, next) {
        if(req.cookies.token) {
            let token = req.cookies.token;

            try {
                //valida o token e recupera as informações do usuário que estão nele
                let payload = jwt.verify(token, SEGREDO_JWT);
                let usuarioRepository = new UsuarioRepository();
                //confere se o usuário ainda existe no banco de dados
                let usuario = await usuarioRepository.buscarPorId(payload.id);
                if(usuario) {
                    req.usuarioLogado = usuario;
                    next();
                }
                else {
                    return res.status(404).json({msg: "Usuário não encontrado"});
                }
            }
            catch(ex) {
                console.log(ex);
                return res.status(401).json({msg: "Token inválido!"});
            }
        }
        else {
            return res.status(401).json({msg: "Token não encontrado!"});
        }
    }
}
