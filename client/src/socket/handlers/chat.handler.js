import { useChatStore } from "../../store/useChatStore";
import { socketEvents } from "../../constants/socketEvents";
import { useGroupChatStore } from "../../store/useGroupChatStore";

export const chatHandler = (socket)=>{

    socket.on(socketEvents.NEW_SINGLE_CHAT , (chat)=>{
        console.log("New Chat (Socket) :: ",chat)
    })

    socket.on(socketEvents.GROUP_CREATED , (group)=>{
        const {setNewGroupInfo,GroupInfo,newGroupNotication,setNewGroupNotification} = useGroupChatStore()

        setNewGroupNotification(true)
        setNewGroupInfo(group)
    })

}