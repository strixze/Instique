export let socketsMap = new Map();

export const addUserSocket = (userId,socketId)=>{
    socketsMap.set(userId,socketId)
}

export const removeUserSocket = (userId)=>{
    socketsMap.delete(userId)
}

export const getUserSocket = (userId)=>{
    return socketsMap.get(userId)
}