import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import session from "express-session"
import {websocket} from "./websocket.js"
import {error, info} from "../helpers/logging.js";
import favicon from "serve-favicon"
import assert from "assert";
import {Account} from "@olton/aptos"
import db from "./queries.js";

const title = `Aptos NFT Marketplace Demo`
const app = express()

const route = () => {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: 'Russian warship - Fuck You!',
        cookie: {
            maxAge: 24 * 3600000,
            secure: 'auto'
        }
    }))
    app.use(express.static(path.join(srcPath, 'public_html')))
    app.use(favicon(path.join(srcPath, 'public_html', 'favicon.ico')))
    app.locals.pretty = true
    app.set('views', path.resolve(srcPath, 'public_html'))
    app.set('view engine', 'pug')

    const clientConfig = JSON.stringify(config.client)
    const dateFormat = JSON.stringify(config['date-format'])

    app.get('/', async (req, res) => {
        // res.render('index', {
        //     title: `${title} v${version}`,
        //     version,
        //     clientConfig,
        //     dateFormat,
        // })
        res.redirect("/marketplace")
    })

    app.get('/login', async (req, res) => {
        res.render('login', {
            title: `Login to ${title} v${version}`,
            version,
            clientConfig,
            dateFormat,
        })
    })

    app.get('/logout',(req,res) => {
        req.session.destroy()
        res.redirect('/')
    })

    app.post('/create', async (req, res) => {
        try {
            assert(req.body.timestamp, "Bad request")
            const account = new Account()
            res.send({
                address: account.address(),
                publicKey: account.pubKey(),
                authKey: account.authKey(),
                privateKey: account.privateKey(),
                mnemonic: account.mnemonic()
            })
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/auth', async (req, res) => {
        let account, dbAccount

        try {
            assert(req.body.mnemonic, "Mnemonic required!")
            assert(req.body.mnemonic.split(" ").length === 24, "Mnemonic must contains 24 words!")
            account = Account.fromMnemonic(req.body.mnemonic)
            assert(account.privateKey().length === 64, 'Invalid Mnemonic!')
            dbAccount = await db.getAccount(account.pubKey())
            if (!dbAccount) {
                await db.createAccount(account.pubKey())
                dbAccount = await db.getAccount(account.pubKey())
            }
            req.session.account = {
                address: account.address(),
                publicKey: account.pubKey(),
                authKey: account.authKey(),
                privateKey: account.privateKey(),
                mnemonic: account.mnemonic(),
                name: dbAccount.account_name,
                email: dbAccount.account_email,
            }
            res.send(req.session.account)
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.get('/marketplace', async (req, res) => {
        const session = req.session
        if (!session.account) {
            res.redirect('/login')
            return
        }
        res.render('marketplace', {
            title: `${title} v${version}`,
            version,
            clientConfig,
            dateFormat,
            account: JSON.stringify(session.account)
        })
    })

}

export const runWebServer = () => {
    let httpWebserver, httpsWebserver

    if (ssl) {
        const {cert, key} = config.server.ssl
        httpWebserver = http.createServer((req, res)=>{
            res.writeHead(301,{Location: `https://${req.headers.host}:${config.server.ssl.port || config.server.port}${req.url}`});
            res.end();
        })

        httpsWebserver = https.createServer({
            key: fs.readFileSync(key[0] === "." ? path.resolve(rootPath, key) : key),
            cert: fs.readFileSync(cert[0] === "." ? path.resolve(rootPath, cert) : cert)
        }, app)
    } else {
        httpWebserver = http.createServer({}, app)
    }

    route()

    const runInfo = `${title} Server running on ${ssl ? "HTTPS" : "HTTP"} on port ${ssl ? config.server.ssl.port : config.server.port}`

    httpWebserver.listen(config.server.port, () => {
        info(runInfo)
    })

    if (ssl) {
        httpsWebserver.listen(config.server.ssl.port || config.server.port, () => {
            info(runInfo)
        })
    }

    websocket(ssl ? httpsWebserver : httpWebserver)
}
