export const updateAccountBalance = data => {
    globalThis.balance = +(data.balance) || 0
    $("#balance").text(n2f(globalThis.balance))
}

export const updateCollections = data => {
    appendCollection({
        name: "All Tokens",
        desc: "Show All My Tokens",
        uri: "",
        length: 0,
        logo: "images/collection_bw.png",
        cls: "all-tokens"
    })
    appendCollection({
        name: "Received Tokens",
        desc: "Tokens I received or bought",
        uri: "",
        length: 0,
        logo: "images/buy.png",
        cls: "received-tokens"
    })
    let tokenCount = 0
    let receivedCount = 0
    for(let c in data) {
        const col = data[c]

        if (col.isOwner) {
            appendCollection({
                name: col.name,
                desc: col.description,
                uri: col.uri,
                length: col.length,
                isOwner: col.isOwner,
                max: col.maximum
            })
        }

        for (let t of col["tokens"]) {
            appendToken({
                collection: col.name,
                name: t.key,
                desc: t.value.description,
                uri: t.value.uri,
                id: `${t.value.id.creation_num}::${t.value.id.addr}`,
                isCreator: t.isCreator,
                supply: t.value.supply,
                balance: t.balance
            })
            if (!t.isCreator) receivedCount++
            tokenCount++
        }
    }
    $(".all-tokens").find(".badge").text(tokenCount)
    $(".received-tokens").find(".badge").text(receivedCount)
    $(".collection").eq(0).addClass("selected")
}

export const appendCollection = ({
     name,
     desc,
     uri = "",
     length = 0,
     logo = "images/collection.png",
     isOwner = false,
     max = -1,
     cls = ""
}) => {
    const container = $("#collections-container")

    const content = $("<div>")
        .addClass(`collection ${cls} ${isOwner ? 'owned' : ''} ${length ? '' : 'faded'}`)
        .attr("data-name", escapeStr(name))
        .attr("data-uri", escapeStr(uri))
        .html(`
            <div class="badge bg-cyan fg-white inside" title="Tokens in collection">
                ${length}
            </div>
            <div class="collection-max ${max === -1 ? 'd-none' : ''}" title="Limit for maximum tokens in collection">
                <span class="reduce-3">LIMIT:</span> 
                <span class="${max === 0 ? 'mif-infinite' : ''}">${max !== 0 ? max : ''}</span>
            </div>
            <img src="${logo}" class="">
            <div class="title">
                <div class="text-bold no-wrap text-ellipsis">${escapeStr(name)}</div>
                <div class="sub-title no-wrap text-ellipsis">${escapeStr(desc || '&nbsp;')}</div>
            </div>
        `)

    if (content.hasClass("all-tokens") || content.hasClass("received-tokens")) {
        content.removeClass("faded")
    }

    container.append(content)
}

export const appendToken = ({
    collection,
    name,
    desc,
    uri,
    id,
    isCreator,
    supply = 0,
    balance = 0,
    defaultImage = "images/nft.png"
}) => {
    const container = $("#tokens-container")
    const content = $("<div>")
        .addClass("img-container thumbnail token bg-light")
        .attr("data-collection", escapeStr(collection))
        .attr("data-name", escapeStr(name))
        .attr("data-id", escapeStr(id))
        .attr("data-received-token", !isCreator)
        .html(`
            <div class="token-creator bg-white fg-green ${isCreator ? '' : 'd-none'}" title="Created by Me!">
                <span class="mif-pan-tool"></span>
            </div>
            <div class="token-sub-info">
                <div class="token-label bg-darkGray fg-white ${!balance ? 'd-none' : ''}">
                    <span>Available ${balance} of ${isCreator ? supply : balance}</span>
                </div>
            </div>
            <div class="img-wrapper">
                <img src="${uri || defaultImage}" onerror="this.onerror=null; this.src='${defaultImage}'" class="">
            </div>
            <div class="title">
                <div class="text-bold mb-1 no-wrap text-ellipsis">${escapeStr(name)}</div>
                <div class="token-desc">${escapeStr(desc || '&nbsp;')}</div>
            </div>
            <div class="mt-auto mb-1 token-actions border-top bd-system pt-1 text-center">
                <butoon class="button mini success ${!balance ? 'd-none' : ''}" onclick="makeOffer('${collection}','${name}','${id}')">Make Offer</butoon>
                <span class="${!balance ? '' : 'd-none'}">TOKEN SOLD</span>
                <butoon class="button mini square info" onclick="tokenInfo('${id}', 'onwer', 'full')">
                    <span class="mif-info"></span>                
                </butoon>
            </div>
        `)

    container.append(content)
}

export const updateOffers = (data, mode = 'offers') => {
    const container = $("#offers-container").clear()
    const defaultImage = "images/nft.png"

    if (data.offers.length === 0) {
        container.append(
            $("<div>").addClass("text-center").html("No Offers :(")
        )
        return
    }

    for(let t of data.offers) {
        const {offer_id, collection, token_amount, token_name, token_desc, token_uri, token_id, closed, seller_address, token_price} = t
        const content = $("<div>")
            .addClass(`img-container thumbnail offer bg-light ${closed ? 'offer-closed' : ''}`)
            .attr("data-collection", escapeStr(collection))
            .attr("data-name", escapeStr(token_name))
            .attr("data-id", escapeStr(token_id))
            .attr("data-offer", escapeStr(offer_id))
            .html(`
                <div class="img-wrapper">
                    <img src="${token_uri || defaultImage}" onerror="this.onerror=null; this.src='${defaultImage}'" class="">
                </div>
                <div class="title">
                    <div class="text-bold mb-1 no-wrap text-ellipsis">${escapeStr(token_name)}</div>
                    <div class="no-wrap text-ellipsis">${escapeStr(token_desc || '&nbsp;')}</div>
                </div>
                <div class="mt-1 token-actions border-top bd-system pt-1 text-center d-flex flex-align-center flex-justify-center flex-column">
                    <div class="reduce-4">TOKEN AMOUNT</div>
                    <span class="text-leader2 m-0 text-bold">                        
                        ${n2f(+token_amount)}
                    </span>
                </div>
                <div class="mt-1 token-actions border-top bd-system pt-1 text-center d-flex flex-align-center flex-justify-center flex-column">
                    <div class="reduce-4">OFFER PRICE</div>
                    <span class="text-leader2 m-0 text-bold">                        
                        ${n2f(+token_price)}
                    </span>
                </div>
                <div class="mt-1 mb-1 token-actions border-top bd-system pt-1 text-center">
                    <span class="${closed ? '' : 'd-none'}">OFFER CLOSED</span>
                    <butoon class="${seller_address === account.address ? '' : 'd-none'} button mini ${closed ? 'd-none' : 'alert'}" onclick="cancelOffer(${offer_id}, '${collection}', '${token_name}', ${token_amount})">Cancel Offer</butoon>
                    <butoon class="${seller_address === account.address ? 'd-none' : closed ? 'dark disabled':'success'} button mini" onclick="claimOffer(${offer_id})">Claim Offer</butoon>
                    <butoon class="button mini square info" onclick="tokenInfo('${token_id}', 'creator', 'short')">
                        <span class="mif-info"></span>                
                    </butoon>
                </div>
            `)

        container.append(content)
    }
}

export const updateDeals = deals => {
    const container = $("#deals-container tbody").clear()
    if (!deals.length) {
        container.html(`
            <div class="text-center">Nothing to show!</div>
        `)
        return
    }
    for(let d of deals) {
        const row = $("<tr>").appendTo(container)
        row.html(`
            <td>${datetime(d.deal_date).format(dateFormat.full)}</td>
            <td>
                <div>${d.token_name}</div>            
            </td>
            <td>
                <div>${d.token_amount}</div>            
            </td>
            <td>
                <div>${d.token_price}</div>            
            </td>
        `)
    }
}