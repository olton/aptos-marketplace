const login = async (form) => {
    const url = '/auth'
    const data = {
        mnemonic: form.elements.mnemonic.value.trim()
    }
    const button = $(form).find("button")
    try {
        button.disabled = true
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const result = await response.json();

        if (result.error) {
            const _message = "Invalid mnemonic or Account not found in blockchain!"
            throw new Error(_message)
        }
        window.location.href = "/marketplace"
    } catch (e) {
        Metro.toast.create(e.message, null, 5000, "alert")
        $(".login-form").addClass("ani-horizontal")
        setTimeout(()=>{
            $(".login-form").removeClass("ani-horizontal")
        }, 1000)
    } finally {
        button.disabled = false
    }
}

const createWallet = async (button) => {
    const url = '/create'
    const data = {
        timestamp: datetime().time()
    }
    try {
        button.disabled = true
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const result = await response.json();

        if (result.error) {
            const _message = "Invalid mnemonic or Account not found in blockchain!"
            throw new Error(_message)
        }

        const dialogContent = `
            <div>Store your new address info and next time use Mnemonic to login.</div>
            ${walletInfo(result)}
        `

        Metro.dialog.create({
            title: dialogTitle('WALLET', 'INFO'),
            content: dialogContent,
            actions: [
                {
                    caption: "Accept",
                    cls: "js-dialog-close success",
                    onclick: function(){
                        fetch('/init', {
                            method: 'POST',
                            body: JSON.stringify({
                                address: result.address
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                    }
                },
                {
                    caption: "Save to file...",
                    cls: "info",
                    onclick: function(){
                        const a = [
                            `Address: ${result.address}`,
                            `PublicKey: ${result.publicKey}`,
                            `AuthKey: ${result.authKey}`,
                            `PrivateKey: ${result.privateKey}`,
                            `Mnemonic: ${result.mnemonic}`
                        ]
                        saveToFile("address.txt", a.join("\n").trim())
                    }
                },
                {
                    caption: "Cancel",
                    cls: "js-dialog-close",
                    onclick: function(){
                    }
                }
            ]
        });

    } catch (e) {
        Metro.toast.create(e.message, null, 5000, "alert")
    } finally {
        button.disabled = false
    }
}

;$(()=>{
    if (parseJson(globalThis.walletError)) {
        Metro.toast.create(globalThis.walletError, null, 5000, "alert")
    }
})