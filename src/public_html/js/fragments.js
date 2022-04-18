const dialogTitle = (title, subtitle) => {
    return `
        <div class="d-flex flex-row flex-nowrap flex-align-center">
            <div class="aptos-logo"><img src="images/aptos_word.svg"></div>
            <div class="ml-2 mt-1 reduce-2">|</div>
            <div class="ml-1 mt-1 reduce-1">
                <span class="ml-1">${title}</span>
                <span class="">${subtitle}</span>
            </div>
        </div>    
    `
}

const walletInfo = (data) => {
    return `
        <ul class="unstyled-list w-100">
            <li>
                <div class="text-bold">Mnemonic:</div>
                <div class="text-small border bd-system p-1 bg-white">
                    ${data.mnemonic}        
                </div>
            </li>
            <li class="mt-1">
                <div class="text-bold">Address:</div>
                <div class="text-small border bd-system p-1 bg-white">
                    ${data.address}        
                </div>
            </li>
            <li class="mt-1">
                <div class="text-bold">Public Key:</div>
                <div class="text-small border bd-system p-1 bg-white">
                    ${data.publicKey}        
                </div>
            </li>
            <li class="mt-1">
                <div class="text-bold">Auth Key:</div>
                <div class="text-small border bd-system p-1 bg-white">
                    ${data.authKey}        
                </div>
            </li>
            <li class="mt-1">
                <div class="text-bold">Private Key:</div>
                <div class="text-small border bd-system p-1 bg-white">
                    ${data.privateKey}        
                </div>
            </li>
        </ul>
    `
}