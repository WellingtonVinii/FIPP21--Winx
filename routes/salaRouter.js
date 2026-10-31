import express from 'express';
import SalaController from '../controllers/salaController.js';
import AuthMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

const controller = new SalaController();

const auth = new AuthMiddleware();

router.post("/", auth.validar, (req, res) => {
    // #swagger.tags = ['Sala']
    // #swagger.summary = 'Cria uma nova sala de jogo (o dono é o usuário logado)'
    /* #swagger.security = [{
            "jwt": []
    }] */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: '#/components/schemas/sala'
                }
            }
        }
    }
    */
    controller.cadastrar(req, res);
});

router.get("/", auth.validar, (req, res) => {
    // #swagger.tags = ['Sala']
    // #swagger.summary = 'Lista as salas criadas pelo usuário logado'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.listar(req, res);
});

router.get("/:id", auth.validar, (req, res) => {
    // #swagger.tags = ['Sala']
    // #swagger.summary = 'Retorna a sala e seus participantes ativos'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.obter(req, res);
});

router.post("/:id/entrar", auth.validar, (req, res) => {
    // #swagger.tags = ['Sala']
    // #swagger.summary = 'Entra na sala através do código (id da sala)'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.entrar(req, res);
});

router.post("/:id/sair", auth.validar, (req, res) => {
    // #swagger.tags = ['Sala']
    // #swagger.summary = 'Sai da sala'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.sair(req, res);
});

export default router;
