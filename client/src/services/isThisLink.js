export const isThisLink = (msg="")=>{
    let message = msg.toLowerCase()
    if(message.includes("https:") || message.includes("http:") || message.includes(".com") || message.includes(".in") || message.includes(".dev") ){
        return true
    }
    return false
}