import { socketEvents } from "../../constants/socketEvents"

export const errorHandler = (socket) =>{
    socket.on(socketEvents.ERROR , (error) => {
        console.log("Error Event Received from socket server:", error)
        // You can also implement any additional logic here to display the error message to the user or perform other actions based on the error type.
    })
}