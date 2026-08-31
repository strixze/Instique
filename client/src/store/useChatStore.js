import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { getTime } from "../services/getTime"

export const useChatStore = create(
    devtools(
        (set) => ({

            universalInfo: {
                notifications: 0
            },

            updateNotificationsCount: (count = 0) => {
                set({
                    universalInfo: {
                        notifications: count
                    }
                })
            },

            incrementNotificationCount: (count = 1) => {
                set((state) => ({
                    universalInfo: {
                        ...state.universalInfo,
                        notifications: state.universalInfo.notifications + count
                    }
                }))
            },

            requests: [],

            setRequests: (req = []) => {
                set({
                    requests: req
                })
            },

            userMessages: {},

            setUserMessages: (chatId, messages) => (
                set((state) => ({
                    userMessages: {
                        ...state.userMessages,
                        [chatId]: messages
                    }
                }))
            ),

            addMessage: (chatId, message) => (
                set((state) => ({
                    userMessages: {
                        ...state.userMessages,
                        [chatId]: [
                            ...state.userMessages[chatId] || [],
                            message
                        ]
                    }
                }))
            ),

            // ── Pagination ──────────────────────────────────────────
            paginationMeta: {},

            setPaginationMeta: (chatId, meta) => {
                set((state) => ({
                    paginationMeta: {
                        ...state.paginationMeta,
                        [chatId]: {
                            ...(state.paginationMeta[chatId] || {}),
                            ...meta
                        }
                    }
                }))
            },

            setLoadingMore: (chatId, isLoading) => {
                set((state) => ({
                    paginationMeta: {
                        ...state.paginationMeta,
                        [chatId]: {
                            ...(state.paginationMeta[chatId] || {}),
                            isLoadingMore: isLoading
                        }
                    }
                }))
            },

            prependMessages: (chatId, messages) => {
                set((state) => ({
                    userMessages: {
                        ...state.userMessages,
                        [chatId]: [
                            ...messages,
                            ...(state.userMessages[chatId] || [])
                        ]
                    }
                }))
            },

            replaceMessage: (chatId, tempId, message) => {
                set((state) => ({
                    userMessages: {
                        ...state.userMessages,
                        [chatId]:
                            state.userMessages[chatId].map((chat) => (
                                chat._id === tempId ? message : chat
                            ))

                    }
                }))
            },

            removeMessage: (chatId, messageId) => {
                set((state) => ({
                    userMessages: {
                        ...state.userMessages,
                        [chatId]: state.userMessages[chatId].filter(message => message._id !== messageId)
                    }
                }))
            },

            updateSeenStatus: (chatId, messageId, seenStatus) => {
                set((state) => ({
                    userMessages: {
                        ...state.userMessages,
                        [chatId]: state.userMessages[chatId].map((message) => {
                            if (message._id === messageId) {
                                message.status = seenStatus
                            }
                            return message
                        })
                    }
                }))
            },

            currentChatId: null,

            setCurrentChatId: (chatId) => (
                set({
                    currentChatId: chatId
                })
            ),

            userChats: [],

            setUserChats: (chats) => {
                set({
                    userChats: chats
                })
            },

            addChat: (chat) => {
                set((state) => (
                    {
                        userChats: [
                            ...state.userChats,
                            chat
                        ]
                    }
                ))
            },

            tempChat: {},

            setTempChat: (chat) => {
                set({
                    tempChat: chat
                })
            },

            removeChat: (chatId) => {
                set((state) => ({
                    userChats: state.userChats.filter(chat => chat._id !== chatId)
                }))
            },

            shiftChatAtFirstPosition: (chatId) => {
                set((state) => {
                    let chat = state.userChats.find(c => c._id === chatId)
                    let chats = state.userChats.filter(c => c._id !== chatId)

                    return {
                        userChats: [chat, ...chats]
                    }

                })
            },

            updateLastMessage: (chatId, message) => {
                set((state) => ({
                    userChats: state.userChats?.map((chat) => {
                        if (chat._id === chatId) {
                            return {
                                ...chat,
                                lastMessage: message
                            }
                        }
                        return chat
                    })
                }
                ))
            },

            userSearch: [],

            setUserSearch: (users) => {
                set({
                    userSearch: users
                })
            },

            resetUserSearch: () => {
                set({
                    userSearch: []
                })
            },

            chatUsersInfo: {},

            setChatUsersInfo: (chats) => {
                set({
                    chatUsersInfo: chats.reduce((acc, chat) => {
                        acc[chat._id] = {
                            typing: false,
                            typers: [],
                            newMessages: chat.unreadMessagesCount || 0,
                            online: false,
                            time: "",
                            newReactions: 0,
                            notifications: 0
                        }

                        return acc;
                    }, {})
                })
            },

            incrementNewMessagesCount: (chatId, time = null) => {
                set((state) => ({
                    chatUsersInfo: {
                        ...state.chatUsersInfo,
                        [chatId]: {
                            ...state.chatUsersInfo[chatId],
                            newMessages: state.chatUsersInfo[chatId].newMessages + 1,
                            time: time && getTime(time) || null
                        }
                    }
                }))
            },

            incrementNewMessagesCountByN: (chatId, count = 0) => {
                set((state) => ({
                    chatUsersInfo: {
                        ...state.chatUsersInfo,
                        [chatId]: {
                            ...state.chatUsersInfo[chatId],
                            newMessages: count,
                        }
                    }
                }))
            },

            resetNewMessagesCount: (chatId) => {
                set((state) => ({
                    chatUsersInfo: {
                        ...state.chatUsersInfo,
                        [chatId]: {
                            ...state.chatUsersInfo[chatId],
                            newMessages: 0
                        }
                    }
                }))
            },

            emitedTyping: false,

            toogleEmitedTyping: (value) => {
                set((state) => ({
                    emitedTyping: value
                }))
            },

            setTypingStatus: (chatId, isTyping) => {
                set((state) => ({
                    chatUsersInfo: {
                        ...state.chatUsersInfo,
                        [chatId]: {
                            ...state.chatUsersInfo[chatId],
                            typing: isTyping
                        }
                    }
                }))
            },

            addTyper: (chatId, typers = []) => {
                set((state) => ({
                    chatUsersInfo: {
                        ...state.chatUsersInfo,
                        [chatId]: {
                            ...state.chatUsersInfo[chatId],
                            typers: [
                                ...state.chatUsersInfo[chatId].typers,
                                typers
                            ]
                        }
                    }
                }))
            },

            removeTyper: (chatId, typerId) => {
                set((state) => ({
                    chatUsersInfo: {
                        ...state.chatUsersInfo,
                        [chatId]: {
                            ...state.chatUsersInfo[chatId],
                            typers: state.chatUsersInfo[chatId].typers.filter(typer => typer._id !== typerId)
                        }
                    }
                }))
            },

            onlineStatus: {},

            setOnlineStatus: (userId, status) => {
                set((state) => ({
                    onlineStatus: {
                        ...state.onlineStatus,
                        [userId]: status
                    }
                }))
            },


            mediaFiles: {},

            currentFile: {},

            addMediaFile: (chatId, file) => {
                set((state) => ({
                    mediaFiles: {
                        ...state.mediaFiles,
                        [chatId]: [
                            ...(state.mediaFiles[chatId]) || [],
                            file
                        ]
                    }
                }))
            },

            removeMediaFile: (chatId, file) => {
                set(state => ({
                    mediaFiles: {
                        ...state.mediaFiles,
                        [chatId]: state.mediaFiles[chatId].filter(media => media.preview !== file.preview)
                    }
                }))
            },

            resetMediaFiles: (chatId) => {
                set(state => ({
                    mediaFiles: {
                        ...state.mediaFiles,
                        [chatId]: []
                    }
                }))
            },

            setCurrentFile: (file) => {
                set({
                    currentFile: file
                })
            },

            currentPreviewFile: null,

            setCurrentPreviewFile: (file) => {
                set({
                    currentPreviewFile: file
                })
            },

            isGroupChat: false,


            setIsGroupChat: (value) => {
                set({
                    isGroupChat: value
                })
            },

            groupChat: null,

            setGroupChat: (chat) => {
                set({
                    groupChat: chat
                })
            },

            isReplying: false,

            setIsReplying: (value) => {
                set({
                    isReplying: value
                })
            },

            messageBeingReplied: null,

            setMessageBeingReplied: (message) => {
                set({
                    messageBeingReplied: message

                })
            },

            reaction: null,

            setReaction: (messageId, reaction) => {
                set({
                    reaction: {
                        messageId,
                        reaction
                    }
                })
            },

            resetReaction: () => {
                set({
                    reaction: null
                })
            },

            usersInfo: {},

            setUsersInfo: (users) => {
                set({
                    usersInfo: users.reduce((acc, user) => {
                        acc[user._id] = {
                            online: false,
                            typing: false,
                        }

                        return acc;
                    }, {})
                })
            }
        }),
        { name: "Chat Store" }
    )
)