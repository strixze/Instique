import {
    Send,
    X
} from 'lucide-react'
import React, { useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { useAssetsStore } from '../../store/useAssetsStore'
import FileUpload from './FileUpload'

function MediaPreview({
    isMedia,
    handleSend = () => { },
    message="",
    setMessage
}) {

    const { resetMediaFiles, currentChatId, mediaFiles, setCurrentFile, currentFile } = useChatStore()
    const { selectFile, toggleSelectFile } = useAssetsStore()
    // const [message, setMessage] = React.useState("")

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');

                .mp-orb::before {
                    content: '';
                    position: absolute;
                    top: 20%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%);
                    pointer-events: none;
                    z-index: 0;
                }

                .mp-close:hover {
                    background: rgba(239,68,68,0.15) !important;
                    border-color: rgba(239,68,68,0.3) !important;
                    transform: scale(1.05);
                }

                .mp-send:hover {
                    transform: translateY(-2px) scale(1.04);
                    box-shadow: 0 6px 20px rgba(99,102,241,0.5) !important;
                }
                .mp-send:active { transform: scale(0.96); }

                .mp-thumbs { scrollbar-width: none; }
                .mp-thumbs::-webkit-scrollbar { display: none; }

                .pb-wrap:hover { transform: scale(1.06); }

                .pb-wrap .pb-remove {
                    opacity: 0;
                    transform: scale(0.7);
                    pointer-events: none;
                    transition: opacity 0.15s, transform 0.15s;
                }
                .pb-wrap:hover .pb-remove {
                    opacity: 1;
                    transform: scale(1);
                    pointer-events: all;
                }

                .pb-add:hover {
                    border-color: rgba(99,102,241,0.5) !important;
                    background: rgba(99,102,241,0.08) !important;
                }

                .mp-message:focus {
                    border-color: rgba(99,102,241,0.45) !important;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
                }
                .mp-message::placeholder { color: #4a4e6a; }
            `}</style>

            {/* Root */}
            <div
                className="mp-orb relative flex flex-col w-full h-full bg-[#0a0b0f] overflow-hidden"
                style={{ fontFamily: "'Sora', sans-serif" }}
            >
                {/* ── Main preview ── */}
                <div className="relative flex flex-1 items-center justify-center z-[1]">

                    {/* Close btn */}
                    <div
                        className="mp-close absolute top-6 left-6 z-10 flex items-center justify-center w-9 h-9 rounded-[10px] cursor-pointer transition-all duration-[180ms]"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => {
                            resetMediaFiles(currentChatId)
                            setCurrentFile(null)
                        }}
                    >
                        <X size={16} color="#e2e4f0" />
                    </div>

                    {/* Image frame */}
                    <div
                        className="flex items-center justify-center max-h-[60vh] rounded-2xl overflow-hidden bg-[#13151d]"
                        style={{
                            width: 'min(480px, 80%)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.12)'
                        }}
                    >
                        <img src={currentFile?.preview} alt="" className="w-full h-full object-contain block" />
                    </div>
                </div>

                {/* ── Bottom strip ── */}
                <div
                    className="flex flex-col items-center justify-center gap-3 px-6 py-4 z-[1] border-t border-white/[0.06]"
                    style={{ background: 'rgba(14,16,24,0.9)', backdropFilter: 'blur(16px)' }}
                >
                    {/* message input + send row */}
                    <div className="flex items-center gap-3 w-full max-w-[520px]">
                        <div className="flex flex-1 items-center gap-2 bg-[#1a1d28] border border-white/[0.06] rounded-[20px] px-1 pr-1.5 transition-all duration-200 focus-within:border-[rgba(99,102,241,0.35)] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e, message)}
                                placeholder="Add a message…"
                                className="mp-message flex-1 bg-transparent border-none outline-none text-[#f1f2f7] text-sm py-3 px-3 transition-all duration-200"
                            />
                        </div>

                        {/* Send */}
                        <button
                            className="mp-send flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-[14px] border-none cursor-pointer transition-all duration-150"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
                            onClick={(e) => handleSend(e, message)}
                        >
                            <Send size={18} color="#fff" />
                        </button>
                    </div>

                    {/* Thumbnails */}
                    <div className="mp-thumbs flex gap-2 items-center overflow-x-auto max-w-[400px] py-1 px-0.5">
                        {mediaFiles[currentChatId] && mediaFiles[currentChatId].map((file, index) => (
                            <PreviewBox file={file} key={file.preview} autoSelect={index} />
                        ))}
                        <PreviewBox key={"xhdsdskffdfdofdo"} />
                    </div>
                </div>
            </div>
        </>
    )
}


const PreviewBox = function ({
    file = null,
    key = null,
    classname,
    autoSelect = ""
}) {

    const { resetMediaFiles, currentChatId, mediaFiles, setCurrentFile, currentFile, removeMediaFile } = useChatStore()
    const { selectFile, toggleSlectFile } = useAssetsStore()
    const [visible, setVisible] = React.useState(false)

    const handlePreviewChange = (file) => {
        setCurrentFile(file)
    }

    const handleRemoveMedia = () => {
        removeMediaFile(currentChatId, file)
    }

    useEffect(() => {
        console.log("INDEX :: ", autoSelect)
        if (autoSelect === 0) {
            setCurrentFile(file)
        }
    }, [])

    if (!file) {
        return (
            <div
                className="pb-add flex-shrink-0 flex items-center justify-center w-[52px] h-[52px] rounded-[10px] cursor-pointer transition-all duration-[180ms]"
                style={{ border: '1.5px dashed rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}
            >
                <FileUpload UploadIcon={"plus"} />
            </div>
        )
    }

    return (
        <div
            key={key}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            className={`pb-wrap relative flex-shrink-0 w-[52px] h-[52px] rounded-[10px] cursor-pointer transition-transform duration-150 border-2 overflow-visible
                ${currentFile?.preview === file?.preview
                    ? 'border-[#6366f1] shadow-[0_0_0_2px_rgba(99,102,241,0.3)]'
                    : 'border-transparent'
                }`}
        >
            {visible && (
                <div
                    className="pb-remove absolute -top-[6px] -right-[6px] z-20 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#ef4444] border-2 border-[#0a0b0f]"
                    onClick={handleRemoveMedia}
                >
                    <X size={9} color="#fff" strokeWidth={3} />
                </div>
            )}

            <img
                onClick={() => handlePreviewChange(file)}
                src={file?.preview}
                alt=""
                className="w-full h-full object-cover rounded-[8px] block"
            />
        </div>
    )
}

export default MediaPreview