import {query} from "./postgresql.js";
import {escapeQuotes} from "../helpers/escape.js"
import {datetime} from "@olton/datetime"

export const getAccount = async addr => {
    const sql = `
        select account_id, account_name, account_email, account_created, account_address, account_seed
        from accounts
        where account_address = $1
        limit 1
    `
    const result = await query(sql, [addr])
    return result.rows.length === 0 ? null : result.rows[0]
}

export const createAccount = async (addr, seed, data = {}) => {
    const {name = '', email = ''} = data
    const sql = `
        insert into accounts (account_address, account_seed, account_name, account_email)
        values ($1, $2, $3, $4)        
    `

    await query(sql, [escapeQuotes(addr), escapeQuotes(seed), escapeQuotes(name), escapeQuotes(email)])
}

export const wipe = async () => {
    await query(`TRUNCATE accounts tokens RESTART IDENTITY CASCADE`)
    await query(`TRUNCATE offers tokens RESTART IDENTITY CASCADE`)
}

export const wipeAccount = async (addr) => {
    await query(`
        delete from accounts 
        where account_address = $1
    )`, [addr])

    await query(`
        delete from offers 
        where seller_address = $1 || buyer_address = $1
    )`, [addr])
}

export const makeOffer = async (seller, collection, id, name, desc, uri, amount, price) => {
    const sql = `
        insert into offers(token_id, token_name, token_desc, token_amount, collection, seller_address, offer_date, token_uri, token_price)
        values($1, $2, $3, $4, $5, $6, now(), $7, $8)
        returning *
    `
    return (await query(sql, [id, name, desc, amount, collection, seller, uri, price])).rows
}

export const getOffers = async (creator, {limit = 24, offset = 0} = {}) => {
    const sql = `
        select o.*, (select count(*) from deals d where d.offer_id = o.offer_id) > 0 as closed 
        from offers o
        where o.seller_address = $1 
        limit $2 offset $3
    `
    return (await query(sql, [creator, limit, offset])).rows
}

export const getPropositions = async (exclude, {limit = 24, offset = 0} = {}) => {
    const sql = `
        select o.*, (select count(*) from deals d where d.offer_id = o.offer_id) > 0 as closed 
        from offers o
        where seller_address != $1 and (select count(*) from deals d where d.offer_id = o.offer_id) = 0
        order by random()
        limit $2 offset $3
    `
    return (await query(sql, [exclude, limit, offset])).rows
}

export const getOffer = async (offer_id) => {
    const sql = `
        select * 
        from offers 
        where offer_id = $1 limit 1
    `
    return (await query(sql, [offer_id])).rows[0]
}

export const getDialByOffer = async (offer_id) => {
    const sql = `
        select * 
        from deals 
        where offer_id = $1 limit 1
    `
    return (await query(sql, [offer_id])).rows
}

export const cancelOffer = async (offer_id) => {
    let deals = await getDialByOffer(offer_id)
    if (deals.length) {
        return false
    }
    const sql = `delete from offers where offer_id = $1`
    await query(sql, [offer_id])
    return true
}

export const cancelDealByOffer = async (offer_id) => {
    let deals = await getDialByOffer(offer_id)
    if (!deals.length) {
        return false
    }
    const sql = `delete from deals where offer_id = $1`
    await query(sql, [offer_id])
    return true
}

export const cancelDeal = async (deal_id) => {
    const sql = `delete from deals where deal_id = $1`
    await query(sql, [deal_id])
    return true
}

export const claimOffer = async (offer_id, seller_sign, buyer_sign) => {
    let deals = await getDialByOffer(offer_id)
    if (deals.length) {
        return false
    }
    const sql = `
        insert into deals(offer_id, seller_sign, buyer_sign)
        values($1, $2, $3)
        returning *
    `
    return (await query(sql, [offer_id, seller_sign, buyer_sign])).rows
}

export const getTokenOffersCount = async (creator, token_id) => {
    const sql = `
        select sum(token_amount) as tokens_offered
        from offers o
        where seller_address = $1 
          and token_id = $2
          and (select count(*) from deals d where d.offer_id = o.offer_id) = 0
    `
    return (await query(sql, [creator, token_id])).rows[0].tokens_offered
}

export const getTokenOffers = async (creator, token_id) => {
    const sql = `
        select *
        from offers o
        where seller_address = $1 
          and token_id = $2
          and (select count(*) from deals d where d.offer_id = o.offer_id) = 0
    `
    return (await query(sql, [creator, token_id])).rows
}

export const getDeals = async (sign) => {
    const sql = `
        select d.*, o.*
        from deals d
        left join offers o on d.offer_id = o.offer_id
        where d.buyer_sign = $1
        order by d.deal_date desc
    `
    return (await query(sql, [sign])).rows
}