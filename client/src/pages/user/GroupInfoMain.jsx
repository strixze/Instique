import React, { useRef, useState } from 'react'
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
    Settings,
    Users,
    Plus,
    LogOut,
    X,
    ChevronRight
} from 'lucide-react'
import Swal from 'sweetalert2';
import Message from '../../components/message/Message.jsx'
import { messageApi } from '../../api/message.api.js'
import { useChatStore } from '../../store/useChatStore.js'
import { chatApi } from '../../api/chat.api.js'
import { userAuthStore } from '../../store/userStore.js'
import { socketEvents } from '../../constants/socketEvents.js'
import { useAssetsStore } from '../../store/useAssetsStore.js'
import { useGroupChatStore } from '../../store/useGroupChatStore.js'
import FileUpload from '../../components/message/FileUpload.jsx'
import MediaPreview from '../../components/message/MediaPreview.jsx'
import SingleFilePreview from '../../components/message/SingleFilePreview.jsx'
import Profile from '../../components/user/Profile.jsx'
import CreateGroup from '../../components/user/CreateGroup.jsx'
import SettingsPanel from '../../components/user/Settings.jsx'
import ChatList from '../../components/user/ChatList.jsx'
import GroupInfo from '../../components/user/GroupInfo.jsx'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import { groupApi } from '../../api/group.api.js'

function GroupInfoMain() {

    const context = useContext(authContext);
    const [message, setMessage] = React.useState("")
    const [query, setQuery] = React.useState("")

    // Panel state: null | 'notifications' | 'profile' | 'newGroup' | 'settings'
    const [activePanel, setActivePanel] = useState("groupInfo")

    const { user } = userAuthStore()

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
        groupChat,
    } = useChatStore()

    const {
        scrollToBottomInChat,
        setScrollToBottomInChat
    } = useAssetsStore()

    const {
        setCurrentGroupParticipants,
        currentGroupParticipants
    } = useGroupChatStore()

    const typingTimeoutRef = useRef(null);
    const paramChatId = useParams().id
    const isTypingRef = useRef(false);
    const messageEndRef = useRef(null);
    const chatContainerRef = useRef(null)
    const [isAtBottom, setIsAtBottom] = React.useState(true);
    const isMedia = mediaFiles[currentChatId || paramChatId]?.length > 0
    const [showSidebar, setShowSidebar] = useState(true)
    const [groupsOnly, setGroupsOnly] = useState(false)
    const navigate = useNavigate()
    const groupId = useParams().id;
    const [group, setGroup] = useState(null)

    // Total unread count for notification badge
    const totalUnread = Object.values(chatUsersInfo).reduce((sum, c) => sum + (c?.newMessages || 0), 0)

    const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel)

    const loadUnreadMessages = (chats) => {
        chats.forEach((chat) => {
            incrementNewMessagesCountByN(chat._id, chat.unreadMessagesCount)
        })
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

    const getMembers = async () => {
        const res = await groupApi.getGroupMembers(groupId);
        if (res.success) {
            setCurrentGroupParticipants(res.data);
        }
    }

    const getChat = async () => {
        const res = await chatApi.getChatById(groupId);
        if (res.success) {
            setGroup(res.data)
        }
    }



    useEffect(() => {
        getAllUsers();
        getChat();
        getMembers();
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

        switch (activePanel) {

            case "newGroup":
                setGroupsOnly(false)
                break;

            default:
                setGroupsOnly(true)
                break;

            case "groupInfo":
                navigate(`/chat/group-info/${currentChatId}`)
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

    const handleChatInfoClick = () => {
        if (isGroupChat) {
            setActivePanel("groupInfo")
        }
    }

    // ── Nav icon button helper ──────────────────────────────────────
    const NavIconBtn = ({ icon: Icon, panel, badge, tooltip }) => {
        const active = activePanel === panel
        return (
            <button
                onClick={() => togglePanel(panel)}
                // title={tooltip}
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
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
                * { font-family: 'Sora', sans-serif; box-sizing: border-box; }

                .typing-dot { animation: blink 1.2s infinite; }
                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes blink {
                    0%, 80%, 100% { opacity: 0.2; }
                    40% { opacity: 1; }
                }
                .online-pulse { animation: pulse-dot 2s infinite; }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.15); }
                }
                .float-icon { animation: float 3s ease-in-out infinite; }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .fade-in-up { animation: fadeInUp 0.3s ease; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .slide-in-panel {
                    animation: slideInPanel 0.22s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes slideInPanel {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .custom-scroll { scrollbar-width: thin; scrollbar-color: #1a1d28 transparent; }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #1a1d28; border-radius: 4px; }
                .sidebar-accent::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #6366f1, transparent);
                    opacity: 0.6;
                }
                .noise-bg::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
                    pointer-events: none;
                    z-index: 0;
                    opacity: 0.4;
                }
                .search-input:focus {
                    border-color: rgba(99,102,241,0.35) !important;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
                }
                .msg-input-wrap:focus-within {
                    border-color: rgba(99,102,241,0.35) !important;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
                }
                .panel-divider {
                    height: 1px;
                    background: linear-gradient(90deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08), transparent);
                    margin: 0 16px 12px 16px;
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
            `}</style>

            {/* Root */}
            <div className="flex h-[100dvh] bg-[#0a0b0f] text-[#f1f2f7] overflow-hidden">


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
                    hideOnMobile={true}
                    paramChatId={paramChatId}
                    searchUsers={searchUsers}
                />

                {/* ── MAIN CHAT WINDOW ── */}
                {
                    activePanel === "groupInfo" ? <GroupInfo
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                        query={query}
                        setQuery={setQuery}
                        users={users}
                        setShowSidebar={setShowSidebar}
                        chatUsersInfo={chatUsersInfo}
                        totalUnread={totalUnread}
                        group={group}
                        user={user}
                    /> :

                        <div className={`
                    noise-bg relative flex flex-col flex-1 h-full bg-[#0c0e16] overflow-hidden
                   md:flex
                      `}>

                            {/* Ambient orbs */}
                            <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
                                style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)', filter: 'blur(80px)' }} />
                            <div className="absolute -bottom-20 left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
                                style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.07),transparent 70%)', filter: 'blur(80px)' }} />

                            {context.currentChatUser ? (
                                <>
                                    {/* Nav */}
                                    <nav
                                        title={isGroupChat ? 'Group Info' : "User Profile"}
                                        onClick={handleChatInfoClick}
                                        className="sticky top-0 z-10 flex items-center gap-3.5 h-16 px-6 border-b border-white/[0.06] bg-[rgba(14,16,24,0.85)] backdrop-blur-xl">
                                        <div className="relative w-10 h-10 flex-shrink-0">
                                            <img
                                                src={context.currentChatUser.avtar}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover border-2 border-white/[0.07]"
                                            />
                                            {onlineStatus[context.currentChatUser._id] && (
                                                <div className="online-pulse absolute bottom-[1px] right-[1px] w-2.5 h-2.5 rounded-full bg-[#22d3a0] border-2 border-[#0c0e16]"
                                                    style={{ boxShadow: '0 0 8px #22d3a0' }} />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-semibold tracking-tight text-[#f1f2f7]">
                                                {context.currentChatUser?.username || (isGroupChat ? groupChat?.groupName : "Unknown User")}
                                            </span>
                                            {chatUsersInfo[currentChatId]?.typing ? (
                                                <span className="flex items-center gap-1 text-xs text-[#22d3a0] font-medium">
                                                    <span className="flex gap-0.5 items-center">
                                                        <span className="typing-dot w-[3px] h-[3px] rounded-full bg-[#22d3a0] inline-block" />
                                                        <span className="typing-dot w-[3px] h-[3px] rounded-full bg-[#22d3a0] inline-block" />
                                                        <span className="typing-dot w-[3px] h-[3px] rounded-full bg-[#22d3a0] inline-block" />
                                                    </span>
                                                    typing
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[#4a4e6a]">
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
                                                        {messages[currentChatId]?.map((msg) => (
                                                            <Message key={msg._id} msg={msg} />
                                                        ))}

                                                        {!isAtBottom && (
                                                            <button
                                                                onClick={scrollToBottom}
                                                                className="fixed z-20 bottom-24 right-8 w-9 h-9 flex items-center justify-center rounded-full bg-[#6366f1] border-none cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                                                                style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
                                                            >
                                                                <ArrowDownCircleIcon size={18} color="#fff" />
                                                            </button>
                                                        )}

                                                        <div ref={messageEndRef} />
                                                    </div>

                                                    {/* Unread badge */}
                                                    {chatUsersInfo[currentChatId]?.newMessages > 0 && (
                                                        <div className="fade-in-up absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] text-xs font-medium text-[#818cf8] border border-[rgba(99,102,241,0.35)] bg-[rgba(99,102,241,0.12)] backdrop-blur-md">
                                                            <MoveDown size={13} />
                                                            {chatUsersInfo[currentChatId].newMessages} unread messages
                                                        </div>
                                                    )}

                                                    {/* Footer */}
                                                    <footer
                                                        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                                                        className="z-10 flex items-center gap-3 h-20 px-5 border-t border-white/[0.06] bg-[rgba(14,16,24,0.9)] backdrop-blur-xl">
                                                        <div className="msg-input-wrap flex flex-1 items-center gap-2 bg-[#1a1d28] border border-white/[0.06] rounded-[20px] px-1 pr-1.5 transition-all duration-200">
                                                            <div className="flex items-center px-1 text-[#4a4e6a] flex-shrink-0">
                                                                <FileUpload />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={message}
                                                                onChange={(e) => handleTyping(e)}
                                                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                                                                placeholder="Type a message…"
                                                                className="flex-1 bg-transparent border-none outline-none text-[#f1f2f7] text-sm py-3.5 px-2 placeholder-[#4a4e6a]"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={handleSend}
                                                            className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-[14px] border-none cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
                                                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
                                                        >
                                                            <Send size={18} color="#fff" />
                                                        </button>
                                                    </footer>
                                                </>
                                            )}
                                </>
                            ) : (
                                /* Empty state */
                                <div className="relative z-[1] flex flex-col items-center justify-center w-full h-full gap-4">
                                    <div
                                        className="float-icon flex items-center justify-center w-[72px] h-[72px] rounded-[24px] border border-[rgba(99,102,241,0.35)]"
                                        style={{
                                            background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
                                            boxShadow: '0 0 30px rgba(99,102,241,0.2)'
                                        }}
                                    >
                                        <MessageCircle size={32} color="#818cf8" />
                                    </div>
                                    <h1 className="text-xl font-bold tracking-tight text-[#f1f2f7]">No conversation selected</h1>
                                    <p className="text-sm text-[#4a4e6a] max-w-[280px] text-center leading-relaxed">
                                        Pick someone from your conversations to start messaging instantly.
                                    </p>
                                </div>
                            )}
                        </div>
                }
            </div>
        </>
    )
}

export default GroupInfoMain