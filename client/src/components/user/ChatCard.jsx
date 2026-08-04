import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { authContext } from '../../context/AuthProvider.jsx'
import { messageApi } from '../../api/message.api.js';
import { useChatStore } from '../../store/useChatStore.js';
import { useGroupChatStore } from '../../store/useGroupChatStore.js';
import { chatApi } from '../../api/chat.api.js';
import { userAuthStore } from '../../store/userStore.js';
import { useAssetsStore } from '../../store/useAssetsStore.js';
import { useNavigate } from 'react-router-dom';
import { requestApi } from '../../api/request.api.js';
import { UserPlus, Check } from 'lucide-react';
import { useRequest } from '../../hooks/useRequest.jsx';
import { getTime } from '../../services/getTime.js';
import { groupApi } from '../../api/group.api.js';


const { addMessage, currentChatId, setCurrentChatId, setUserMessages, chatUsersInfo, onlineStatus, resetNewMessagesCount, setIsGroupChat } = useChatStore.getState();
const { setGroupChat } = useGroupChatStore.getState();

function ChatCard({
    user = {
        name: "John Doe",
        avtar: "https://static.vecteezy.com/system/resources/previews/024/983/914/non_2x/simple-user-default-icon-free-png.png",
        groupName: ""
    },
    searchMode = false,
    chatId = null,
    typing = false,
    online = false,
    chat = null,
    newMessages = 0,
    time = null,
    setShowSidebar,
    query,
    setQuery,
    isGroupChat = false
}) {

    const context = useContext(authContext);
    const navigate = useNavigate()
    const { userChats, setCurrentPreviewFile, addChat, resetUserSearch } = useChatStore();
    const { user: currentUser } = userAuthStore();
    const { scrollToBottomInChat, setScrollToBottomInChat } = useAssetsStore()

    const {
        sendFriendRequest,
        sendingRequest,
        setSendingRequest,
        requestSent,
        setRequestSent
    } = useRequest()


    const handleSendFriendRequest = async (e) => {
        e.stopPropagation();
        if (sendingRequest || requestSent) return;

        await sendFriendRequest(user._id)
    };

    const createSingleChat = async () => {
        const response = await chatApi.createSingleChat(user._id);
        if (response.success) {
            addChat(response.data)
            setCurrentChatId(response.data._id)
            setCurrentPreviewFile(null)
            navigate(`/chat/${response.data._id}`)
            getConversationMessages();
            resetNewMessagesCount(response.data._id);
            setScrollToBottomInChat(true);
            setQuery("")
            resetUserSearch();
        }
    }

    const getConversationMessages = async (groupId = null) => {
        console.log("Getting Conversation Messages with User :: ", user.username);
        context.setCurrentChatUser(user);
        let response;
        if (groupId) {
            console.log("Getting Group Conversation Messages for Group ID :: ", groupId)
            response = await groupApi.getConversation(groupId)
        }
        else {
            response = await messageApi.getConversation(user._id)
        }
        console.log(" Messages :: ", response?.data?.data)
        setUserMessages(chatId, response?.data?.data)
    }

    const isThisGroupChat = () => {
        console.log("isGroupChat : ", chat?.isGroupChat)
        return chat?.isGroupChat || false;
    }

    const isSingleChat = () => {
        console.log("isSingleChat : ", !chat?.isGroupChat)
        return !chat?.isGroupChat || false;
    }

    const isChatExists = async () => {

        const response = await chatApi.isChatExists(chat?._id)
        return response.success;
    }

    const handleChatCardClick = () => {
        if (isChatExists()) {
            if (isThisGroupChat()) {
                setCurrentChatId(chatId);
                setIsGroupChat(chat.isGroupChat);
                setGroupChat(chat);
                console.log("CLICKED GROUP CHAT :: ", chat)
                setCurrentPreviewFile(null)
                navigate(`/chat/${chat?._id}`)
                getConversationMessages(chat?._id);
                resetNewMessagesCount(chatId);
                setScrollToBottomInChat(true);
            }
            else if (isSingleChat()) {
                setCurrentChatId(chatId);
                setIsGroupChat(chat?.isGroupChat);
                if (chat?.isGroupChat) {
                    setGroupChat(chat);
                }
                setCurrentPreviewFile(null)
                navigate(`/chat/${chat?._id}`)
                getConversationMessages();
                resetNewMessagesCount(chatId);
                setScrollToBottomInChat(true);
            }
        }
        else {
            createSingleChat();
        }
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');

                .typing-dot-card { animation: blink-card 1.2s infinite; }
                .typing-dot-card:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot-card:nth-child(3) { animation-delay: 0.4s; }
                @keyframes blink-card {
                    0%, 80%, 100% { opacity: 0.2; }
                    40% { opacity: 1; }
                }
                .chat-card-time { font-family: 'JetBrains Mono', monospace; }
            `}</style>

            <div
                onClick={handleChatCardClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mb-0.5 transition-all duration-[180ms] hover:bg-white/[0.05] active:bg-[rgba(99,102,241,0.1)]"
                style={{ fontFamily: "'Sora', sans-serif" }}
            >
                {/* Avatar */}
                <div className="relative flex-shrink-0 w-11 h-11">
                    <img
                        src={!chat?.isGroupChat && user.avtar ? user.avtar : chat?.isGroupChat ? chat?.groupPicture : ""}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover border-2 border-white/[0.07] block"
                    />
                    {online && !chat?.isGroupChat && (
                        <div
                            className="absolute bottom-[1px] right-[1px] w-2.5 h-2.5 rounded-full bg-[#22d3a0] border-2 border-[#0e1018]"
                            style={{ boxShadow: '0 0 6px #22d3a0' }}
                        />
                    )}

                </div>

                {/* Name + status */}
                <div className="flex flex-col flex-1 min-w-0 gap-[2px]">
                    <span className="text-[13.5px] font-semibold text-[#f1f2f7] tracking-[-0.2px] truncate">
                        {!chat?.isGroupChat && user?.username || chat?.groupName}
                    </span>
                    {typing ? (
                        <span className="flex items-center gap-1 text-[11.5px] text-[#22d3a0] truncate">
                            <span className="flex gap-[2px] items-center">
                                <span className="typing-dot-card w-[3px] h-[3px] rounded-full bg-[#22d3a0] inline-block" />
                                <span className="typing-dot-card w-[3px] h-[3px] rounded-full bg-[#22d3a0] inline-block" />
                                <span className="typing-dot-card w-[3px] h-[3px] rounded-full bg-[#22d3a0] inline-block" />
                            </span>
                            typing
                        </span>
                    ) : (
                        <span className="text-[11.5px] text-gray-400 truncate">
                            {
                                newMessages > 0 ? <p className='text-purple-400'>{newMessages} new messages</p>
                                    : !chat?.isGroupChat && online ? "Online"

                                        : ""
                            }
                        </span>
                        // <span className="text-[11.5px] text-gray-400 truncate">
                        //     {!chat?.isGroupChat && online ? 'Online' : !chat?.isGroupChat && !online ? `last active ${getTime(user?.lastActive)}` : ""}
                        // </span>
                    )}
                </div>

                {/* Time + unread badge + friend request */}
                <div className="flex flex-col items-end gap-[5px] flex-shrink-0">
                    {/* {newMessages > 0 && (
                        <>
                            {time && (
                                <span className="chat-card-time text-[10.5px] text-[#4a4e6a] tracking-[-0.3px]">
                                    {time}
                                </span>
                            )}
                            <div
                                className="flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-[20px] text-[10px] font-bold text-white"
                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.45)' }}
                            >
                                {newMessages}
                            </div>
                        </>
                    )} */}

                    {/* Send Friend Request Button - only in search mode for non-friends */}
                    {searchMode && user?.isFriend === false && (
                        <button
                            onClick={handleSendFriendRequest}
                            disabled={sendingRequest || requestSent}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${requestSent
                                ? 'bg-[#22d3a0]/10 text-[#22d3a0] cursor-default'
                                : sendingRequest
                                    ? 'bg-white/[0.05] text-[#4a4e6a] cursor-wait'
                                    : 'bg-[rgba(99,102,241,0.15)] text-[#818cf8] hover:bg-[rgba(99,102,241,0.25)] active:scale-95'
                                }`}
                            style={{ border: requestSent ? '1px solid rgba(34,211,160,0.3)' : '1px solid rgba(99,102,241,0.3)' }}
                            title={requestSent ? 'Friend request sent' : 'Send friend request'}
                        >
                            {requestSent || user?.requests[0]?.status === "pending" ? (
                                <>
                                    <Check size={12} />
                                    <span>Sent</span>
                                </>
                            ) : sendingRequest ? (
                                <span className="flex items-center gap-1">
                                    <span className="typing-dot-card w-[3px] h-[3px] rounded-full bg-[#4a4e6a] inline-block" />
                                    <span className="typing-dot-card w-[3px] h-[3px] rounded-full bg-[#4a4e6a] inline-block" />
                                    <span className="typing-dot-card w-[3px] h-[3px] rounded-full bg-[#4a4e6a] inline-block" />
                                </span>
                            ) : (
                                <>
                                    <UserPlus size={12} />
                                    <span>Add</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}

export default ChatCard