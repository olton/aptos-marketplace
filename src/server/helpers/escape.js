export const escapeQuotes = v => {
    return !v ? "" : v.replace(/'/g, '\\\'').replace(/"/g, '\\\"').trim()
}