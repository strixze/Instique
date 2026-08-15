export const parseCookies = (headers) => {
    let cookies = {};

    if(headers?.cookie){
        const rawCookies = headers.cookie.split(";")
        for(const cookie of rawCookies){
            const [key, ...val] = cookie.split("=")
            cookies[key.trim()] = val.join("=")
        }
    }
    return cookies;
}