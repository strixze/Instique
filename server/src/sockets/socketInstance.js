let io;

export const setIO = (IOInstance)=>{
    io = IOInstance
}

export const getIO = ()=>{
    if(!io){
        throw new Error("Socket.io instance not initialized")
    }
    return io
}