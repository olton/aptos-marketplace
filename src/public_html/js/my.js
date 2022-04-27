import {connect, refreshOffers} from "./modules/websocket.js";
import {chargeBalance, showWalletInfo} from "./modules/wallet.js";
import {createCollection, createToken, makeOffer, claimOffer, cancelOffer, tokenInfo} from "./modules/nft.js";
import {withCtx} from "./components/with.js";
import {updateCollections, appendCollection, appendToken} from "./modules/ui.js";

withCtx(globalThis, {
    showWalletInfo,
    chargeBalance,
    createCollection,
    createToken,
    appendCollection,
    appendToken,
    makeOffer,
    claimOffer,
    cancelOffer,
    refreshOffers,
    tokenInfo
})

const run = () => {
    connect()

    $("#address").text(shorten(account.address, 10))

    updateCollections(collections)

    $("#collections-container").on("click", ".collection", function() {
        const el = $(this)
        const name = el.data("name")
        const all = el.hasClass("all-tokens")
        const received = el.hasClass("received-tokens")
        const tokens = $(".token")
        const collections = $(".collection")

        collections.removeClass("selected")
        el.addClass("selected")

        const resetDisplay = el => $(el).css("display", "flex")

        if (all) {
            tokens.show(resetDisplay)
            return
        }

        if (received) {
            $.each(tokens, (i, v) => {
                const t = $(v)
                if (Metro.utils.bool(t.attr("data-received-token"))) {
                    t.show(resetDisplay)
                } else {
                    t.hide()
                }
            })
        } else {
            $.each(tokens, (i, v) => {
                const t = $(v)
                const collection = t.data("collection")
                if (collection === name) {
                    t.show(resetDisplay)
                } else {
                    t.hide()
                }
            })
        }
    })
}

run()
