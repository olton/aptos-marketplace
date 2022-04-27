import {updateAccountBalance, updateOffers} from "./ui.js";

let webSocket

export const isOpen = (ws) => ws && ws.readyState === ws.OPEN

export const connect = () => {
    const {host, port = 80, secure} = config.server
    const ws = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}:${port}`)

    ws.onmessage = event => {
        try {
            const content = JSON.parse(event.data)
            if (typeof wsMessageController === 'function') {
                wsMessageController.apply(null, [ws, content])
            }
        } catch (e) {
            console.log(e.message)
            console.log(event.data)
            console.log(e.stack)
        }
    }

    ws.onerror = error => {
        error('Socket encountered error: ', error.message, 'Closing socket');
        ws.close();
    }

    ws.onclose = event => {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
        setTimeout(connect, 1000)
    }

    ws.onopen = event => {
        console.log('Connected to Aptos Market Server');
    }

    webSocket = ws
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    switch(channel) {
        case 'welcome': {
            requestBalance(ws)
            if (creator) refreshOffers(ws)
            if (!creator) refreshPropositions(ws)
            break
        }
        case 'balance': {
            updateAccountBalance(data)
            setTimeout(requestBalance, 5000, ws)
            break
        }
        case 'offers': {
            $("#refresh-proposition-button").prop("disabled", false)
            updateOffers(data, 'offers')
            break
        }
        case 'propositions': {
            $("#refresh-proposition-button").prop("disabled", false)
            updateOffers(data, 'propositions')
            break
        }
    }
}

export const requestBalance = (ws = webSocket) => {
    if (isOpen(ws)) {
        ws.send(JSON.stringify({channel: 'balance', data: {address: account.address}}))
    }
}

export const refreshOffers = (ws = webSocket) => {
    if (isOpen(ws)) {
        $("#refresh-proposition-button").prop("disabled", true)
        ws.send(JSON.stringify({channel: 'offers', data: {address: account.address, limit: 1000, offset: 0}}))
    }
}

export const refreshPropositions = (ws = webSocket) => {
    if (isOpen(ws)) {
        $("#refresh-proposition-button").prop("disabled", true)
        ws.send(JSON.stringify({channel: 'propositions', data: {exclude: account.address, limit: 24, offset: 0}}))
    }
}
