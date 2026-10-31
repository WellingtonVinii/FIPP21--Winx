import express from 'express';
import UsuarioController from '../controllers/usuarioController.js';
import AuthMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

const controller = new UsuarioController();

const auth = new AuthMiddleware();

router.post("/", (req, res) => {
    // #swagger.tags = ['Usuário']
    // #swagger.summary = 'Cadastra um novo usuário (área pública)'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: '#/components/schemas/usuario'
                }
            }
        }
    }
    */
    controller.cadastrar(req, res);
});

router.get("/logado", auth.validar, (req, res) => {
    // #swagger.tags = ['Usuário']
    // #swagger.summary = 'Retorna o usuário autenticado pelo token'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.logado(req, res);
});

router.get("/email/:email", auth.validar, (req, res) => {
    // #swagger.tags = ['Usuário']
    // #swagger.summary = 'Retorna um usuário através do e-mail'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.buscarPorEmail(req, res);
});

router.get("/:id", auth.validar, (req, res) => {
    // #swagger.tags = ['Usuário']
    // #swagger.summary = 'Retorna um usuário através do ID'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.buscarPorId(req, res);
});

export default router;
