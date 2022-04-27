export const login = async (form) => {
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
        window.location.href = result.target
    } catch (e) {
        toastAlert(e.message)
        $(".login-form").addClass("ani-horizontal")
        setTimeout(()=>{
            $(".login-form").removeClass("ani-horizontal")
        }, 1000)
    } finally {
        button.disabled = false
    }
}

