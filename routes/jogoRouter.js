import express from 'express';
import JogoController from '../controllers/jogoController.js';
import AuthMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

const controller = new JogoController();

const auth = new AuthMiddleware();

//as jogadas (apostar, pedir, parar, nova rodada) são feitas pelo WebSocket (sockets/jogoSocket.js)
router.get("/:salaId", auth.validar, (req, res) => {
    // #swagger.tags = ['Jogo']
    // #swagger.summary = 'Retorna o estado atual do jogo da sala (fase, jogadores, cartas, dealer)'
    // #swagger.description = 'As jogadas são feitas pelo WebSocket com os eventos jogo:apostar, jogo:pedir, jogo:parar e jogo:novaRodada.'
    /* #swagger.security = [{
            "jwt": []
    }] */
    controller.obterEstado(req, res);
});

export default router;
