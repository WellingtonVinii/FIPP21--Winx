import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createRequire } from "module";

import usuarioRouter from './routes/usuarioRouter.js';
import loginRouter from './routes/loginRouter.js';
import socketInit from './sockets/socket.js';

const require = createRequire(import.meta.url);
const outputJson = require("./outputSwagger.json");

const app = express();
const server = http.createServer(app);

//3000 = frontend Next, 5000 = documentação do swagger
const origens = ['http://localhost:3000', 'http://localhost:5000'];

const io = new Server(server, {
    cors: { origin: origens, credentials: true }
});

socketInit(io);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: origens,
    credentials: true // cookies com http only serão enviadas automaticamente apenas se essa flag estiver true
}));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(outputJson, {
    swaggerOptions: {
        withCredentials: true // para permitir o envio de cookies da nossa rota /docs
    }
}));

app.use("/usuario", usuarioRouter);
app.use("/login", loginRouter);

server.listen(5000, () => {
    console.log("backend em execução na porta 5000 - documentação em http://localhost:5000/docs");
});
