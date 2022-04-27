import {createWallet} from "./modules/wallet.js"
import {login} from "./modules/auth.js"
import {withCtx} from "./components/with.js";

const a1 = `area field scatter industry apology control friend sail admit mask sell spread increase prepare virtual pulse pact hobby olympic uphold anger solid kick ship`
const a2 = `present cage autumn crawl height giggle sorry fix inhale phrase wealth frequent myself protect quote sense stairs verify matrix manual spice silly annual field`

withCtx(globalThis, {
    createWallet,
    login,
    a1, a2
})


;$(()=>{
    if (parseJson(globalThis.walletError)) {
        Metro.toast.create(globalThis.walletError, null, 5000, "alert")
    }
})