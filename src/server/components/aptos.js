import {Aptos, FaucetClient} from "@olton/aptos";

export const initAptos = () => {
    globalThis.aptos = new Aptos(config.aptos.api)
    globalThis.faucet = new FaucetClient(config.aptos.faucet, aptos)
}
