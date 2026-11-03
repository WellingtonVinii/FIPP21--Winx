import CartaEntity from "../entities/cartaEntity.js";

const API_BARALHO = "https://deckofcardsapi.com/api/deck";

const NAIPES = {
    SPADES: "Espadas",
    HEARTS: "Copas",
    DIAMONDS: "Ouros",
    CLUBS: "Paus"
};

//acesso aos dados do baralho, que ficam na https://deckofcardsapi.com/ e não no nosso banco
export default class BaralhoRepository {

    async #requisitar(url) {
        let resposta = await fetch(url);
        let json = await resposta.json();
        if(!json.success) {
            throw new Error(json.error ?? "Erro na API do baralho");
        }
        return json;
    }

    //cria um baralho embaralhado e devolve o código dele
    async novo() {
        let json = await this.#requisitar(`${API_BARALHO}/new/shuffle/?deck_count=1`);
        return json.deck_id;
    }

    async comprar(codigoBaralho, quantidade) {
        let json = await this.#requisitar(`${API_BARALHO}/${codigoBaralho}/draw/?count=${quantidade}`);
        if(json.cards.length < quantidade) {
            throw new Error("O baralho não tem cartas suficientes");
        }

        return json.cards.map(c => new CartaEntity(0, c.code, c.image, null, null, CartaEntity.valorPorNome(c.value), NAIPES[c.suit] ?? c.suit));
    }
}
