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

            let payload;
            try {
                //valida o token e recupera as informações do usuário que estão nele
                payload = jwt.verify(token, SEGREDO_JWT);
            }
            catch(ex) {
                return res.status(401).json({msg: "Token inválido!"});
            }

            try {
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
                //falha no banco não é token inválido: o usuário continua logado
                console.error(ex);
                return res.status(500).json({msg: "Erro ao processar requisição"});
            }
        }
        else {
            return res.status(401).json({msg: "Token não encontrado!"});
        }
    }
}
