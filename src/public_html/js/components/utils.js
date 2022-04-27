const n2f = v => Number(v).format(0, null, " ", ".")
const shorten = (v, l = 5) => `${v.substring(0, l) + '...' + v.substring(v.length - l)}`
const parseJson = val => {
    try {
        return JSON.parse(val)
    } catch (e) {
        return val
    }
}
const escapeStr = (v = "") => {
    return !v ? "" : v.replace(/'/g, '&apos;').replace(/"/g, '&quot;').trim()
}

const toastAlert = (msg, t = 5000) => Metro.toast.create(msg, null, t, "alert")
const toastInfo = (msg, t = 5000) => Metro.toast.create(msg, null, t, "info")
const toastSuccess = (msg, t = 5000) => Metro.toast.create(msg, null, t, "success")
const toast = (msg, t = 5000) => Metro.toast.create(msg, null, t)