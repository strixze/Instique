import React from 'react'
import { Search, Plus } from 'lucide-react'
import ChatCard from './ChatCard.jsx'
import { useChatStore } from '../../store/useChatStore.js'
import { userAuthStore } from '../../store/userStore.js'
import CreateGroup from './CreateGroup.jsx'


function ChatList({
    togglePanel = () => { },
    query = "",
    setQuery = () => { },
    users = [],
    setShowSidebar = () => { },
    groupsOnly = false,
    searchUsers = () => { },
    createGroup = false,
    activePanel = "chats",


}) {

    const {
        userSearch,
        setUserSearch,
        setChatUsersInfo,
        chatUsersInfo,
        emitedTyping,
        toogleEmitedTyping,
        onlineStatus,
        incrementNewMessagesCount,
        incrementNewMessagesCountByN,
        resetNewMessagesCount,
        mediaFiles,
        removeMessage,
        resetMediaFiles,
        setCurrentPreviewFile,
        currentPreviewFile
    } = useChatStore()
    const { user } = userAuthStore();
    const totalUnread = Object.values(chatUsersInfo).reduce((total, chat) => total + (chat?.newMessages || 0), 0);


    return (

        <>
            {/* Brand */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight">Messages</span>
                    {/* {totalUnread > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                            {totalUnread}
                                        </span>
                                    )} */}
                </div>
                <button
                    onClick={() => togglePanel('createGroup')}
                    className="flex items-center justify-center w-7 h-7 rounded-[9px] transition-all duration-150 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}
                    title="Create Group"
                >
                    <Plus size={14} color="#818cf8" />
                </button>
            </div>

            {/* Search */}
            {
                activePanel === "chats" &&
                <div className="relative px-4 pb-4">
                    <Search className="absolute left-8 top-[50%] -translate-y-1/2 pointer-events-none text-[#4a4e6a]" size={15} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={query}
                        onChange={(e) => searchUsers(e.target.value)}
                        className="search-input w-full py-[11px] pl-9 pr-4 bg-[#1a1d28] border border-white/[0.06] rounded-[14px] text-[#f1f2f7] text-[13.5px] outline-none placeholder-[#4a4e6a] transition-all duration-200"
                    />
                </div>
            }

            {
                activePanel === "newGroup" &&
                <div className="relative px-4 pb-4">
                    <Search className="absolute left-8 top-[50%] -translate-y-1/2 pointer-events-none text-[#4a4e6a]" size={15} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={query}
                        onChange={(e) => searchUsers(e.target.value)}
                        className="search-input w-full py-[11px] pl-9 pr-4 bg-[#1a1d28] border border-white/[0.06] rounded-[14px] text-[#f1f2f7] text-[13.5px] outline-none placeholder-[#4a4e6a] transition-all duration-200"
                    />
                </div>
            }


            {/* Section label */}
            <p className="px-5 pb-2.5 text-[10.5px] font-semibold tracking-[1.2px] uppercase text-[#4a4e6a]">
                {!query || query.trim() === "" ? "Conversations" : "Results"}
            </p>

            {/* Users */}
            <div className="flex-1 overflow-y-auto px-2 custom-scroll">
                {((!query || query.trim() === "") && groupsOnly) && !createGroup && users?.map((chat) => (
                    chat?.isGroupChat ?
                        <ChatCard
                            key={chat._id}
                            user={chat.participants[0]._id === user._id ? chat.participants[1] : chat.participants[0]}
                            searchMode={false}
                            chatId={chat._id}
                            typing={chatUsersInfo[chat._id]?.typing || false}
                            online={
                                !chat.isGroupChat && chat.participants[0]?._id === user?._id ? onlineStatus[chat.participants[1]?._id] : onlineStatus[chat.participants[0]?._id] || false
                            }
                            chat={chat}
                            newMessages={chatUsersInfo[chat?._id].newMessages || 0}
                            time={chatUsersInfo[chat._id].time}
                            setShowSidebar={setShowSidebar}
                        /> : <></>
                ))}
                {((!query || query.trim() === "") && !groupsOnly) && !createGroup && users?.map((chat) => (
                    !chat.isGroupChat ?
                        <ChatCard
                            key={chat._id}
                            user={chat.participants[0]._id === user._id ? chat.participants[1] : chat.participants[0]}
                            searchMode={false}
                            chatId={chat._id}
                            typing={chatUsersInfo[chat._id]?.typing || false}
                            online={onlineStatus[chat.participants[0]?._id === user?._id ? chat.participants[1]?._id : chat.participants[0]?._id] || false}
                            chat={chat}
                            newMessages={chatUsersInfo[chat?._id].newMessages || 0}
                            time={chatUsersInfo[chat._id].time}
                            setShowSidebar={setShowSidebar}
                        /> : <></>
                ))}

                {((!query || query.trim() === "") && !groupsOnly) && !createGroup && users.length === 0 && (
                    <p className="text-center text-[#4a4e6a] py-4">No conversations available</p>
                )}

                {query && !createGroup && userSearch?.map((chat) => (
                    <ChatCard key={chat._id} user={chat} searchMode={true} query={query} setQuery={setQuery} />
                ))}

                {
                    createGroup && (
                        <CreateGroup   users={users} setActivePanel={togglePanel} />
                    )
                }
            </div>
        </>
    )
}

export default ChatList