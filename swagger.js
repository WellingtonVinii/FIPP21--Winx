import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "API FIPP21",
        description: "API da plataforma FIPP21 - jogo 21 (Blackjack) multiplayer"
    },
    host: "localhost:5000",
    components: {
        schemas: {
            erro: {
                msg: 'Mensagem de erro'
            },
            usuario: {
                nome: "Fulano de Tal",
                email: "fulano@unoeste.br",
                senha: "123abc"
            },
            login: {
                email: "fulano@unoeste.br",
                senha: "123abc"
            }
        }
    },
    securityDefinitions: {
        jwt: {
            type: 'apiKey',
            in: 'cookie',
            name: 'token',
            description: 'JWT gerado a partir da autenticação'
        }
    }
}
const saida = "./outputSwagger.json";
const routes = ["./server.js"];

swaggerAutogen({openapi: '3.0.0'})(saida, routes, doc)
.then(async () => {
    await import("./server.js")
})
