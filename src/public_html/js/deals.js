import {connect} from "./modules/websocket.js"
import {chargeBalance, showWalletInfo} from "./modules/wallet.js"
import {withCtx} from "./components/with.js"
import {updateDeals} from "./modules/ui.js";

withCtx(globalThis, {
    showWalletInfo,
    chargeBalance,
})

const run = () => {
    connect()

    $("#address").text(shorten(account.address, 10))

    if (deals) {
        updateDeals(deals)
    }
}

run()
