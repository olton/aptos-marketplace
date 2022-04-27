export const createWallet = async (button) => {
    const url = '/create-wallet'
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

export const chargeBalance = async button => {
    const url = '/charge'
    const data = {
        authKey: account.authKey
    }
    try {
        if (button) button.disabled = true
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const result = await response.json();
        if (result.error)
            throw new Error(result.error)
    } catch (error) {
        Metro.toast.create(error.message, null, 5000, "alert")
    } finally {
        if (button) button.disabled = false
    }
}

export const showWalletInfo = () => {
    const dialogContent = `
            <div class="remark warning mt-0">Store your address info and next time use Mnemonic to login.</div>
            ${walletInfo(account)}
        `

    Metro.dialog.create({
        title: dialogTitle('WALLET', 'INFO'),
        content: dialogContent,
        actionsAlign: "left",
        actions: [
            {
                caption: "Close",
                cls: "js-dialog-close success",
                onclick: function(){
                }
            },
            {
                caption: "Save to file...",
                cls: "info",
                onclick: function(){
                    const a = [
                        `Address: ${account.address}`,
                        `PublicKey: ${account.publicKey}`,
                        `AuthKey: ${account.authKey}`,
                        `PrivateKey: ${account.privateKey}`,
                        `Mnemonic: ${account.mnemonic}`
                    ]
                    saveToFile("address.txt", a.join("\n").trim())
                }
            }
        ]
    });
}
