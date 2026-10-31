import AuthMiddleware from "../middlewares/authMiddleware.js";
import UsuarioRepository from "../repositories/usuarioRepository.js";

export default class LoginController {

    #usuarioRepository;

    constructor() {
        this.#usuarioRepository = new UsuarioRepository();
    }

    async token(req, res) {
        try{
            let {email, senha} = req.body;
            if(email && senha) {
                let usuario = await this.#usuarioRepository.validarAcesso(email, senha);
                if(usuario) {
                    let auth = new AuthMiddleware();
                    let token = auth.token(usuario.id, usuario.nome, usuario.email);
                    //a flag http only garante que o token não estará visível aos scripts que rodam no navegador
                    res.cookie("token", token, {
                        httpOnly: true,
                    });
                    return res.status(200).json({token: token, usuario: usuario});
                }
                else {
                    return res.status(401).json({msg: "E-mail ou senha inválidos"});
                }
            }
            else {
                return res.status(400).json({msg: "Informe um e-mail e uma senha para gerar um token de acesso!"});
            }
        }
        catch(exception) {
            console.log(exception);
            return res.status(500).json({msg: "Erro ao gerar token de acesso"});
        }
    }

    async logout(req, res) {
        res.clearCookie("token");
        return res.status(200).json({msg: "Logout realizado com sucesso"});
    }
}
