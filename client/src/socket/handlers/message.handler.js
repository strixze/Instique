import { useChatStore } from "../../store/useChatStore";
import { socketEvents } from "../../constants/socketEvents";
import { useContext } from "react";
import { authContext } from "../../context/AuthProvider";
import { userAuthStore } from "../../store/userStore";

export const messageHandler = (socket) => {
    socket.on(socketEvents.NEW_MESSAGE, (data) => {       // Listener for receiving a new message from the socket server
        // console.log("New Message Received from socket server:",data);

        const { addMessage, incrementNewMessagesCount ,updateLastMessage,shiftChatAtFirstPosition} = useChatStore.getState();
        // const { setScrollToBottomInChat, scrollToBottomInChat } = useAssetsStore().getState();

        if (data.sender !== userAuthStore.getState().user._id) {
            addMessage(data?.chatId, data)

            // console.log("Scroll to bottom in chat :: ", scrollToBottomInChat);


            incrementNewMessagesCount(data?.chatId, data.message.createdAt)


            // setScrollToBottomInChat(true)

        }
        updateLastMessage(data?.chatId,data)
        shiftChatAtFirstPosition(data?.chatId)
        

    })

    socket.on(socketEvents.NEW_MESSAGE_REPLY, (data) => {       // Listener for receiving a new message Reply from the socket server
        console.log("New Message Received from socket server:",data);

        const { addMessage, incrementNewMessagesCount,updateLastMessage } = useChatStore.getState();
        // const { setScrollToBottomInChat, scrollToBottomInChat } = useAssetsStore().getState();

        if (data.sender !== userAuthStore.getState().user._id) {
            addMessage(data?.chatId, data)

            // console.log("Scroll to bottom in chat :: ", scrollToBottomInChat);


            incrementNewMessagesCount(data?.chatId, data.message.createdAt)


            // setScrollToBottomInChat(true)

        }

        updateLastMessage(data?.chatId, data?.lastMessage)
    })

    socket.on(socketEvents.MESSAGE_SENT_SINGLE_CHAT, (payload) => {      // Listener for Confirming Chat Sent or not

        console.log("Message Sent Status Received from socket server:", payload);
        const { addMessage, replaceMessage,setUserMessages,updateLastMessage } = useChatStore.getState()

        replaceMessage(payload.chatId, payload.tempId, payload.message)
        updateLastMessage(payload?.chatId,payload?.message)
    })

    socket.on(socketEvents.TYPING, (data) => {     // Listener for receiving typing status updates from the socket server
        // console.log("Typing event received from socket server:",data);
        const { setTypingStatus } = useChatStore.getState();
        setTypingStatus(data.chatId, data.isTyping)
    })

    socket.on(socketEvents.TYPING_GROUP, (data) => {     // Listener for receiving typing status updates from the socket server
        // console.log("Typing event received from socket server:",data);
        const { setTypingStatus,addTyper,removeTyper } = useChatStore.getState();
        setTypingStatus(data.chatId, data.isTyping)
        if(data.isTyping){
            addTyper(data.chatId,data.user)
        }
         else {
            removeTyper(data.chatId,data.user._id)
         }
    })


    socket.on(socketEvents.MESSAGE_SEEN_SINGLE_CHAT, (payload) => {       // Listener for Updating Seen Status of Message
        console.log("message seen status : ", payload.status)
        const { addMessage, userMessages, updateSeenStatus } = useChatStore.getState()

        updateSeenStatus(payload.chatId, payload.messageId, payload.status)
    })

    socket.on(socketEvents.REACT_MESSAGE_SINGLE_CHAT, (reaction)=>{     // Listener for Updating Reactions on message

        const { addMessage, replaceMessage,setUserMessages,setReaction } = useChatStore.getState()
        console.log("Reaction Received from socket server:", reaction)
        replaceMessage(reaction.chatId,reaction._id,reaction)
    })
}
