import express from 'express';
import JogoController from '../controllers/jogoController.js';
import AuthMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

const controller = new JogoController();

const auth = new AuthMiddleware();

router.get("/:salaId", auth.validar, (req, res) => {
    // #swagger.tags = ['Jogo']
    // #swagger.summary = 'Retorna o estado atual do jogo da sala (fase, jogadores, cartas, dealer)'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.obterEstado(req, res);
});

router.post("/:salaId/rodada", auth.validar, (req, res) => {
    // #swagger.tags = ['Jogo']
    // #swagger.summary = 'Inicia uma nova rodada quando a sala está aguardando'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.novaRodada(req, res);
});

router.post("/:salaId/apostar", auth.validar, (req, res) => {
    // #swagger.tags = ['Jogo']
    // #swagger.summary = 'Faz a aposta do jogador na rodada atual'
    /* #swagger.security = [{
            "jwt": []
    }] */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: '#/components/schemas/aposta'
                }
            }
        }
    }
    */
    controller.apostar(req, res);
});

router.post("/:salaId/pedir", auth.validar, (req, res) => {
    // #swagger.tags = ['Jogo']
    // #swagger.summary = 'Pede mais uma carta (hit)'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.pedir(req, res);
});

router.post("/:salaId/parar", auth.validar, (req, res) => {
    // #swagger.tags = ['Jogo']
    // #swagger.summary = 'Para e encerra o turno (stand)'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.parar(req, res);
});

export default router;
