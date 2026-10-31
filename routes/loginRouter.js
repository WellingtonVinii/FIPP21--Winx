import express from 'express';
import LoginController from '../controllers/loginController.js';

const router = express.Router();

const controller = new LoginController();

router.post("/", (req, res) => {
    // #swagger.tags = ['Login']
    // #swagger.summary = 'Gera o token de autenticação (cookie)'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: '#/components/schemas/login'
                }
            }
        }
    }
    */
    controller.token(req, res);
});

router.post("/logout", (req, res) => {
    // #swagger.tags = ['Login']
    // #swagger.summary = 'Remove o cookie de autenticação'
    controller.logout(req, res);
});

export default router;
