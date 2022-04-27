import {WebSocketServer, WebSocket} from "ws";
import * as db from "./queries.js"

export const websocket = (server) => {
    globalThis.wss = new WebSocketServer({ server })

    wss.on('connection', (ws, req) => {

        const ip = req.socket.remoteAddress

        ws.send(JSON.stringify({
            channel: "welcome",
            data: `Welcome to Server v${version}`
        }))

        ws.on('message', async (msg) => {
            const {channel, data} = JSON.parse(msg)
            switch (channel) {
                case "request": {
                    response(ws, channel, {})
                    break
                }
                case "balance": {
                    let balance = 0
                    try {
                        balance = await aptos.getAccountBalance(data.address)
                    } finally {
                        response(ws, channel, {balance})
                    }
                    break
                }
                case "offers": {
                    let offers = []
                    try {
                        offers = await db.getOffers(data.address, {limit: data.limit, offset: data.offset})
                    } finally {
                        response(ws, channel, {offers})
                    }
                    break
                }
                case "propositions": {
                    let offers = []
                    try {
                        offers = await db.getPropositions(data.exclude, {limit: data.limit, offset: data.offset})
                    } finally {
                        response(ws, channel, {offers})
                    }
                    break
                }
            }
        })
    })
}

export const response = (ws, channel, data) => {
    ws.send(JSON.stringify({
        channel,
        data
    }))
}

export const broadcast = (data) => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data))
        }
    })
}
