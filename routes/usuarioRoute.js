import express from 'express';
import UsuarioController from '../controllers/usuarioController.js';

const router = express.Router();

const controller = new UsuarioController();

router.post("/", (req, res) => {

    // swagger.tags = ["Usuario"]
    // swagger.summary = "Cadastra um novo usuário"

    controller.cadastrar(req, res)
});

export default router;