import {connect} from "./modules/websocket.js"
import {chargeBalance, showWalletInfo} from "./modules/wallet.js"
import {withCtx} from "./components/with.js"
import {cancelOffer, claimOffer, tokenInfo} from "./modules/nft.js"

withCtx(globalThis, {
    showWalletInfo,
    chargeBalance,
    cancelOffer,
    claimOffer,
    tokenInfo
})

const run = () => {
    connect()

    $("#address").text(shorten(account.address, 10))
}

run()
