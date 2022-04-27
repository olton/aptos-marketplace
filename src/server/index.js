import path from "path"
import { fileURLToPath } from 'url'
import fs from "fs";
import {info, error} from "./helpers/logging.js"
import {runWebServer} from "./components/webserver.js";
import {createDBConnection, listenNotifies} from "./components/postgresql.js";
import {initAptos} from "./components/aptos.js";
import {broadcast} from "./components/websocket.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf-8'))

globalThis.rootPath = path.dirname(path.dirname(__dirname))
globalThis.serverPath = __dirname
globalThis.clientPath = rootPath + "/src/public_html"
globalThis.srcPath = rootPath + "/src"
globalThis.pkg = readJson(""+path.resolve(rootPath, "package.json"))
globalThis.config = readJson(""+path.resolve(serverPath, "config.json"))
globalThis.ssl = config.server.ssl && (config.server.ssl.cert && config.server.ssl.key)
globalThis.version = pkg.version

const runProcesses = () => {
    setImmediate( () => {} )
}

export const run = () => {
    info("Starting Server...")

    try {

        globalThis.cache = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value
                return true
            }
        })

        globalThis.everyone = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value

                broadcast({
                    channel: p,
                    data: value
                })

                return true
            }
        })

        initAptos()
        createDBConnection()
        listenNotifies()
        runProcesses()
        runWebServer()

        info("Welcome to Server!")
    } catch (e) {
        error(e)
        process.exit(1)
    }
}

run()