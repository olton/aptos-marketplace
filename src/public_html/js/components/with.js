export const withCtx = (ctx, inj) => {
    for(let x in inj) {
        ctx[x] = inj[x]
    }
}