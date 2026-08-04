import { socketEvents } from "../../constants/socketEvents"
import { useGroupChatStore } from "../../store/useGroupChatStore";

export const groupHandler = (socket)=>{

    
    socket.on(socketEvents.ADD_MEMBER_IN_GROUP, (newMember)=>{
        const {addCurrentGroupParticipant,toogleAdminStatusOfGroupParticipants} = useGroupChatStore.getState();
        console.log("Add member Event ::::: ",newMember)
        addCurrentGroupParticipant(newMember)

    })

    socket.on(socketEvents.MARK_MEMBER_AS_ADMIN, ({memberId})=>{
        const {addCurrentGroupParticipant,toogleAdminStatusOfGroupParticipants} = useGroupChatStore.getState();
        console.log("Mark member as Admin ::::: ",memberId)
        toogleAdminStatusOfGroupParticipants(memberId,true)

    })

    socket.on(socketEvents.UNMARK_MEMBER_AS_ADMIN, ({memberId})=>{
        const {addCurrentGroupParticipant,toogleAdminStatusOfGroupParticipants} = useGroupChatStore.getState();
        console.log("UNMark member as Admin ::::: ",memberId)
        toogleAdminStatusOfGroupParticipants(memberId,false)

    })
}