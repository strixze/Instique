import React from 'react'
import { authContext } from '../../context/AuthProvider'
import { useContext } from 'react'
import Message from '../message/Message.jsx'
import { ArrowDownCircleIcon, FileUpload, Send, MessageCircle, MoveDown } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore.js'
import { useRef } from 'react'
import MediaPreview from '../message/MediaPreview.jsx'
import SingleFilePreview from '../message/SingleFilePreview.jsx'
import { useState } from 'react'


function ChatWindow({
    activePanel,
}) {

        const context = useContext(authContext);
    const { messages, currentChatId, chatUsersInfo, onlineStatus } = useChatStore();
    const chatContainerRef = useRef(null);
    const messageEndRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [message, setMessage] = useState("");
    const [isMedia, setIsMedia] = useState(false);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsAtBottom(true);
    }

    const handleTyping = (e) => {
        setMessage(e.target.value);
        // Emit typing event via socket
    }

    const handleSend = (e) => {
        e.preventDefault();
        if (message.trim() === "" && !isMedia) return;
        // Emit message via socket
        setMessage("");
        setIsMedia(false);
        
    }

    

  return (
    <div className={`
                    noise-bg relative flex flex-col flex-1 h-full bg-[#0c0e16] overflow-hidden
                     md:flex border-2 border-red-500 rounded-lg
                      `}>

                    {/* Ambient orbs */}
                    <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
                        style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)', filter: 'blur(80px)' }} />
                    <div className="absolute -bottom-20 left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
                        style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.07),transparent 70%)', filter: 'blur(80px)' }} />

                    {context.currentChatUser ? (
                        <>
                            {/* Nav */}
                            <nav className="sticky top-0 z-10 flex items-center gap-3.5 h-16 px-6 border-b border-white/[0.06] bg-[rgba(14,16,24,0.85)] backdrop-blur-xl">
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
                                        {context.currentChatUser.username}
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
  )
}

export default ChatWindow