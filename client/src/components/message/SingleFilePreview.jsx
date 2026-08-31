import {
    Send,
    X
} from 'lucide-react'
import React, { useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { useAssetsStore } from '../../store/useAssetsStore'
import FileUpload from './FileUpload'

function SingleFilePreview({
 
}) {

    const { resetMediaFiles, currentChatId, mediaFiles, setCurrentFile, currentFile,currentPreviewFile,setCurrentPreviewFile } = useChatStore()
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
                            setCurrentPreviewFile(null)
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
                        <img src={currentPreviewFile} alt="" className="w-full h-full object-contain block" />
                    </div>
                </div>

                {/* ── Bottom strip ── */}
       
            </div>
        </>
    )
}




export default SingleFilePreview