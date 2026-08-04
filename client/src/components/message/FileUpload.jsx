import { Paperclip, Plus } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { useAssetsStore } from '../../store/useAssetsStore'

function FileUpload({
    UploadIcon = ""
}) {

    const fileInputRef = useRef(null)
    const { addMediaFile, mediaFiles, currentChatId } = useChatStore()
    const { selectFile, toggleSlectFile } = useAssetsStore()

    const handleClick = () => {
        fileInputRef.current.click()
    }

    const handleChange = (e) => {
        const files = e.target.files

        Array.from(files).forEach((file) => {
            console.log("FILE FOR URL :: ", file)
            addMediaFile(currentChatId, {
                file,
                preview: URL.createObjectURL(file),
                progress: 0,
                uploading: true
            })
        })

        console.log('File Selected :: ', e.target.files)
        e.target.value = null
    }

    useEffect(() => {
        console.log("Media Files :: ", mediaFiles)
    }, [mediaFiles])

    useEffect(() => {
        if (selectFile) {
            handleClick()
            toggleSlectFile(false)
        }
    }, [selectFile])

    return (
        <>
            <style>{`
                .fu-paperclip-btn {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    cursor: pointer;
                    color: #4a4e6a;
                    transition: color 0.18s, background 0.18s;
                    flex-shrink: 0;
                }

                .fu-paperclip-btn:hover {
                    color: #818cf8;
                    background: rgba(99,102,241,0.1);
                }

                .fu-plus-btn {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    cursor: pointer;
                    color: #4a4e6a;
                    transition: color 0.18s, background 0.18s;
                }

                .fu-plus-btn:hover {
                    color: #818cf8;
                    background: rgba(99,102,241,0.1);
                }
            `}</style>

            {UploadIcon === "plus" ? (
                <div className="fu-plus-btn" onClick={handleClick}>
                    <Plus size={18} />
                </div>
            ) : (
                <div className="fu-paperclip-btn" onClick={handleClick}>
                    <Paperclip size={18} />
                </div>
            )}

            <input
                type="file"
                multiple
                className="hidden"
                onChange={handleChange}
                ref={fileInputRef}
            />
        </>
    )
}

export default FileUpload