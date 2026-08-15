import React, { useRef, useState, useCallback } from 'react'
import ChatCard from '../../components/user/ChatCard.jsx'
import { useEffect } from 'react'
import { userApi } from '../../api/user.api.js'
import { useContext } from 'react'
import { authContext } from '../../context/AuthProvider.jsx'
import { socket } from '../../socket/socket.js'
import {
    MessageCircle,
    Send,
    MoveDown,
    ArrowDownCircleIcon,
    Search,
    Zap,
    Bell,
    User,
    Users,
    Settings,
    Plus,
    LogOut,
    X,
    ChevronRight,
    Loader2
} from 'lucide-react'
import Swal from 'sweetalert2';
import Message from '../../components/message/Message.jsx'
import { messageApi } from '../../api/message.api.js'
import { useChatStore } from '../../store/useChatStore.js'
import { chatApi } from '../../api/chat.api.js'
import { userAuthStore } from '../../store/userStore.js'
import { socketEvents } from '../../constants/socketEvents.js'
import { useAssetsStore } from '../../store/useAssetsStore.js'
import FileUpload from '../../components/message/FileUpload.jsx'
import MediaPreview from '../../components/message/MediaPreview.jsx'
import SingleFilePreview from '../../components/message/SingleFilePreview.jsx'
import Profile from '../../components/user/Profile.jsx'
import CreateGroup from '../../components/user/CreateGroup.jsx'
import SettingsPanel from '../../components/user/Settings.jsx'
import ChatList from '../../components/user/ChatList.jsx'
import GroupInfo from '../../components/user/GroupInfo.jsx'
import Sidebar from './Sidebar.jsx'
import { useRequest } from '../../hooks/useRequest.jsx'
import { useNotification } from '../../hooks/useNotification.jsx'


function Home() {

    const context = useContext(authContext);
    const [message, setMessage] = React.useState("")
    const [query, setQuery] = React.useState("")

    // Panel state: null | 'notifications' | 'profile' | 'newGroup' | 'settings'
    const [activePanel, setActivePanel] = useState("chats")

    const { user } = userAuthStore()
    const { fetchRequests } = useRequest()
    const { fetchNotifications } = useNotification()

    const users = useChatStore(state => state.userChats)
    const setUsers = useChatStore(state => state.setUserChats)

    const messages = useChatStore(state => state.userMessages)
    const addMessage = useChatStore(state => state.addMessage)
    const currentChatId = useChatStore(state => state.currentChatId)
    const userMessages = useChatStore().userMessages

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
        currentPreviewFile,
        isGroupChat,
        paginationMeta,
        setPaginationMeta,
        setLoadingMore,
        prependMessages
    } = useChatStore()

    const {
        scrollToBottomInChat,
        setScrollToBottomInChat
    } = useAssetsStore()

    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const messageEndRef = useRef(null);
    const chatContainerRef = useRef(null)
    const topSentinelRef = useRef(null)
    const [isAtBottom, setIsAtBottom] = React.useState(true);
    const isMedia = mediaFiles[currentChatId]?.length > 0
    const [showSidebar, setShowSidebar] = useState(true)
    const [groupsOnly, setGroupsOnly] = useState(false)

    // Total unread count for notification badge
    const totalUnread = Object.values(chatUsersInfo).reduce((sum, c) => sum + (c?.newMessages || 0), 0)

    const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel)

    const loadUnreadMessages = (chats) => {
        chats.forEach((chat) => {
            incrementNewMessagesCountByN(chat._id, chat.unreadMessagesCount)
        })
    }

    const getMyNotifications = async () => {
        await fetchNotifications()
    }

    const getAllUsers = async () => {
        const response = await chatApi.getUserChats();
        if (response.success) {
            setUsers(response.data);
            loadUnreadMessages(response.data)
            setChatUsersInfo(response.data)
            console.log("All users fetched:", response.data);
        }
    }

    const getOnlineUsers = async () => {
        const response = await userApi.getOnlineUsers();
        if (response.success) {
            const { setOnlineStatus } = useChatStore.getState();
            console.log("Online Users List Received from socket server (API):", response.data);
            for (let user of response.data) {
                setOnlineStatus(user, true)
            }
        }
    }

    const getConversationMessages = async (otherUserId) => {
        const messages = await messageApi.getConversation(otherUserId)
    }

    const handleSend = async (e) => {
        e.preventDefault()
        console.log("Send button clicked");

        if (message.trim() === "" && !mediaFiles[currentChatId].length) {
            console.log("Returning Function HandleSend")
            return;
        }

        const tempId = `temp-${Date.now()}`

        addMessage(currentChatId, {
            _id: tempId,
            chatId: currentChatId,
            message: message.trim() !== "" ? message : "",
            sender: user._id,
            attachments: mediaFiles[currentChatId] || [],
            status: "uploading",
            createdAt: "2026-02-21T08:49:25.317Z"
        })

        setScrollToBottomInChat(true);

        const formData = new FormData()
        let uploadInfo;

        if (mediaFiles[currentChatId]?.length > 0) {
            mediaFiles[currentChatId].length > 0 && mediaFiles[currentChatId].forEach(image => {
                formData.append("images", image.file)
            })

            resetMediaFiles(currentChatId)

            uploadInfo = await messageApi.uploadImages(formData)

            console.log("Upload Info :: ", uploadInfo)

            if (!uploadInfo.success) {
                removeMessage(currentChatId, tempId)
                alert("Message Failed Please Try Again.")
            }
        }

        if (!socket) return

        socket.emit(socketEvents.NEW_MESSAGE, {
            message: message || "",
            attachments: uploadInfo?.data || [],
            receiver: context.currentChatUser._id,
            chatId: currentChatId || null,
            tempId: tempId
        }, (ack) => {
            console.log("Ack from server:", ack);
        })

        setMessage("")
    }

    const scrollToBottom = () => {
        const container = chatContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    };

    // ── Infinite scroll: load older messages ──────────────────────────
    const loadOlderMessages = useCallback(async () => {
        if (!currentChatId) return
        const meta = paginationMeta[currentChatId]
        if (!meta?.hasMore || meta?.isLoadingMore) return

        setLoadingMore(currentChatId, true)

        const container = chatContainerRef.current
        const prevScrollHeight = container?.scrollHeight || 0

        try {
            const chatState = useChatStore.getState()
            const chat = chatState.userChats.find(c => c._id === currentChatId)
            let response

            if (isGroupChat) {
                const { groupApi } = await import('../../api/group.api.js')
                response = await groupApi.getConversation(currentChatId, meta.nextCursor)
            } else {
                const otherParticipant = chat?.participants?.find(p => p._id !== user._id) || context.currentChatUser
                if (otherParticipant?._id) {
                    response = await messageApi.getConversation(otherParticipant._id, meta.nextCursor)
                }
            }

            if (response?.data?.data) {
                const { messages: olderMsgs, hasMore, nextCursor } = response.data.data
                if (olderMsgs?.length > 0) {
                    prependMessages(currentChatId, olderMsgs)
                    requestAnimationFrame(() => {
                        if (container) {
                            const newScrollHeight = container.scrollHeight
                            container.scrollTop = newScrollHeight - prevScrollHeight
                        }
                    })
                }
                setPaginationMeta(currentChatId, { hasMore: !!hasMore, nextCursor: nextCursor || null, isLoadingMore: false })
            } else {
                setLoadingMore(currentChatId, false)
            }
        } catch (error) {
            console.error("Error loading older messages:", error)
            setLoadingMore(currentChatId, false)
        }
    }, [currentChatId, paginationMeta, isGroupChat])

    useEffect(() => {
        if (user) {
            console.log("Emitting GET_ONLINE_STATUS for user:", user._id);
            socket.emit(socketEvents.GET_ONLINE_STATUS);
        }
        getAllUsers();
        getMyNotifications();
        getOnlineUsers();
        // Request online status after fetching users

        console.log("Media Files: ", mediaFiles[currentChatId]);

        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const atBottom =
                container.scrollTop + container.clientHeight >=
                container.scrollHeight - 5;
            setIsAtBottom(atBottom);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [])

    // ── Infinite scroll observer ─────────────────────────────────────
    useEffect(() => {
        const sentinel = topSentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadOlderMessages()
                }
            },
            { root: chatContainerRef.current, threshold: 0.1 }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadOlderMessages, currentChatId])

    useEffect(() => {
        if (isAtBottom) {
            requestAnimationFrame(() => {
                scrollToBottom();
            });
        }
    }, [isAtBottom])

    useEffect(() => {
        if (activePanel !== "newGroup") {
            setGroupsOnly(true)
        } else {
            setGroupsOnly(false)
        }

    }, [activePanel])

    useEffect(() => {
        console.log("Scroll to bottom in chat:", scrollToBottomInChat);
        if (scrollToBottomInChat) {
            scrollToBottom();
            setScrollToBottomInChat(false);
        }
    }, [scrollToBottomInChat])

    const searchUsers = async (query) => {
        setQuery(query);
        try {
            const response = await userApi.searchUsers(query);
            if (response.success) {
                setUserSearch(response.data);
                console.log("Search Users Response :", response.data);
            }
        } catch (error) {
            console.log("Error while searching users :", error);
        }
    }

    const handleTyping = (e) => {
        const value = e.target.value;
        setMessage(value);

        if (!socket || !context.currentChatUser || !currentChatId) return;

        if (!isTypingRef.current) {
            socket.emit(socketEvents.TYPING, {
                chatId: currentChatId,
                isTyping: true,
            });
            isTypingRef.current = true;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit(socketEvents.TYPING, {
                chatId: currentChatId,
                isTyping: false,
            });
            isTypingRef.current = false;
        }, 2000);
    };

    // ── Nav icon button helper ──────────────────────────────────────
    const NavIconBtn = ({ icon: Icon, panel, badge, tooltip }) => {
        const active = activePanel === panel
        return (
            <button
                onClick={() => togglePanel(panel)}
                title={tooltip}
                className="relative flex items-center justify-center w-10 h-10 rounded-[13px] transition-all duration-200 group"
                style={{
                    background: active
                        ? 'linear-gradient(135deg,rgba(99,102,241,0.28),rgba(139,92,246,0.18))'
                        : 'transparent',
                    border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                    boxShadow: active ? '0 0 16px rgba(99,102,241,0.18)' : 'none'
                }}
            >
                <Icon size={18} color={active ? '#818cf8' : '#4a4e6a'} strokeWidth={2} />
                {badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
                {/* Tooltip */}
                <span className="absolute left-full ml-2.5 px-2 py-1 text-[11px] font-medium text-[#c4c6e7] bg-[#1a1d28] border border-white/[0.08] rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                    {tooltip}
                </span>
            </button>
        )
    }

    return (
        <>
            <style>{`
                * { font-family: 'Sora', sans-serif; box-sizing: border-box; }

                .typing-dot { animation: typing-blink 1.2s infinite; }
                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }

                .online-pulse { animation: pulse-dot 2s infinite; }

                .fade-in-up { animation: fadeInUp 0.3s ease; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }

                .custom-scroll { scrollbar-width: thin; scrollbar-color: #1a1d28 transparent; }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #1a1d28; border-radius: 4px; }

                .msg-input-wrap:focus-within {
                    border-color: rgba(99,102,241,0.35) !important;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
                }

                .action-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background 0.15s;
                    font-size: 13px;
                    color: #c4c6e7;
                }
                .action-row:hover { background: rgba(99,102,241,0.1); }
                .notif-item {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    padding: 10px 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background 0.15s;
                    border: 1px solid transparent;
                }
                .notif-item:hover { background: rgba(99,102,241,0.07); }
                .notif-item.unread { border-color: rgba(99,102,241,0.14); background: rgba(99,102,241,0.06); }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .loading-spinner {
                    animation: spin 0.8s linear infinite;
                }
            `}</style>

            {/* Root */}
            <div className="flex h-[100dvh] bg-surface-900 text-text-primary overflow-hidden">

                {/* ── SIDEBAR ── */}
                <Sidebar
                    activePanel={activePanel}
                    setActivePanel={setActivePanel}
                    query={query}
                    setQuery={setQuery}
                    users={users}
                    setShowSidebar={setShowSidebar}
                    chatUsersInfo={chatUsersInfo}
                    totalUnread={totalUnread}
                    user={user}
                    searchUsers={searchUsers}
                />
                {/* ── MAIN CHAT WINDOW ── */}
                <div className="relative flex flex-col flex-1 h-full bg-surface-800 overflow-hidden hidden md:flex">

                    {/* Ambient orbs */}
                    <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full pointer-events-none z-0 bg-accent/5 blur-[80px]" />
                    <div className="absolute -bottom-20 left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none z-0 bg-violet/5 blur-[80px]" />

                    {context.currentChatUser ? (
                        <>
                            {/* Nav */}
                            <nav className="sticky top-0 z-10 flex items-center gap-3.5 h-16 px-6 border-b border-white/[0.06] bg-surface-800/90 backdrop-blur-xl">
                                <div className="relative w-10 h-10 flex-shrink-0">
                                    <img
                                        src={context.currentChatUser.avtar}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white/[0.07]"
                                    />
                                    {onlineStatus[context.currentChatUser._id] && (
                                        <div className="online-pulse absolute bottom-[1px] right-[1px] w-2.5 h-2.5 rounded-full bg-success border-2 border-surface-800"
                                            style={{ boxShadow: '0 0 8px #22d3a0' }} />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-semibold tracking-tight text-text-primary">
                                        {context.currentChatUser.username}
                                    </span>
                                    {chatUsersInfo[currentChatId]?.typing ? (
                                        <span className="flex items-center gap-1 text-xs text-success font-medium">
                                            <span className="flex gap-0.5 items-center">
                                                <span className="typing-dot w-[3px] h-[3px] rounded-full bg-success inline-block" />
                                                <span className="typing-dot w-[3px] h-[3px] rounded-full bg-success inline-block" />
                                                <span className="typing-dot w-[3px] h-[3px] rounded-full bg-success inline-block" />
                                            </span>
                                            typing
                                        </span>
                                    ) : (
                                        <span className="text-xs text-text-dim">
                                            {onlineStatus[context.currentChatUser._id] ? 'Online' : 'Offline'}
                                        </span>
                                    )}
                                </div>
                            </nav>

                            {isMedia ? (
                                <MediaPreview
                                    isMedia={isMedia}
                                    handleSend={handleSend}
                                    message={message}
                                    setMessage={setMessage}
                                />
                            ) :

                                currentPreviewFile ? (
                                    <SingleFilePreview />
                                ) :

                                    (
                                        <>
                                            {/* Messages */}
                                            <div
                                                ref={chatContainerRef}
                                                className="flex-1 overflow-y-auto px-6 pt-6 pb-2 z-[1] custom-scroll"
                                            >
                                                {/* Top sentinel for infinite scroll */}
                                                <div ref={topSentinelRef} className="h-1 w-full" />

                                                {/* Loading older messages spinner */}
                                                {paginationMeta[currentChatId]?.isLoadingMore && (
                                                    <div className="flex items-center justify-center py-4">
                                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                                                            style={{
                                                                background: 'rgba(99,102,241,0.08)',
                                                                border: '1px solid rgba(99,102,241,0.18)',
                                                            }}>
                                                            <Loader2 size={14} className="loading-spinner" color="#818cf8" />
                                                            <span className="text-[11px] font-medium" style={{ color: '#818cf8' }}>Loading older messages…</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* "No more messages" indicator */}
                                                {paginationMeta[currentChatId]?.hasMore === false && messages[currentChatId]?.length > 0 && !paginationMeta[currentChatId]?.isLoadingMore && (
                                                    <div className="flex items-center justify-center py-3 mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/[0.08]" />
                                                            <span className="text-[11px] font-medium text-[#3a3e58]">Beginning of conversation</span>
                                                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/[0.08]" />
                                                        </div>
                                                    </div>
                                                )}

                                                {messages[currentChatId]?.map((msg) => (
                                                    <Message key={msg._id} msg={msg} />
                                                ))}

                                                {!isAtBottom && (
                                                    <button
                                                        onClick={scrollToBottom}
                                                        className="fixed z-20 bottom-24 right-8 w-9 h-9 flex items-center justify-center rounded-full bg-accent border-none cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                                                        style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
                                                    >
                                                        <ArrowDownCircleIcon size={18} className="text-white" />
                                                    </button>
                                                )}

                                                <div ref={messageEndRef} />
                                            </div>

                                            {/* Unread badge */}
                                            {chatUsersInfo[currentChatId]?.newMessages > 0 && (
                                                <div className="fade-in-up absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-accent-light border border-accent/35 bg-accent/10 backdrop-blur-md">
                                                    <MoveDown size={13} />
                                                    {chatUsersInfo[currentChatId].newMessages} unread messages
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <footer
                                                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                                                className="z-10 flex items-center gap-3 h-20 px-5 border-t border-white/[0.06] bg-surface-800/90 backdrop-blur-xl">
                                                <div className="msg-input-wrap flex flex-1 items-center gap-2 bg-surface-700 border border-white/[0.06] rounded-2xl px-1 pr-1.5 transition-all duration-200">
                                                    <div className="flex items-center px-1 text-text-dim flex-shrink-0">
                                                        <FileUpload />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={message}
                                                        onChange={(e) => handleTyping(e)}
                                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                                                        placeholder="Type a message…"
                                                        className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm py-3.5 px-2 placeholder-text-dim"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSend}
                                                    className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border-none cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
                                                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
                                                >
                                                    <Send size={18} className="text-white" />
                                                </button>
                                            </footer>
                                        </>
                                    )}
                        </>
                    ) : (
                        /* Empty state */
                        <div className="relative z-[1] flex flex-col items-center justify-center w-full h-full gap-4">
                            <div
                                className="float-icon flex items-center justify-center w-[72px] h-[72px] rounded-2xl border border-accent/35"
                                style={{
                                    background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
                                    boxShadow: '0 0 30px rgba(99,102,241,0.2)'
                                }}
                            >
                                <MessageCircle size={32} className="text-accent-light" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-text-primary">No conversation selected</h1>
                            <p className="text-sm text-text-dim max-w-[280px] text-center leading-relaxed">
                                Pick someone from your conversations to start messaging instantly.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Home