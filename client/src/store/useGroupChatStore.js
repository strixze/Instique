import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useGroupChatStore = create(
    devtools(
        (set)=>({
             groupChat:null,

            setGroupChat:(chat)=>{
                set({
                    groupChat:chat
                })
            },

            newGroupNotication:false,

            setNewGroupNotification:(value)=>{
                set({
                    newGroupNotication:value
                })
            },

            newGroupInfo:null,

            setNewGroupInfo:(info)=>{
                (set)=>({
                    newGroupInfo:info
                })
            },

            participants:[],

            addParticipant:(newParticipant)=>{
                set((state)=>({
                    participants:[...state.participants, newParticipant]
                }))
            },

            resetParticipant:()=>{
                (set)=>({
                    participants:[]
                })
            },

            currentGroupParticipants:[],

            setCurrentGroupParticipants:(participants=[])=>{
                set({
                    currentGroupParticipants:participants
                })
            },
            addCurrentGroupParticipant:(participant)=>{
                set((state)=>({
                    currentGroupParticipants:[...state.currentGroupParticipants,participant]
                }))
            },

            toogleAdminStatusOfGroupParticipants:(userId,value)=>{
                set((state)=>({
                    currentGroupParticipants:state.currentGroupParticipants.map((user)=>{
                        if(user._id === userId){
                            return {...user,isAdmin:value}
                        }
                        return user
                    })
                }))
            }
        
        })
    )
)