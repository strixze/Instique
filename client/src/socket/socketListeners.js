import { socket } from "./socket";
import { useChatStore } from "../store/useChatStore";
import { socketEvents } from "../constants/socketEvents";
import { userAuthStore } from "../store/userStore";
import { useAssetsStore } from "../store/useAssetsStore";
import { messageHandler } from "./handlers/message.handler";
import { onlineStatusHandler } from "./handlers/onlineStatus.handler";
import { errorHandler } from "./handlers/error.handler";
import { chatHandler } from "./handlers/chat.handler";
import { groupHandler } from "./handlers/group.handler";
import { notificationHandler } from "./handlers/notification.handler";




export const initializeSocketListeners = () => {

    socket.on(socketEvents.CONNECT, () => {    // Listener for successful connection to the socket server
        console.log("Connected to socket server");
        const user = userAuthStore.getState().user;
        if (user) {
            socket.emit(socketEvents.USER_LOGGED_IN);
        }
    });

    socket.on(socketEvents.DISCONNECT, () => {     // Listener for disconnection from the socket server
        console.log("Disconnected from socket server");
    });


    messageHandler(socket)      //  Handler for Message Events

    onlineStatusHandler(socket)   // Handler for Online Status Events

    groupHandler(socket)    // Handler for Group Events

    chatHandler(socket)  // Handler for Chat Events

    errorHandler(socket)    // Handler for socket Errors

    notificationHandler(socket)  // Handler for Notification Events

}
