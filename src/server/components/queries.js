import {query} from "./postgresql.js";

export const getAccount = async pk => {
    const sql = `
        select account_id, account_name, account_email, account_created, account_pk
        from accounts
        where account_pk = $1
        limit 1
    `
    const result = await query(sql, [pk])
    return result.rows.length === 0 ? null : result.rows[0]
}

export const createAccount = async (pk, data = {}) => {
    const {name = '', email = ''} = data
    const sql = `
        insert into accounts (account_pk, account_name, account_email)
        values ($1, $2, $3)
    `

    await query(sql, [pk, name, email])
}

export default {
    getAccount,
    createAccount
}