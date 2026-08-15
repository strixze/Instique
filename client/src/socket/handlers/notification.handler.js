import { useChatStore } from "../../store/useChatStore";
import { socketEvents } from "../../constants/socketEvents";
import { useGroupChatStore } from "../../store/useGroupChatStore";

export const notificationHandler = (socket) => {

    socket.on(socketEvents.NEW_NOTIFICATION, (notification) => {

        console.log("New Notification :: ", notification)

        const { incrementNotificationCount, updateNotificationsCount } = useChatStore.getState()

        incrementNotificationCount(1);
    })

}