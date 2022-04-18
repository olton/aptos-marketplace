const n2f = v => Number(v).format(0, null, " ", ".")
const shorten = (v, l = 5) => `${v.substring(0, l) + '...' + v.substring(v.length - l)}`
const parseJson = val => {
    try {
        return JSON.parse(val)
    } catch (e) {
        return val
    }
}

