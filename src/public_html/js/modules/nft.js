import {appendCollection, appendToken} from "./ui.js";
import {refreshOffers, refreshPropositions} from "./websocket.js";

export const createCollection = async (button) => {
    const dialogContent = `
        <form action="javascript:" onsubmit="return false" id="collectionForm">
            <div class="form-group">
                <label for="collection_name">Collection Name:</label>
                <input data-role="input" name="collection_name">    
                <p class="text-small text-muted mt-0">
                    Important! Collection name must be unique in collections, created by you.                 
                </p>    
            </div>
            <div class="form-group">
                <label for="collection_desc">Description:</label>
                <textarea data-role="textarea" name="collection_desc"></textarea>    
            </div>
            <div class="form-group">
                <label for="collection_uri">Collection URI:</label>
                <input data-role="input" name="collection_uri">    
            </div>
            <div class="form-group">
                <label for="collection_uri">Limitations:</label>
                <input data-role="spinner" name="collection_limit" data-min-value="0">
                <p class="text-small text-muted mt-0">
                    To create unlimited collection set this value to 0 (zero). For otherwise, set the amount of the maximum tokens for this collection.                 
                </p>    
            </div>
        </form>
    `

    const dlg = Metro.dialog.create({
        title: dialogTitle('CREATE', 'COLLECTION'),
        content: dialogContent,
        actionsAlign: "",
        actions: [
            {
                caption: "Create Collection",
                cls: "success -create-collection-button",
                onclick: async () => {
                    const btn = $(".-create-collection-button").prop("disabled", true)
                    const url = '/create-collection'
                    const form = $("#collectionForm")[0]
                    const data = {
                        name: form.elements["collection_name"].value.trim(),
                        desc: form.elements["collection_desc"].value.trim(),
                        uri: form.elements["collection_uri"].value.trim(),
                        limit: +(form.elements["collection_limit"].value),
                        timestamp: datetime().time()
                    }

                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            body: JSON.stringify(data),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })

                        const result = await response.json();

                        if (result.error) {
                            throw new Error(result.error)
                        }

                        globalThis.collections = result.collections
                        const col = collections[`1::${data.name}`]
                        appendCollection({
                            name: col.name,
                            desc: col.description,
                            uri: col.uri,
                            length: col.length,
                            isOwner: col.isOwner,
                            max: col.maximum
                        })

                        Metro.dialog.close(dlg)
                    } catch (e) {
                        toastAlert(e.message)
                        dlg.addClass("ani-horizontal")
                        setTimeout(() => {
                            dlg.removeClass("ani-horizontal")
                        }, 2000)
                    } finally {
                        btn.prop("disabled", false)
                    }
                }
            },
            {
                caption: "Close",
                cls: "link js-dialog-close ml-auto",
                onclick: () => {
                }
            }
        ]
    });
}

export const createToken = async () => {
    let options = []

    for(let c in collections) {
        const col = collections[c]
        if (col.isOwner)
            options.push(`<option value="${col.name}">${col.name}</option>`)
    }

    const dialogContent = `
        <form action="javascript:" onsubmit="return false" id="tokenForm">
            <div class="form-group">
                <label for="collection_name">Collection:</label>
                <select data-role="select" name="collection_name" id="token-collection">
                    ${options.join("\n")}                
                </select>    
            </div>
            <div class="form-group">
                <label for="token_name">Token Name:</label>
                <input data-role="input" name="token_name">    
                <p class="text-small text-muted mt-0">
                    Important! Token name must be unique in collection.                 
                </p>    
            </div>
            <div class="form-group">
                <label for="token_desc">Description:</label>
                <textarea data-role="textarea" name="token_desc"></textarea>    
            </div>
            <div class="form-group">
                <label for="collection_name">Token URI:</label>
                <input data-role="input" name="token_uri">    
            </div>
            <div class="form-group">
                <label for="collection_name">Amount of tokens:</label>
                <input data-role="spinner" name="token_supply" value="1" data-min-value="1">    
            </div>
        </form>
    `

    const dlg = Metro.dialog.create({
        title: dialogTitle('CREATE', 'TOKEN'),
        content: dialogContent,
        actionsAlign: "",
        actions: [
            {
                caption: "Create Token",
                cls: "success -create-toke-button",
                onclick: async () => {
                    const btn = $(".-create-token-button").prop("disabled", true)
                    const url = '/create-token'
                    const form = $("#tokenForm")[0]
                    const data = {
                        collection: form.elements["collection_name"].value.trim(),
                        name: form.elements["token_name"].value.trim(),
                        desc: form.elements["token_desc"].value.trim(),
                        uri: form.elements["token_uri"].value.trim(),
                        supply: +(form.elements["token_supply"].value),
                        timestamp: datetime().time()
                    }
                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            body: JSON.stringify(data),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })

                        const result = await response.json();

                        if (result.error) {
                            throw new Error(result.error)
                        }

                        globalThis.collections = result.collections
                        const token = result.token
                        appendToken({
                            collection: token.collection.name,
                            name: token.key,
                            desc: token.value.description,
                            uri: token.value.uri,
                            id: `${token.value.id.creation_num}::${token.value.id.addr}`,
                            isCreator: token.isCreator,
                            supply: token.value.supply,
                            balance: token.balance
                        })

                        $(".collection.owned").each((i, v)=>{
                            const el = $(v)
                            if (el.data("name") === token.collection.name) {
                                const badge = el.find(".badge")
                                badge.text(+(badge.text()) + 1)
                            }
                        })
                        $(".collection.all-tokens").each((i, v)=>{
                            const el = $(v)
                            const badge = el.find(".badge")
                            badge.text(+(badge.text()) + 1)
                        })

                        Metro.dialog.close(dlg)
                    } catch (e) {
                        toastAlert(e.message)
                        dlg.addClass("ani-horizontal")
                        setTimeout(() => {
                            dlg.removeClass("ani-horizontal")
                        }, 2000)
                    } finally {
                        btn.prop("disabled", false)
                    }
                }
            },
            {
                caption: "Close",
                cls: "link js-dialog-close ml-auto",
                onclick: () => {
                }
            }
        ]
    });
}

export const makeOffer = async (collection, name, id) => {
    const tokenInfoRequest = await fetch('/token-info', {
        method: 'POST',
        body: JSON.stringify({
            id,
            src: 'owner'
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const token = (await tokenInfoRequest.json())["token"]
    const availableTokens = token.balance - token.offersCount
    const dialogContent = `
        <div class="remark warning mt-0">
            You make offer for token below:        
        </div>
        <form action="javascript:" onsubmit="return false" id="offerForm" data-role="validator" data-interactive-check="true">
            <input type="hidden" name="token_id" value="${id}">
            <input type="hidden" name="collection_name" value="${collection}">
            <input type="hidden" name="token_name" value="${name}">
            <div class="form-group">
                <label for="token_name">Token Name:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${escapeStr(name)}                
                </div>
            </div>
            <div class="form-group">
                <label for="collection_name">In Collection:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${escapeStr(collection)}                
                </div>
            </div>
            <div class="form-group">
                <label for="token_amount">Amount of tokens:</label>
                <input data-role="spinner" name="token_amount" value="0" data-min-value="0" data-max-value="${availableTokens}">
                <p class="text-muted text-small mt-0">
                    Available ${availableTokens} token(s) on your balance.                 
                </p>                        
            </div>
            <div class="form-group">
                <label for="offer_price">Offer price:</label>
                <input data-role="input" name="offer_price" value="0" data-min-value="0" data-append="COINS" data-validate="integer">    
            </div>
        </form>
    `

    const dlg = Metro.dialog.create({
        title: dialogTitle('MAKE', 'OFFER'),
        content: dialogContent,
        actionsAlign: "",
        actions: [
            {
                caption: availableTokens ? "Make Offer" : "No tokens to create offer",
                cls: "success -offer-token-button " + (availableTokens ? '' : 'dark disabled'),
                onclick: async () => {
                    const btn = $(".-offer-token-button").prop("disabled", true)
                    const url = '/make-offer'
                    const form = $("#offerForm")[0]
                    const data = {
                        collection: form.elements["collection_name"].value.trim(),
                        token: form.elements["token_name"].value.trim(),
                        id: form.elements["token_id"].value.trim(),
                        amount: form.elements["token_amount"].value.trim(),
                        price: +(form.elements["offer_price"].value.trim()),
                        timestamp: datetime().time()
                    }

                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            body: JSON.stringify(data),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })

                        const result = await response.json();

                        if (result.error) {
                            throw new Error(result.error)
                        }

                        refreshOffers()

                        Metro.dialog.close(dlg)
                    } catch (e) {
                        toastAlert(e.message)
                        dlg.addClass("ani-horizontal")
                        setTimeout(() => {
                            dlg.removeClass("ani-horizontal")
                        }, 2000)
                    } finally {
                        btn.prop("disabled", false)
                    }
                }
            },
            {
                caption: "Close",
                cls: "link js-dialog-close ml-auto",
                onclick: () => {
                }
            }
        ]
    });
}

export const cancelOffer = (offer, collection, name, amount) => {
    const status = offer && collection && name

    if (!status) {
        throw new Error("Offer required!")
    }

    const dialogContent = `
        <div class="remark warning mt-0">
            You want to cancel offer for token below:        
        </div>
        <form action="javascript:" onsubmit="return false" id="offerForm">
            <input type="hidden" name="offer_id" value="${offer}">
            <input type="hidden" name="collection_name" value="${collection}">
            <input type="hidden" name="token_name" value="${name}">
            <input type="hidden" name="token_amount" value="${amount}">
            <div class="form-group">
                <label for="token_name">Token Name:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${escapeStr(name)}                
                </div>
            </div>
            <div class="form-group">
                <label for="collection_name">In Collection:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${escapeStr(collection)}                
                </div>
            </div>
            <div class="form-group">
                <label for="token_amount">Offer Amount:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${amount}                
                </div>
            </div>
        </form>
    `

    const dlg = Metro.dialog.create({
        title: dialogTitle('CANCEL', 'OFFER'),
        content: dialogContent,
        actionsAlign: "",
        actions: [
            {
                caption: "Cancel Offer",
                cls: "alert -offer-token-button",
                onclick: async () => {
                    const btn = $(".-offer-token-button").prop("disabled", true)
                    const url = '/cancel-offer'
                    const form = $("#offerForm")[0]
                    const data = {
                        offer: form.elements["offer_id"].value.trim(),
                        timestamp: datetime().time()
                    }

                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            body: JSON.stringify(data),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })

                        const result = await response.json();

                        if (result.error) {
                            throw new Error(result.error)
                        }

                        refreshOffers()

                        Metro.dialog.close(dlg)
                    } catch (e) {
                        toastAlert(e.message)
                        dlg.addClass("ani-horizontal")
                        setTimeout(() => {
                            dlg.removeClass("ani-horizontal")
                        }, 2000)
                    } finally {
                        btn.prop("disabled", false)
                    }
                }
            },
            {
                caption: "Close",
                cls: "link js-dialog-close ml-auto",
                onclick: () => {
                }
            }
        ]
    });
}

export const claimOffer = async (offer_id) => {
    const offerInfoRequest = await fetch('/offer-info', {
        method: 'POST',
        body: JSON.stringify({
            offer: offer_id
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const offerResult = await offerInfoRequest.json()
    if (!offerResult.ok) {
        toastAlert(offerResult.error)
        return
    }

    const offer = offerResult.offer
    if (balance < offer.token_price) {
        toastAlert("You haven't enough coins on the balance! Please charge your account!")
        return
    }

    const dialogContent = `
        <div class="remark warning mt-0">
            You want to claim offer for token below:        
        </div>
        <form action="javascript:" onsubmit="return false" id="offerForm">
            <input type="hidden" name="offer_id" value="${offer_id}">
            <div class="form-group">
                <label for="token_name">Token Name:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${offer.token_name}                
                </div>
            </div>
            <div class="form-group">
                <label for="collection_name">In Collection:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${offer.collection}                
                </div>
            </div>
            <div class="form-group">
                <label for="token_amount">Tokens Amount:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${offer.token_amount}                
                </div>
            </div>
            <div class="form-group">
                <label for="token_amount">Offer price:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow scroll-x">
                    ${offer.token_price}                
                </div>
            </div>
        </form>
    `

    const dlg = Metro.dialog.create({
        title: dialogTitle('CLAIM', 'OFFER'),
        content: dialogContent,
        actionsAlign: "",
        actions: [
            {
                caption: "Claim this Offer",
                cls: "success -offer-token-button",
                onclick: async () => {
                    const btn = $(".-offer-token-button").prop("disabled", true)
                    const url = '/claim-offer'
                    const form = $("#offerForm")[0]
                    const data = {
                        offer: form.elements["offer_id"].value.trim(),
                        timestamp: datetime().time()
                    }

                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            body: JSON.stringify(data),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })

                        const result = await response.json();

                        if (result.error) {
                            throw new Error(result.error)
                        }

                        refreshPropositions()

                        Metro.dialog.close(dlg)
                        toastSuccess("Congrats! You successfully claimed the offer!\n Token added to your account!")
                    } catch (e) {
                        toastAlert(e.message)
                        dlg.addClass("ani-horizontal")
                        setTimeout(() => {
                            dlg.removeClass("ani-horizontal")
                        }, 2000)
                    } finally {
                        btn.prop("disabled", false)
                    }
                }
            },
            {
                caption: "Close",
                cls: "link js-dialog-close ml-auto",
                onclick: () => {
                }
            }
        ]
    });
}

export const tokenInfo = async (id, src = 'owner', mode = 'full') => {
    const tokenInfoRequest = await fetch('/token-info', {
        method: 'POST',
        body: JSON.stringify({
            id,
            src
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const token = (await tokenInfoRequest.json())["token"]
    console.log(token)
    const dialogContent = `
        <div class="token-info">
            <div class="${token.isCreator && mode === 'full' ? '' : 'd-none'}">
                <p class="remark success mt-0">This token created by You</p>            
            </div>
            <div class="row">
                <div class="cell-4">
                    <div class="image-wrapper border bd-system" style="width: 100%!important">
                        <img src="${token.value.uri}" onerror="this.src='images/nft.png'" class="token-info-image">
                    </div>
                </div>            
                <div class="cell-8">
                    <div class="form-group">
                        <div class="pt-1 pb-1 pl-2 pr-2 text-bold border-bottom bd-system no-overflow scroll-x">
                            ${token.key}                
                            <div class="text-small text-light">
                                ${token.value.description || 'No description'}                    
                            </div>
                        </div>
                        <div class="pt-1 pb-1 pl-2 pr-2 text-bold border-bottom bd-system no-overflow scroll-x">
                            ${token.collection.name}                
                            <div class="text-small text-light">
                                ${token.collection.description || 'No description'}                    
                            </div>
                        </div>
                    </div>            
                </div>
            </div>
            <div class="form-group">
                <label for="token_name">Token ID:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 border bd-system bg-light no-overflow scroll-x">
                    ${token.value.id.creation_num}::${token.value.id.addr}                
                </div>
            </div>            
            <div class="form-group ${token.value.uri ? '' : 'd-none'}">
                <label for="token_name">Token URI:</label>
                <div class="pt-1 pb-1 pl-2 pr-2 border bd-system bg-light no-overflow scroll-x">
                    <a href="${token.value.uri}" target="_blank">${token.value.uri}</a>                
                </div>
            </div>            
            <div class="row mt-2 ${mode === 'full' ? '' : 'd-none'}">
                <div class="cell-6">
                    <label for="token_name">Your balance:</label>
                    <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow text-center">
                        ${token.balance}                
                    </div>
                </div>                            
                <div class="cell-6 ${token.isCreator ? '' : 'd-none'}"">
                    <label for="token_name">Token Supply:</label>
                    <div class="pt-1 pb-1 pl-2 pr-2 text-bold border bd-system bg-light no-overflow text-center">
                        ${token.value.supply}                
                    </div>
                </div>                            
            </div>
        </div>
    `

    Metro.dialog.create({
        title: dialogTitle('TOKEN', 'INFO'),
        content: dialogContent,
        actionsAlign: "",
        actions: [
            {
                caption: "Close",
                cls: "js-dialog-close ml-auto",
                onclick: () => {
                }
            }
        ]
    });
}