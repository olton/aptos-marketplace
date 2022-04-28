import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import session from "express-session"
import {websocket} from "./websocket.js"
import {error, info, logObject} from "../helpers/logging.js";
import favicon from "serve-favicon"
import assert from "assert";
import {Account, HexString} from "@olton/aptos"
import * as db from "./queries.js";
import {GALLERY_RETURN_OBJECT} from "@olton/aptos/src/classes/Aptos.js";

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

    const clientConfig = JSON.stringify(config["client"])
    const dateFormat = JSON.stringify(config['date-format'])

    app.get('/', async (req, res) => {
        if (req.session.account) {
            res.redirect('/market')
            return
        }
        res.render('index', {
            title: `${title} v${version}`,
            version,
        })
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

    app.post('/auth', async (req, res) => {
        let account, dbAccount

        try {
            assert(req.body.mnemonic, "Mnemonic required!")
            assert(req.body.mnemonic.split(" ").length === 24, "Mnemonic must contains 24 words!")
            account = Account.fromMnemonic(req.body.mnemonic)
            assert(account.privateKey().length === 64, 'Invalid Mnemonic!')

            dbAccount = await db.getAccount(account.address())
            if (!dbAccount) {
                await db.createAccount(account.address(), account.privateKey())
                dbAccount = await db.getAccount(account.address())
                await faucet.fundAddress(account.authKey(), 0)
            }

            req.session.account = {
                address: account.address(),
                publicKey: account.pubKey(),
                authKey: account.authKey(),
                privateKey: account.privateKey(),
                mnemonic: account.mnemonic(),
                name: dbAccount["account_name"],
                email: dbAccount["account_email"],
            }

            res.send({
                target: "/"
            })
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.get('/my', async (req, res) => {
        const session = req.session

        if (!session.account) {
            res.redirect('/login')
            return
        }

        const collections = await aptos.getOwnedTokens(session.account.address)

        res.render('my', {
            title: `${title} v${version}`,
            version,
            clientConfig,
            dateFormat,
            account: JSON.stringify(session.account),
            collections: JSON.stringify(collections),
        })
    })

    app.get('/market', async (req, res) => {
        const session = req.session

        if (!session.account) {
            res.redirect('/login')
            return
        }

        res.render('market', {
            title: `${title} v${version}`,
            version,
            clientConfig,
            dateFormat,
            account: JSON.stringify(session.account),
        })
    })

    app.get('/deals', async (req, res) => {
        if (!req.session.account) {
            res.redirect('/login')
            return
        }

        const account = Account.fromSeed(req.session.account.privateKey)
        const deals = await db.getDeals(account.sign())

        res.render('deals', {
            title: `${title} v${version}`,
            version,
            clientConfig,
            dateFormat,
            deals: JSON.stringify(deals),
            account: JSON.stringify(req.session.account),
        })
    })

    app.post('/make-offer', async (req, res) => {
        try {
            assert(req.body.timestamp, "Bad request")
            assert(req.body.id, "Token data required")
            assert(req.session.account, "Authentication required!")

            const {id, amount, price = 0} = req.body
            const [token_id, creator] = id.split("::")
            const token = await aptos.getTokenFromOwner(req.session.account.address, {addr: creator, num: token_id})
            const offersCount = await db.getTokenOffersCount(req.session.account.address, req.body.id)

            assert(+amount > 0, "Token amount must be > 0!")
            assert(+amount <= (+(token.balance) - +(offersCount)), "Not enough tokens on balance!")

            const offer = await db.makeOffer(
                req.session.account.address,
                token.collection.name,
                id,
                token.value.name,
                token.value.description,
                token.value.uri,
                +amount,
                +price,
            )
            if (offer.length === 0) {
                throw new Error("Offer can't created!")
            }
            res.send({
                ok: true,
                tokens: await aptos.getOwnedTokens(req.session.account.address),
                offer: offer[0]
            })
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/cancel-offer', async (req, res) => {
        try {
            assert(req.body.timestamp, "Bad request")
            assert(req.body.offer, "Offer data required")
            assert(req.session.account, "Authentication required!")

            const {offer} = req.body

            const result = await db.cancelOffer( +offer )
            if (result.length === 0) {
                throw new Error("Offer can't canceled!")
            }
            res.send({
                ok: true,
            })
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/claim-offer', async (req, res) => {
        try {
            assert(req.body.timestamp, "Bad request")
            assert(req.body.offer, "Offer data required")
            assert(req.session.account, "Authentication required!")

            const offer = await db.getOffer(+req.body.offer)
            const [tokenId, creator] = offer.token_id.split("::")
            const seller = await db.getAccount(offer.seller_address)
            const buyer = await db.getAccount(req.session.account.address)
            const sellerAccount = Account.fromSeed(seller.account_seed, offer.seller_address)
            const buyerAccount = Account.fromSeed(buyer.account_seed, req.session.account.address)
            const price = +offer.token_price

            const buyerBalance = +(await aptos.getAccountBalance(buyerAccount.address()))

            if (buyerBalance - 1000 < price) {
                throw new Error("Insufficient funds on the balance! You must have on your balance the amount of coins not less than the value of the offer plus a reserve of 1000 coins!")
            }

            const claimOffer = await db.claimOffer( +req.body.offer, sellerAccount.sign(), buyerAccount.sign() )
            if (claimOffer === false) {
                throw new Error("Offer can't be claimed!")
            }

            const deal = aptos.dealToken(sellerAccount, buyerAccount, {creator, tokenId}, 1)
            if (!deal) {
                await db.cancelDeal(+claimOffer.deal_id)
                throw new Error(aptos.getLastTransaction().vm_status)
            }

            await aptos.sendCoins(buyerAccount, sellerAccount.address(), price)

            res.send({
                ok: true,
            })
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/create-wallet', async (req, res) => {
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

    app.post('/create-collection', async (req, res) => {
        try {
            assert(req.body.name, "Collection name required!")
            assert(req.session.account, "Authentication required!")
            const {name, desc = '', uri = '', limit = 0} = req.body
            const account = new Account(req.session.account.privateKey)
            let result
            if (+limit === 0) {
                result = await aptos.createUnlimitedCollection(account, desc, name, uri)
            } else {
                result = await aptos.createCollection(account, desc, name, uri, limit)
            }
            if (result) {
                res.send({
                    ok: true,
                    collections: await aptos.getOwnedTokens(account.address())
                })
            } else {
                throw new Error(aptos.getLastTransaction().vm_status)
            }
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/create-token', async (req, res) => {
        try {
            assert(req.body.name, "Token name required!")
            assert(req.session.account, "Authentication required!")
            const {collection, name, desc = '', uri = '', supply = 1} = req.body
            const account = new Account(req.session.account.privateKey)
            const result = await aptos.createToken(account, collection, desc, name, supply, uri, {max_gas_amount: 2000})
            const collections = await aptos.getOwnedTokens(account.address())
            const token = await aptos.getTokenFromCollection(account.address(), collection, name)
            if (result) {
                res.send({
                    ok: true,
                    collections,
                    token: {
                        ...token,
                        balance: token.value.supply,
                        isCreator: true
                    }
                })
            } else {
                throw new Error(aptos.getLastTransaction().vm_status)
            }
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/offer-info', async (req, res) => {
        try {
            assert(req.body.offer, "Offer ID required!")
            assert(req.session.account, "Authentication required!")

            const offer = await db.getOffer(req.body.offer)
            if (offer) {
                res.send({
                    ok: true,
                    offer
                })
            } else {
                throw new Error("Offer not found in DB!")
            }
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/token-info', async (req, res) => {
        try {
            assert(req.body.id, "Token ID required!")
            assert(req.session.account, "Authentication required!")

            const [num, addr] = req.body.id.split("::")
            const token = await aptos.getTokenFromOwner(req.body.src === "creator" ? addr : req.session.account.address, {addr, num})
            if (req.body.src === 'creator') {}
            if (token) {
                res.send({
                    ok: true,
                    token: {
                        ...token,
                        offersCount: req.body.src !== 'owner' ? 0 : await db.getTokenOffersCount(req.session.account.address, req.body.id)
                    }
                })
            } else {
                throw new Error(aptos.getLastTransaction().vm_status)
            }
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/token-offers', async (req, res) => {
        try {
            assert(req.body.id, "Token ID required!")
            assert(req.session.account, "Authentication required!")

            const offers = await db.getTokenOffers(req.session.account.address, req.body.id)

            res.send({
                ok: true,
                offers
            })
        } catch (e) {
            error(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/charge', async(req, res) => {
        try {
            assert(req.session.account, "Authentication required")

            await faucet.fundAddress(req.session.account.address, config.aptos.charge)

            res.send({ok: true})
        } catch (e) {
            alert(e.message)
            res.send({error: e.message})
        }
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
