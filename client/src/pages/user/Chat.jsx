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
    ArrowLeft,
    Search,
    Zap,
    Bell,
    User,
    Settings,
    Users,
    Plus,
    LogOut,
    X,
    ChevronRight,
    Reply,
    ImageIcon,
    Sparkles,
    ChevronDown,
    Copy,
    Check,
    Loader2,
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
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import { useGroupChatStore } from '../../store/useGroupChatStore.js'
import { getTime } from '../../services/getTime.js'
import { groupApi } from '../../api/group.api.js'

// ── Dummy summary generator (replace with real API call later) ──────────────
const DUMMY_SUMMARY = {
    overview: "This conversation covers project updates, task assignments, and team coordination for the upcoming sprint cycle.",
    keyPoints: [
        "The deadline for the design mockups was confirmed as Friday EOD.",
        "Backend API endpoints need review before integration testing begins.",
        "Three bugs were identified and assigned to respective team members.",
        "The team agreed to a standup at 10 AM daily for the next two weeks.",
    ],
    sentiment: "positive",
    messageCount: 24,
    timespan: "2 hours",
}

function SummaryDrawer({ isOpen, onClose, isLoading, summary }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (!summary) return
        const text = `Summary\n\n${summary.overview}\n\nKey Points:\n${summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const sentimentColor = {
        positive: '#22d3a0',
        negative: '#f87171',
        neutral: '#818cf8',
    }[summary?.sentiment || 'neutral']

    const sentimentLabel = {
        positive: '😊 Positive',
        negative: '😟 Negative',
        neutral: '😐 Neutral',
    }[summary?.sentiment || 'neutral']

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="summary-backdrop"
                style={{
                    position: 'fixed', inset: 0, zIndex: 40,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(4px)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease',
                }}
            />

            {/* Drawer */}
            <div
                style={{
                    position: 'fixed',
                    top: 0, right: 0, bottom: 0,
                    width: '100%', maxWidth: '420px',
                    zIndex: 50,
                    background: 'linear-gradient(160deg, #0f1120 0%, #0c0e18 100%)',
                    borderLeft: '1px solid rgba(99,102,241,0.18)',
                    boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex', flexDirection: 'column',
                    overflowY: 'auto',
                }}
                className="custom-scroll"
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 20px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(99,102,241,0.04)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 36, height: 36,
                            borderRadius: 11,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.18))',
                            border: '1px solid rgba(99,102,241,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 16px rgba(99,102,241,0.2)',
                        }}>
                            <Sparkles size={16} color="#818cf8" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f2f7', letterSpacing: '-0.01em' }}>
                                AI Summary
                            </div>
                            <div style={{ fontSize: 11, color: '#4a4e6a', marginTop: 1 }}>
                                Powered by Claude
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {summary && !isLoading && (
                            <button
                                onClick={handleCopy}
                                style={{
                                    width: 32, height: 32, borderRadius: 9,
                                    background: copied ? 'rgba(34,211,160,0.12)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${copied ? 'rgba(34,211,160,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                {copied
                                    ? <Check size={13} color="#22d3a0" />
                                    : <Copy size={13} color="#4a4e6a" />
                                }
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                width: 32, height: 32, borderRadius: 9,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={14} color="#4a4e6a" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Loading skeleton */}
                    {isLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{
                                borderRadius: 14,
                                background: 'rgba(99,102,241,0.07)',
                                border: '1px solid rgba(99,102,241,0.12)',
                                padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: 10,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <div className="skeleton-pulse" style={{ width: 80, height: 10, borderRadius: 5, background: 'rgba(99,102,241,0.2)' }} />
                                </div>
                                {[1, 0.7, 0.85].map((w, i) => (
                                    <div key={i} className="skeleton-pulse" style={{
                                        width: `${w * 100}%`, height: 8, borderRadius: 5,
                                        background: 'rgba(255,255,255,0.05)',
                                        animationDelay: `${i * 0.15}s`,
                                    }} />
                                ))}
                            </div>
                            <div style={{
                                borderRadius: 14,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: 10,
                            }}>
                                {[0.9, 0.75, 0.8, 0.65].map((w, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="skeleton-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', flexShrink: 0 }} />
                                        <div className="skeleton-pulse" style={{
                                            width: `${w * 100}%`, height: 7, borderRadius: 5,
                                            background: 'rgba(255,255,255,0.05)',
                                            animationDelay: `${i * 0.12}s`,
                                        }} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ textAlign: 'center', paddingTop: 8 }}>
                                <span style={{ fontSize: 12, color: '#4a4e6a' }}>Analyzing conversation…</span>
                            </div>
                        </div>
                    )}

                    {/* Summary content */}
                    {!isLoading && summary && (
                        <>
                            {/* Stats row */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[
                                    { label: 'Messages', value: summary.messages },
                                    { label: 'Timespan', value: summary.timespan },
                                    { label: 'Tone', value: summary.sentiment },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{
                                        flex: 1, padding: '10px 12px', borderRadius: 12,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        display: 'flex', flexDirection: 'column', gap: 4,
                                    }}>
                                        <span style={{ fontSize: 10, color: '#4a4e6a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                                        <span style={{ fontSize: 12, color: '#c4c6e7', fontWeight: 600 }}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Overview */}
                            <div style={{
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
                                border: '1px solid rgba(99,102,241,0.18)',
                                padding: '16px 18px',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Decorative orb */}
                                <div style={{
                                    position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)',
                                    filter: 'blur(20px)',
                                }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                    <Sparkles size={12} color="#818cf8" />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        Overview
                                    </span>
                                </div>
                                <p style={{ fontSize: 13.5, color: '#c4c6e7', lineHeight: 1.65, margin: 0, position: 'relative' }}>
                                    {summary.overview}
                                </p>
                            </div>

                            {/* Key points */}
                            <div style={{
                                borderRadius: 14,
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                padding: '16px 18px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        Key Points
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {summary.keyPoints.map((point, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                                                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                                                border: '1px solid rgba(99,102,241,0.25)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 9, fontWeight: 700, color: '#818cf8',
                                                marginTop: 1,
                                            }}>
                                                {i + 1}
                                            </div>
                                            <p style={{ margin: 0, fontSize: 13, color: '#a0a3b1', lineHeight: 1.6 }}>
                                                {point}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer note */}
                            <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
                                <span style={{ fontSize: 11, color: '#2e3147' }}>
                                    Summary generated from last 50 messages
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

function Home() {

    const context = useContext(authContext);
    const [message, setMessage] = React.useState("")
    const [query, setQuery] = React.useState("")

    const [activePanel, setActivePanel] = useState("chats")

    // ── Summary state ──────────────────────────────────────────────────
    const [summaryOpen, setSummaryOpen] = useState(false)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryData, setSummaryData] = useState(null)

    const handleSummarize = async () => {
        setSummaryOpen(true)
        if (summaryData) return // already loaded, just reopen
        setSummaryLoading(true)
        // Simulate API delay — replace with real call later
        const response = await chatApi.getSummarizedChat(currentChatId || paramChatId)
        if (response.success) {
            setSummaryData(response.data)
            setSummaryLoading(false)
        }
    }
    // ──────────────────────────────────────────────────────────────────

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
        isReplying,
        setIsReplying,
        messageBeingReplied,
        setMessageBeingReplied,
        setUserMessages,
        paginationMeta,
        setPaginationMeta,
        setLoadingMore,
        prependMessages
    } = useChatStore()

    const { setGroupChat, groupChat, currentGroupParticipants, setCurrentGroupParticipants } = useGroupChatStore();

    const {
        scrollToBottomInChat,
        setScrollToBottomInChat
    } = useAssetsStore()

    const typingTimeoutRef = useRef(null);
    const paramChatId = useParams().id
    const isTypingRef = useRef(false);
    const messageEndRef = useRef(null);
    const chatContainerRef = useRef(null)
    const inputRef = useRef(null)
    const topSentinelRef = useRef(null)
    const [isAtBottom, setIsAtBottom] = React.useState(true);
    const isMedia = mediaFiles[currentChatId || paramChatId]?.length > 0
    const [showSidebar, setShowSidebar] = useState(true)
    const [groupsOnly, setGroupsOnly] = useState(false)
    const navigate = useNavigate()
    const [chatLoading, setChatLoading] = useState(true)
    const chatRestoredRef = useRef(false)

    // Safety: if context.currentChatUser never gets set after loading finishes, navigate away
    useEffect(() => {
        if (!chatLoading && paramChatId && !context.currentChatUser) {
            const timeout = setTimeout(() => {
                if (!context.currentChatUser) navigate('/')
            }, 5000)
            return () => clearTimeout(timeout)
        }
    }, [chatLoading, paramChatId, context.currentChatUser])

    const totalUnread = Object.values(chatUsersInfo).reduce((sum, c) => sum + (c?.newMessages || 0), 0)

    const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel)

    const loadUnreadMessages = (chats) => {
        chats.forEach((chat) => {
            incrementNewMessagesCountByN(chat._id, chat.unreadMessagesCount)
        })
    }

    const setCurrentChatId = useChatStore(state => state.setCurrentChatId)
    const setIsGroupChat = useChatStore(state => state.setIsGroupChat)

    // ── Load messages with pagination ─────────────────────────────────
    const loadMessages = async (chat) => {
        if (!chat) return
        const chatId = chat._id

        console.log("DEBUG loadMessages start for chat:", chatId)
        console.log("DEBUG chat.participants:", chat.participants)
        console.log("DEBUG user._id:", user?._id)

        if (chat.isGroupChat) {
            const response = await groupApi.getConversation(chatId)
            if (response?.data?.data) {
                const payload = response.data.data
                const msgs = payload.messages || payload
                const hasMore = payload.hasMore ?? false
                const nextCursor = payload.nextCursor ?? null
                setUserMessages(chatId, Array.isArray(msgs) ? msgs : [])
                setPaginationMeta(chatId, { hasMore: !!hasMore, nextCursor, isLoadingMore: false })
            }
        } else {
            const otherParticipant = chat.participants?.find(p => p._id !== user?._id) || chat.participants?.[0]
            console.log("DEBUG otherParticipant:", otherParticipant)
            if (otherParticipant?._id) {
                const response = await messageApi.getConversation(otherParticipant._id)
                console.log("DEBUG msg api response data:", response?.data)
                if (response?.data?.data) {
                    const payload = response.data.data
                    const msgs = payload.messages || payload
                    const hasMore = payload.hasMore ?? false
                    const nextCursor = payload.nextCursor ?? null
                    setUserMessages(chatId, Array.isArray(msgs) ? msgs : [])
                    setPaginationMeta(chatId, { hasMore: !!hasMore, nextCursor, isLoadingMore: false })
                }
            }
        }
    }

    const applyChatFromData = async (chat) => {
        if (!chat) return false

        setCurrentChatId(chat._id)

        if (chat.isGroupChat) {
            setIsGroupChat(true)
            setGroupChat(chat)
            const otherParticipant = chat.participants?.find(p => p._id !== user._id) || chat.participants?.[0]
            context.setCurrentChatUser(otherParticipant)
        } else {
            setIsGroupChat(chat.isGroupChat)
            const otherParticipant = chat.participants?.find(p => p._id !== user._id) || chat.participants?.[0]
            context.setCurrentChatUser(otherParticipant)
        }

        await loadMessages(chat)

        setScrollToBottomInChat(true)
        return true
    }

    const restoreChatFromUrl = async (chats) => {
        if (!paramChatId) {
            setChatLoading(false)
            return
        }
        if (chatRestoredRef.current) {
            setChatLoading(false)
            return
        }
        chatRestoredRef.current = true

        const chat = chats.find(c => c._id === paramChatId)
        if (chat) {
            await applyChatFromData(chat)
            setChatLoading(false)
            return
        }

        try {
            const response = await chatApi.getChatById(paramChatId)
            if (response.success && response.data) {
                await applyChatFromData(response.data)
            }
        } catch { }
        setChatLoading(false)
    }

    const getAllUsers = async () => {
        try {
            const response = await chatApi.getUserChats();
            if (response.success) {
                setUsers(response.data);
                loadUnreadMessages(response.data)
                setChatUsersInfo(response.data)
                await restoreChatFromUrl(response.data)
                console.log("All users fetched:", response.data);
            } else {
                if (paramChatId) {
                    try {
                        const response = await chatApi.getChatById(paramChatId)
                        if (response.success && response.data) {
                            await applyChatFromData(response.data)
                        }
                    } catch { }
                }
                setChatLoading(false)
            }
        } catch (error) {
            console.error("Failed to fetch chats:", error)
            if (paramChatId) {
                try {
                    const response = await chatApi.getChatById(paramChatId)
                    if (response.success && response.data) {
                        await applyChatFromData(response.data)
                    }
                } catch { }
            }
            setChatLoading(false)
        }
    }

    const getConversationMessages = async (otherUserId) => {
        const messages = await messageApi.getConversation(otherUserId)
    }

    const handleCancelReply = () => {
        setIsReplying(false)
        setMessageBeingReplied(null)
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
            createdAt: "2026-02-21T08:49:25.317Z",
            ...(isReplying && messageBeingReplied ? { replyTo: messageBeingReplied } : {})
        })

        setScrollToBottomInChat(true);

        if (isReplying) handleCancelReply()

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

        if (isReplying && messageBeingReplied) {
            socket.emit(socketEvents.MESSAGE_REPLY_SINGLE_CHAT, {
                message: message || "",
                attachments: uploadInfo?.data || [],
                receiver: context.currentChatUser._id,
                chatId: currentChatId || null,
                tempId: tempId,
                replyTo: messageBeingReplied || null
            }, (ack) => {
                console.log("Ack from server:", ack);
            })
        }
        else if (isGroupChat) {
            socket.emit(socketEvents.NEW_MESSAGE_GROUP, {
                message: message || "",
                attachments: uploadInfo?.data || [],
                chatId: currentChatId || null,
                tempId: tempId,
            }, (ack) => {
                console.log("Ack from server:", ack);
            })
        }
        else {
            socket.emit(socketEvents.NEW_MESSAGE, {
                message: message || "",
                attachments: uploadInfo?.data || [],
                receiver: context.currentChatUser._id,
                chatId: currentChatId || null,
                tempId: tempId,
            }, (ack) => {
                console.log("Ack from server:", ack);
            })
        }

        setMessage("")
    }

    const scrollToBottom = () => {
        const container = chatContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    };

    // ── Infinite scroll: load older messages ──────────────────────────
    const loadOlderMessages = useCallback(async () => {
        const activeChatId = currentChatId || paramChatId
        if (!activeChatId) return
        const meta = paginationMeta[activeChatId]
        if (!meta?.hasMore || meta?.isLoadingMore) return

        setLoadingMore(activeChatId, true)

        const container = chatContainerRef.current
        const prevScrollHeight = container?.scrollHeight || 0

        try {
            const chatState = useChatStore.getState()
            const chat = chatState.userChats.find(c => c._id === activeChatId)
            let response

            if (isGroupChat) {
                response = await groupApi.getConversation(activeChatId, meta.nextCursor)
            } else {
                const otherParticipant = chat?.participants?.find(p => p._id !== user._id) || context.currentChatUser
                if (otherParticipant?._id) {
                    response = await messageApi.getConversation(otherParticipant._id, meta.nextCursor)
                }
            }

            if (response?.data?.data) {
                const { messages: olderMsgs, hasMore, nextCursor } = response.data.data
                if (olderMsgs?.length > 0) {
                    prependMessages(activeChatId, olderMsgs)

                    // Restore scroll position
                    requestAnimationFrame(() => {
                        if (container) {
                            const newScrollHeight = container.scrollHeight
                            container.scrollTop = newScrollHeight - prevScrollHeight
                        }
                    })
                }
                setPaginationMeta(activeChatId, { hasMore: !!hasMore, nextCursor: nextCursor || null, isLoadingMore: false })
            } else {
                setLoadingMore(activeChatId, false)
            }
        } catch (error) {
            console.error("Error loading older messages:", error)
            setLoadingMore(activeChatId, false)
        }
    }, [currentChatId, paramChatId, paginationMeta, isGroupChat])

    // ── Socket reconnect: re-fetch messages on reconnection ──────────
    useEffect(() => {
        const handleReconnect = () => {
            console.log("Socket reconnected, re-fetching messages...")
            const activeChatId = currentChatId || paramChatId
            if (activeChatId && context.currentChatUser) {
                const chatState = useChatStore.getState()
                const chat = chatState.userChats.find(c => c._id === activeChatId)
                if (chat) loadMessages(chat)
            }
        }
        socket.on('connect', handleReconnect)
        return () => socket.off('connect', handleReconnect)
    }, [currentChatId, paramChatId])

    useEffect(() => {
        if (isReplying && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isReplying])

    useEffect(() => {
        getAllUsers();
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

        console.log("GROUP CHAT CHAT ::: ", groupChat)
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
            requestAnimationFrame(() => {
                scrollToBottom();
            });
            setScrollToBottomInChat(false);
        }
    }, [scrollToBottomInChat])

    useEffect(() => {
        if (isAtBottom && messages[currentChatId]?.length > 0) {
            requestAnimationFrame(() => {
                scrollToBottom();
            });
        }
    }, [messages[currentChatId]?.length])

    // Reset summary when chat changes
    useEffect(() => {
        setSummaryData(null)
        setSummaryOpen(false)
    }, [currentChatId])

    // Scroll to latest message every time user opens/switches a chat
    useEffect(() => {
        if (currentChatId && messages[currentChatId]?.length > 0) {
            // Delay ensures DOM has rendered the messages
            const timer = setTimeout(() => scrollToBottom(), 150)
            return () => clearTimeout(timer)
        }
    }, [currentChatId, chatLoading])


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

    const handleGroupTyping = (e) => {
        const value = e.target.value;
        setMessage(value);

        if (!socket || !context.currentChatUser || !currentChatId) return;

        if (!isTypingRef.current) {
            socket.emit(socketEvents.TYPING_GROUP, {
                chatId: currentChatId,
                isTyping: true,
            });
            isTypingRef.current = true;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit(socketEvents.TYPING_GROUP, {
                chatId: currentChatId,
                isTyping: false,
            });
            isTypingRef.current = false;
        }, 2000);
    }

    const handleSingleTyping = (e) => {
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
    }

    const handleTyping = (e) => {
        if (isGroupChat) {
            handleGroupTyping(e)
        }
        if (!isGroupChat) {
            handleSingleTyping(e)
        }
    };

    const handleChatInfoClick = () => {
        if (isGroupChat) {
            setActivePanel("groupInfo")
        }
    }

    const NavIconBtn = ({ icon: Icon, panel, badge, tooltip }) => {
        const active = activePanel === panel
        return (
            <button
                onClick={() => togglePanel(panel)}
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
                <span className="absolute left-full ml-2.5 px-2 py-1 text-[11px] font-medium text-[#c4c6e7] bg-[#1a1d28] border border-white/[0.08] rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                    {tooltip}
                </span>
            </button>
        )
    }

    // ── Reply preview strip ──────────────────────────────────────────
    const ReplyPreviewStrip = () => {
        if (!isReplying || !messageBeingReplied) return null

        const isOwn = messageBeingReplied.sender === user._id
        const hasAttachment = messageBeingReplied?.attachments?.length > 0
        const hasText = messageBeingReplied?.message?.trim()
        const senderLabel = isOwn ? 'You' : (context.currentChatUser?.username || 'Them')
        const thumbUrl = hasAttachment
            ? (messageBeingReplied.attachments[0]?.secure_url || messageBeingReplied.attachments[0]?.preview)
            : null
        const previewText = hasText
            ? messageBeingReplied.message
            : hasAttachment ? 'Photo' : ''

        return (
            <div
                className="flex items-center gap-2.5 px-4 py-2 border-t border-white/[0.05]"
                style={{ background: 'rgba(10,11,20,0.6)', animation: 'replyStripIn 0.18s cubic-bezier(0.16,1,0.3,1)' }}
            >
                <div className="flex items-center gap-2.5 flex-1 min-w-0 rounded-[11px] px-3 py-2"
                    style={{
                        background: 'rgba(99,102,241,0.07)',
                        borderLeft: '3px solid #6366f1',
                    }}>
                    <Reply size={12} color="#818cf8" style={{ transform: 'scaleX(-1)', flexShrink: 0 }} />
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-semibold leading-none mb-[3px]" style={{ color: '#818cf8' }}>
                            {senderLabel}
                        </span>
                        <span className="text-[12px] truncate leading-snug" style={{ color: '#6b7280' }}>
                            {hasAttachment && (
                                <span className="inline-flex items-center gap-1 mr-1">
                                    <ImageIcon size={10} style={{ display: 'inline', color: '#818cf8' }} />
                                    {!hasText && 'Photo'}
                                </span>
                            )}
                            {hasText && previewText}
                        </span>
                    </div>
                    {thumbUrl && (
                        <img
                            src={thumbUrl}
                            alt=""
                            className="w-9 h-9 rounded-[7px] object-cover flex-shrink-0"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                    )}
                </div>
                <button
                    onClick={handleCancelReply}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-150"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    <X size={12} color="#4a4e6a" />
                </button>
            </div>
        )
    }

    // ── Loading skeleton ─────────────────────────────────────────────
    const ChatSkeleton = () => (
        <div className="relative z-[1] flex flex-col w-full h-full">
            {/* Skeleton header */}
            <div className="flex items-center gap-3 h-16 px-4 md:px-6 border-b border-white/[0.06] bg-surface-800/90">
                <div className="w-10 h-10 rounded-full skeleton-pulse" style={{ background: 'rgba(99,102,241,0.15)' }} />
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="w-28 h-3 rounded skeleton-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <div className="w-16 h-2.5 rounded skeleton-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
            </div>
            {/* Skeleton messages */}
            <div className="flex-1 px-4 md:px-6 pt-6 flex flex-col gap-3">
                {[0.4, 0.7, 0.35, 0.55, 0.6, 0.3].map((w, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div
                            className="rounded-2xl skeleton-pulse"
                            style={{
                                width: `${w * 100}%`,
                                maxWidth: 280,
                                height: 40 + (i % 3) * 12,
                                background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.1)',
                                animationDelay: `${i * 0.12}s`,
                            }}
                        />
                    </div>
                ))}
            </div>
            {/* Skeleton footer */}
            <div className="flex items-center gap-3 h-20 px-4 md:px-5 border-t border-white/[0.06]">
                <div className="flex-1 h-11 rounded-2xl skeleton-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="w-11 h-11 rounded-xl skeleton-pulse" style={{ background: 'rgba(99,102,241,0.15)' }} />
            </div>
        </div>
    )

    // ── Loading more spinner at top ──────────────────────────────────
    const activeChatId = currentChatId || paramChatId
    const isLoadingMore = paginationMeta[activeChatId]?.isLoadingMore
    const hasMore = paginationMeta[activeChatId]?.hasMore

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

                @keyframes replyStripIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .custom-scroll { scrollbar-width: thin; scrollbar-color: #1a1d28 transparent; }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #1a1d28; border-radius: 4px; }

                .msg-input-wrap:focus-within {
                    border-color: rgba(99,102,241,0.35) !important;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
                }

                .msg-input-wrap-replying {
                    border-color: rgba(99,102,241,0.28) !important;
                    box-shadow: 0 0 0 2px rgba(99,102,241,0.1) !important;
                }

                .msg-input-wrap-replying:focus-within {
                    border-color: rgba(99,102,241,0.5) !important;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.18) !important;
                }

                /* Summarize button */
                .summarize-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 14px; border-radius: 20px;
                    background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.1));
                    border: 1px solid rgba(99,102,241,0.28);
                    color: #818cf8; font-size: 12px; font-weight: 600;
                    cursor: pointer; transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .summarize-btn:hover {
                    background: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16));
                    border-color: rgba(99,102,241,0.45);
                    box-shadow: 0 0 16px rgba(99,102,241,0.2);
                    transform: translateY(-1px);
                }
                .summarize-btn:active { transform: translateY(0); }
                .summarize-btn .sparkle-icon { animation: sparkle-spin 2.5s ease-in-out infinite; }
                @keyframes sparkle-spin {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    50% { transform: scale(1.2) rotate(15deg); opacity: 0.8; }
                }

                /* Skeleton pulse */
                .skeleton-pulse {
                    animation: skeletonPulse 1.4s ease-in-out infinite;
                }
                @keyframes skeletonPulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }

                /* Infinite scroll spinner */
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .loading-spinner {
                    animation: spin 0.8s linear infinite;
                }

                /* Mobile-optimized message bubbles */
                @media (max-width: 767px) {
                    .msg-bubble-wrapper {
                        max-width: 82% !important;
                    }
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
                    hideOnMobile={true}
                    searchUsers={searchUsers}
                />

                {/* ── MAIN CHAT WINDOW ── */}
                <div className="relative flex flex-col flex-1 h-full bg-surface-800 overflow-hidden md:flex">

                    {/* Ambient orbs */}
                    <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full pointer-events-none z-0 bg-accent/5 blur-[80px]" />
                    <div className="absolute -bottom-20 left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none z-0 bg-violet/5 blur-[80px]" />

                    {(chatLoading || (paramChatId && !context.currentChatUser)) ? (
                        <ChatSkeleton />
                    ) : context.currentChatUser ? (
                        <>
                            {/* Nav — mobile-optimized with back button */}
                            <nav
                                className="sticky top-0 z-10 flex items-center gap-2 md:gap-3.5 h-14 md:h-16 px-3 md:px-6 border-b border-white/[0.06] bg-surface-800/90 backdrop-blur-xl">

                                {/* Back button — mobile only */}
                                <button
                                    onClick={() => navigate('/')}
                                    className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                >
                                    <ArrowLeft size={18} color="#818cf8" />
                                </button>

                                {/* Left: avatar + name — clickable for group info */}
                                <div
                                    title={isGroupChat ? 'Group Info' : "User Profile"}
                                    onClick={handleChatInfoClick}
                                    className="flex items-center gap-2.5 md:gap-3.5 flex-1 min-w-0 cursor-pointer"
                                >
                                    <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                                        <img
                                            src={
                                                isGroupChat && groupChat?.groupPicture ? groupChat.groupPicture :
                                                    !isGroupChat && context.currentChatUser?.avtar ? context.currentChatUser.avtar : `https://api.dicebear.com/7.x/shapes/svg?seed=${context.currentChatUser._id}&scale=90`
                                            }
                                            alt=""
                                            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white/[0.07]"
                                        />
                                        {!isGroupChat && onlineStatus[context.currentChatUser._id] && (
                                            <div className="online-pulse absolute bottom-[1px] right-[1px] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-success border-2 border-surface-800"
                                                style={{ boxShadow: '0 0 8px #22d3a0' }} />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[13px] md:text-[15px] font-semibold tracking-tight text-text-primary truncate">
                                            {(!isGroupChat && context.currentChatUser?.username) || (isGroupChat ? groupChat?.groupName : "Unknown User")}
                                        </span>
                                        {chatUsersInfo[currentChatId]?.typing ? (
                                            <span className="flex items-center gap-1 text-[11px] md:text-xs text-success font-medium">
                                                <span className="flex gap-0.5 items-center">
                                                    <span className="typing-dot w-[3px] h-[3px] rounded-full bg-success inline-block" />
                                                    <span className="typing-dot w-[3px] h-[3px] rounded-full bg-success inline-block" />
                                                    <span className="typing-dot w-[3px] h-[3px] rounded-full bg-success inline-block" />
                                                </span>
                                                {chatUsersInfo[currentChatId].typers.length > 0 &&
                                                    chatUsersInfo[currentChatId].typers.map((typer, index) => (
                                                        <span key={index}>
                                                            {typer.username || 'Unknown User'} {index < chatUsersInfo[currentChatId].typers.length - 1 ? ', ' : ' '}
                                                        </span>
                                                    ))}
                                                typing
                                            </span>
                                        ) : (
                                            !isGroupChat ?
                                                <span className="text-[11px] md:text-xs text-gray-400 truncate">
                                                    {onlineStatus[context.currentChatUser._id] ? 'Online' : !onlineStatus[context.currentChatUser._id] ? `last active ${getTime(context?.currentChatUser?.lastActive)}` : 'Offline'}
                                                </span>
                                                : <span className="text-[11px] md:text-xs text-gray-400">

                                                </span>


                                        )}
                                    </div>
                                </div>

                                {/* Right: Summarize button */}
                                <button
                                    className="summarize-btn"
                                    onClick={handleSummarize}
                                    title="Summarize conversation"
                                >
                                    <Sparkles size={13} className="sparkle-icon" />
                                    <span className="hidden sm:inline">Summarize</span>
                                </button>
                            </nav>

                            {isMedia ? (
                                <MediaPreview
                                    isMedia={isMedia}
                                    handleSend={handleSend}
                                    message={message}
                                    setMessage={setMessage}
                                />
                            ) : currentPreviewFile ? (
                                <SingleFilePreview />
                            ) : (
                                <>
                                    {/* Messages */}
                                    <div
                                        ref={chatContainerRef}
                                        className="flex-1 overflow-y-auto px-2 md:px-6 pt-4 md:pt-6 pb-2 z-[1] custom-scroll"
                                    >
                                        {/* Top sentinel for infinite scroll */}
                                        <div ref={topSentinelRef} className="h-1 w-full" />

                                        {/* Loading older messages spinner */}
                                        {isLoadingMore && (
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
                                        {!hasMore && messages[currentChatId]?.length > 0 && !isLoadingMore && (
                                            <div className="flex items-center justify-center py-3 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/[0.08]" />
                                                    <span className="text-[11px] font-medium text-[#3a3e58]">Beginning of conversation</span>
                                                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/[0.08]" />
                                                </div>
                                            </div>
                                        )}

                                        {messages[currentChatId]?.map((msg) => (
                                            <Message
                                                key={msg._id}
                                                msg={msg}
                                                isGroupChat={isGroupChat}
                                            />
                                        ))}

                                        {!isAtBottom && (
                                            <button
                                                onClick={scrollToBottom}
                                                className="fixed z-20 bottom-24 right-4 md:right-8 w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-accent border-none cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-90"
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

                                    {/* ── FOOTER ── */}
                                    <footer
                                        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
                                        className="z-10 flex flex-col border-t border-white/[0.06] bg-surface-800/90 backdrop-blur-xl"
                                    >
                                        <ReplyPreviewStrip />

                                        <div className="flex items-center gap-2 md:gap-3 h-16 md:h-20 px-3 md:px-5">
                                            <div className={`msg-input-wrap flex flex-1 items-center gap-1 md:gap-2 bg-surface-700 border border-white/[0.06] rounded-2xl px-1 pr-1.5 transition-all duration-200 ${isReplying ? 'msg-input-wrap-replying' : ''}`}>
                                                <div className="flex items-center px-1 text-text-dim flex-shrink-0">
                                                    <FileUpload />
                                                </div>
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={message}
                                                    onChange={(e) => handleTyping(e)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape' && isReplying) {
                                                            handleCancelReply()
                                                            return
                                                        }
                                                        e.key === 'Enter' && !e.shiftKey && handleSend(e)
                                                    }}
                                                    placeholder={
                                                        isReplying
                                                            ? `Reply to ${messageBeingReplied?.sender === user._id ? 'yourself' : context.currentChatUser?.username}…`
                                                            : "Type a message…"
                                                    }
                                                    className="flex-1 bg-transparent border-none outline-none text-text-primary text-[14px] md:text-sm py-3 md:py-3.5 px-1.5 md:px-2 placeholder-text-dim"
                                                    style={{ minHeight: '44px' }}
                                                />
                                            </div>
                                            <button
                                                onClick={handleSend}
                                                className="flex-shrink-0 flex items-center justify-center w-11 h-11 md:w-11 md:h-11 rounded-xl border-none cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
                                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', minWidth: '44px', minHeight: '44px' }}
                                            >
                                                <Send size={18} className="text-white" />
                                            </button>
                                        </div>
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
            </div>

            {/* ── SUMMARY DRAWER (portal-like, outside main layout) ── */}
            <SummaryDrawer
                isOpen={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                isLoading={summaryLoading}
                summary={summaryData}
            />
        </>
    )
}

export default Home