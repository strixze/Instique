import { useChatStore } from "../../store/useChatStore";
import { socketEvents } from "../../constants/socketEvents";

export const onlineStatusHandler = (socket) => {
    socket.on(socketEvents.USER_ONLINE, (userId) => {       // Listener for receiving online status updates of users from the socket server
        console.log("User Online Event Received from socket server:", userId);
        const { setOnlineStatus } = useChatStore.getState();
        setOnlineStatus(userId, true)
    })

    socket.on(socketEvents.USER_OFFLINE, (userId) => {    // Listener for receiving offline status updates of users from the socket server 
        // console.log("User Offline Event Received from socket server:",userId);
        const { setOnlineStatus } = useChatStore.getState();
        setOnlineStatus(userId, false)
    })

    socket.on(socketEvents.ONLINE_USERS, (onlineUsers) => {
        // Listener for receiving the list of online users from the socket server when a user comes online
        const { setOnlineStatus } = useChatStore.getState();
        console.log("Online Users List Received from socket server:", onlineUsers);
        for (let user of onlineUsers) {
            setOnlineStatus(user, true)
        }
    })
}