import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useContext } from 'react'
import { authContext } from '../../context/AuthProvider'
import { getTime } from '../../services/getTime'
import {
    CheckIcon,
    CheckCheck,
    Reply,
    Trash2,
    Copy,
    Forward,
    SmilePlus,
    MoreHorizontal,
    X,
    Info,
    ImageIcon,
    ShieldAlert,
    AlertTriangle,
    ExternalLink,
    ShieldX,
    Eye,
    EyeOff,
} from 'lucide-react'
import { userAuthStore } from '../../store/userStore'
import { socket } from '../../socket/socket'
import { socketEvents } from '../../constants/socketEvents'
import { useChatStore } from '../../store/useChatStore'
import { href } from 'react-router-dom'
import { isThisLink } from '../../services/isThisLink'
import { messageApi } from '../../api/message.api'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function useOutsideClick(ref, handler) {
    useEffect(() => {
        const listener = (e) => {
            if (!ref.current || ref.current.contains(e.target)) return
            handler(e)
        }
        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)
        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [ref, handler])
}

/* ─── Suspicious Warning Banner ─────────────────────────────────────────────
   Props:
     type      : 'link' | 'message'   — controls icon + copy
     onDismiss : () => void            — hides the banner
     onProceed : () => void            — for links: open anyway
     isSent    : bool                  — mirrors bubble alignment
──────────────────────────────────────────────────────────────────────────── */
function SuspiciousWarning({ type = 'link', onDismiss, onProceed, isSent }) {
    const isLink = type === 'link'

    const cfg = {
        link: {
            icon: ShieldX,
            iconColor: '#f87171',
            accent: 'rgba(239,68,68,0.12)',
            border: 'rgba(239,68,68,0.28)',
            tag: 'Suspicious Link',
            tagBg: 'rgba(239,68,68,0.14)',
            tagColor: '#f87171',
            headline: 'Potentially dangerous link',
            body: 'This URL may lead to a phishing or malware site. Visiting it could compromise your account or device.',
            proceedLabel: 'Open anyway',
        },
        message: {
            icon: AlertTriangle,
            iconColor: '#fbbf24',
            accent: 'rgba(251,191,36,0.08)',
            border: 'rgba(251,191,36,0.25)',
            tag: 'Suspicious Content',
            tagBg: 'rgba(251,191,36,0.12)',
            tagColor: '#fbbf24',
            headline: 'This message looks suspicious',
            body: 'This message contains patterns commonly found in scams or phishing attempts. Be cautious before acting on any requests.',
            proceedLabel: 'Show message',
        },
    }[type]

    const Icon = cfg.icon

    return (
        <div
            className={`flex ${isSent ? 'justify-end' : 'justify-start'} px-1 mb-1`}
            style={{ animation: 'warnIn 0.22s cubic-bezier(0.16,1,0.3,1)' }}
        >
            <div
                className="relative max-w-[320px] w-full rounded-xl overflow-hidden"
                style={{
                    background: cfg.accent,
                    border: `1px solid ${cfg.border}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}
            >
                {/* Top stripe */}
                <div style={{
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${cfg.iconColor}, transparent)`,
                    opacity: 0.7,
                }} />

                <div className="p-3.5">
                    {/* Header row */}
                    <div className="flex items-start gap-2.5 mb-2.5">
                        {/* Icon container */}
                        <div
                            className="warn-icon-shake flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                background: `rgba(${isLink ? '239,68,68' : '251,191,36'},0.15)`,
                                border: `1px solid ${cfg.border}`,
                            }}
                        >
                            <Icon size={15} color={cfg.iconColor} strokeWidth={2.2} />
                        </div>

                        {/* Title + tag */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-[3px]">
                                <span
                                    className="text-[10px] font-bold uppercase tracking-[0.06em] px-1.5 py-[2px] rounded-md"
                                    style={{ background: cfg.tagBg, color: cfg.tagColor }}
                                >
                                    {cfg.tag}
                                </span>
                            </div>
                            <p className="text-[12.5px] font-semibold text-text-primary leading-snug">
                                {cfg.headline}
                            </p>
                        </div>

                        {/* Dismiss X */}
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-colors duration-150 bg-white/[0.05] hover:bg-white/10"
                        >
                            <X size={11} className="text-text-muted" />
                        </button>
                    </div>

                    {/* Body */}
                    <p className="text-[11.5px] text-text-muted leading-[1.55] mb-3">
                        {cfg.body}
                    </p>

                    {/* Action row */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onProceed}
                            className="flex items-center gap-1.5 px-3 py-[6px] rounded-lg text-[11.5px] font-medium transition-all duration-150 bg-white/[0.05] text-text-secondary border border-white/[0.07] hover:bg-white/[0.09] hover:text-text-primary"
                        >
                            {isLink
                                ? <ExternalLink size={11} strokeWidth={2} />
                                : <Eye size={11} strokeWidth={2} />
                            }
                            {cfg.proceedLabel}
                        </button>

                        <button
                            onClick={onDismiss}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-[6px] rounded-lg text-[11.5px] font-semibold transition-all duration-150"
                            style={{
                                background: isLink ? 'rgba(239,68,68,0.14)' : 'rgba(251,191,36,0.12)',
                                color: cfg.iconColor,
                                border: `1px solid ${cfg.border}`,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = isLink ? 'rgba(239,68,68,0.22)' : 'rgba(251,191,36,0.2)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = isLink ? 'rgba(239,68,68,0.14)' : 'rgba(251,191,36,0.12)'
                            }}
                        >
                            <ShieldAlert size={11} strokeWidth={2} />
                            Stay safe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Context menu ─── */
function MessageContextMenu({ open, isSent, onAction, onClose, anchorRef }) {
    const menuRef = useRef(null)
    useOutsideClick(menuRef, onClose)
    const [pos, setPos] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (!open || !anchorRef.current || !menuRef.current) return
        const bubble = anchorRef.current.getBoundingClientRect()
        const menu = menuRef.current.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        let top = bubble.bottom + 6
        let left = isSent ? bubble.right - menu.width : bubble.left
        if (top + menu.height > vh - 16) top = bubble.top - menu.height - 6
        if (left + menu.width > vw - 8) left = vw - menu.width - 8
        if (left < 8) left = 8
        setPos({ top, left })
    }, [open])

    if (!open) return null

    const actions = [
        { id: 'reply', icon: Reply, label: 'Reply', always: true },
        { id: 'copy', icon: Copy, label: 'Copy', always: true },
        { id: 'forward', icon: Forward, label: 'Forward', always: true },
        { id: 'info', icon: Info, label: 'Info', onlySent: true },
        { id: 'delete', icon: Trash2, label: 'Delete', onlySent: true, danger: true },
    ].filter(a => a.always || (a.onlySent && isSent))

    return (
        <div
            ref={menuRef}
            className="fixed z-[999] min-w-[168px] rounded-[14px] overflow-hidden border border-white/[0.08] bg-[#1a1d2e] shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            style={{ top: pos.top, left: pos.left, animation: 'ctxIn 0.15s cubic-bezier(0.16,1,0.3,1)' }}
        >
            <style>{`
                @keyframes ctxIn {
                    from { opacity:0; transform:scale(0.93) translateY(-4px); }
                    to   { opacity:1; transform:scale(1) translateY(0); }
                }
            `}</style>
            {actions.map((a, i) => (
                <button
                    key={a.id}
                    onClick={() => { onAction(a.id); onClose() }}
                    className={[
                        'flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium transition-colors duration-100',
                        a.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-[#c4c6e7] hover:bg-white/[0.06]',
                        i !== 0 ? 'border-t border-white/[0.04]' : ''
                    ].join(' ')}
                >
                    <a.icon size={14} strokeWidth={2} />
                    {a.label}
                </button>
            ))}
        </div>
    )
}

/* ─── Emoji bar ─── */
function EmojiBar({ show, isSent, onPick }) {
    if (!show) return null
    return (
        <div
            className={[
                'absolute -top-9 flex items-center gap-0.5 px-2 py-1 rounded-full border border-white/[0.08] bg-[#1a1d2e]/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
                isSent ? 'right-0' : 'left-0',
            ].join(' ')}
            style={{ animation: 'emojiBarIn 0.18s cubic-bezier(0.16,1,0.3,1)', zIndex: 10 }}
        >
            <style>{`
                @keyframes emojiBarIn {
                    from { opacity:0; transform:translateY(6px) scale(0.88); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
                }
            `}</style>
            {QUICK_EMOJIS.map((em) => (
                <button key={em} onClick={() => onPick(em)}
                    className="w-7 h-7 flex items-center justify-center text-base rounded-full hover:bg-white/10 transition-all duration-100 hover:scale-125 active:scale-110">
                    {em}
                </button>
            ))}
        </div>
    )
}

/* ─── Reaction chips ─── */
function ReactionChips({ reactions = [], isSent, msg }) {
    if (!reactions || reactions.length === 0) return null
    const grouped = reactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1
        return acc
    }, {})
    return (
        <div className={`flex flex-wrap gap-1 mt-0.5 ${isSent ? 'justify-end' : 'justify-start'}`}>
            {reactions && reactions.length > 0 && Object.entries(grouped).map(([emoji, count], index) => (
                <span key={emoji} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border border-white/[0.1] bg-[#1a1d2e] text-[#c4c6e7] shadow-sm">
                    {emoji || msg.reactions[0]?.emoji} {count > 1 && <span className="text-[10px] text-[#818cf8]">{count}</span>}
                </span>
            ))}
        </div>
    )
}

/* ─── Reply Quote ─── */
function ReplyQuote({ reply, isSent }) {
    if (!reply) return null

    const hasThumb = reply?.attachments?.length > 0
    const thumbUrl = hasThumb
        ? (reply.attachments[0]?.secure_url || reply.attachments[0]?.preview)
        : null
    const hasText = reply?.message?.trim()

    return (
        <div
            className={[
                'mx-2.5 mt-2.5 mb-1.5 rounded-[10px] overflow-hidden flex items-stretch',
                'cursor-pointer select-none transition-opacity duration-150 active:opacity-70',
                isSent ? 'bg-white/[0.12]' : 'bg-black/[0.20]',
            ].join(' ')}
            style={{ borderLeft: isSent ? '3px solid rgba(255,255,255,0.45)' : '3px solid #6366f1' }}
        >
            <div className="flex flex-col justify-center flex-1 min-w-0 px-2.5 py-[7px]">
                <span className={[
                    'flex items-center gap-[5px] text-[10.5px] font-bold leading-none mb-[4px]',
                    isSent ? 'text-white/55' : 'text-[#818cf8]'
                ].join(' ')}>
                    <Reply size={9} strokeWidth={2.8} style={{ transform: 'scaleX(-1)', flexShrink: 0 }} />
                    {reply.senderName || 'Message'}
                </span>
                <span className={[
                    'text-[11.5px] leading-[1.4] truncate',
                    isSent ? 'text-white/45' : 'text-[#71788f]'
                ].join(' ')}>
                    {hasThumb ? (
                        <span className="inline-flex items-center gap-1">
                            <ImageIcon size={10} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.75 }} />
                            {hasText ? reply.message : 'Photo'}
                        </span>
                    ) : (
                        reply.message
                    )}
                </span>
            </div>
            {thumbUrl && (
                <div className="w-[44px] flex-shrink-0 self-stretch">
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                </div>
            )}
        </div>
    )
}

/* ─── Delete modal ─── */
function DeleteModal({ show, onClose, onDeleteForMe, onDeleteForEveryone }) {
    if (!show) return null
    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
            style={{ animation: 'fadeIn 0.15s ease' }}>
            <style>{`
                @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
            `}</style>
            <div className="w-full max-w-sm rounded-[20px] bg-[#1a1d2e] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                style={{ animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[15px] font-bold text-[#f1f2f7] tracking-tight">Delete message?</h3>
                        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 transition-colors">
                            <X size={14} color="#9ca3c4" />
                        </button>
                    </div>
                    <p className="text-[12.5px] text-[#4a4e6a] leading-relaxed">This action cannot be undone.</p>
                </div>
                <div className="px-3 pb-4 flex flex-col gap-2">
                    <button onClick={onDeleteForEveryone}
                        className="w-full py-3 rounded-[12px] text-[13.5px] font-semibold text-white bg-gradient-to-r from-red-500/90 to-rose-600/90 hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-[0_4px_14px_rgba(239,68,68,0.3)]">
                        Delete for everyone
                    </button>
                    <button onClick={onDeleteForMe}
                        className="w-full py-3 rounded-[12px] text-[13.5px] font-medium text-[#c4c6e7] bg-white/[0.06] hover:bg-white/[0.09] active:scale-[0.98] transition-all duration-150">
                        Delete for me
                    </button>
                    <button onClick={onClose}
                        className="w-full py-2.5 rounded-[12px] text-[12.5px] font-medium text-[#4a4e6a] hover:text-[#c4c6e7] transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

function MessageInfoModal({ show, onClose, msg }) {
    if (!show) return null
    return (
        <div className={`fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0`}
            style={{ animation: 'fadeIn 0.15s ease' }}>
            <div className="w-full max-w-sm rounded-[20px] bg-[#1a1d2e] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                style={{ animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                    <h3 className="text-[15px] font-bold text-[#f1f2f7] tracking-tight">Message Info</h3>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 transition-colors">
                        <X size={14} color="#9ca3c4" />
                    </button>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">Sent</span>
                        <span className="text-[13px] text-[#c4c6e7]">{msg?.createdAt ? new Date(msg.createdAt).toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">Status</span>
                        <span className={`text-[13px] font-medium ${msg?.status === 'seen' ? 'text-[#a5f3fc]' : 'text-[#818cf8]'}`}>
                            {msg?.status === 'seen' ? '✓✓ Seen' : msg?.status === 'sent' ? '✓ Sent' : msg?.status === 'uploading' ? '⟳ Uploading' : '—'}
                        </span>
                    </div>
                    {msg?.attachments?.length > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">Attachments</span>
                            <span className="text-[13px] text-[#c4c6e7]">{msg.attachments.length} file{msg.attachments.length > 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function MessageInfoModalGroup({ show, onClose, msg, seenBy }) {
    if (!show) return null

    useEffect(() => {
        console.log("Seen By in Modal: ", seenBy)
    }, [])

    const getInitials = (name = '') =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const avatarColors = [
        { bg: '#1e2a3a', text: '#60a5fa' },
        { bg: '#1e2d2b', text: '#34d399' },
        { bg: '#2d1e2d', text: '#c084fc' },
        { bg: '#2d2318', text: '#fbbf24' },
        { bg: '#2d1e22', text: '#f87171' },
        { bg: '#1a2535', text: '#818cf8' },
    ]

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
            style={{ animation: 'fadeIn 0.15s ease' }}
        >
            <div
                className="w-full max-w-sm rounded-[20px] bg-[#1a1d2e] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                style={{ animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)' }}
            >
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                    <h3 className="text-[15px] font-bold text-[#f1f2f7] tracking-tight">Message Info</h3>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 transition-colors">
                        <X size={14} color="#9ca3c4" />
                    </button>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">Sent</span>
                        <span className="text-[13px] text-[#c4c6e7]">
                            {msg?.createdAt ? new Date(msg.createdAt).toLocaleString() : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">Status</span>
                        <span className={`text-[13px] font-medium ${msg?.status === 'seen' ? 'text-[#a5f3fc]' : 'text-[#818cf8]'}`}>
                            {msg?.status === 'seen' ? '✓✓ Seen' : msg?.status === 'sent' ? '✓ Sent' : msg?.status === 'uploading' ? '⟳ Uploading' : '—'}
                        </span>
                    </div>
                    {msg?.attachments?.length > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">Attachments</span>
                            <span className="text-[13px] text-[#c4c6e7]">
                                {msg.attachments.length} file{msg.attachments.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
                {seenBy.length > 0 && (
                    <div className="border-t border-white/[0.06]">
                        <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                            <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">Seen by</span>
                            <span className="text-[11px] text-[#4a4e6a] font-medium tabular-nums">
                                {seenBy.length} member{seenBy.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="px-5 pb-5 pt-2 flex flex-col gap-[2px]">
                            {seenBy.map((member, i) => {
                                const color = avatarColors[i % avatarColors.length]
                                const seenTime = member.seenAt
                                    ? new Date(member.seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : null
                                const seenDate = member.seenAt ? new Date(member.seenAt) : null
                                const isToday = seenDate ? seenDate.toDateString() === new Date().toDateString() : false
                                const displayTime = seenDate
                                    ? isToday ? seenTime : seenDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + seenTime
                                    : null
                                return (
                                    <div key={member.id || i} className="flex items-center gap-3 px-3 py-[9px] rounded-[12px] hover:bg-white/[0.04] transition-colors group">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ring-1 ring-white/[0.08]"
                                            style={{ background: color.bg, color: color.text }}>
                                            {member.avtar
                                                ? <img src={member.avtar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                : getInitials(member.name)
                                            }
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[13px] text-[#dde0f5] font-medium truncate leading-tight">{member.name || 'Unknown'}</span>
                                            {member.role && (
                                                <span className="text-[11px] text-[#4a4e6a] truncate leading-tight mt-[1px]">{member.role}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-[6px] shrink-0">
                                            {displayTime && (
                                                <span className="text-[11px] text-[#4a4e6a] group-hover:text-[#6b7280] transition-colors tabular-nums">{displayTime}</span>
                                            )}
                                            <div className="w-[18px] h-[18px] rounded-full bg-[#0e3d3a] flex items-center justify-center">
                                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                    <path d="M1 3.5L3.5 6L8 1" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                {seenBy.length === 0 && msg?.status !== 'uploading' && (
                    <div className="border-t border-white/[0.06] px-5 py-4">
                        <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold block mb-2">Seen by</span>
                        <p className="text-[12px] text-[#3a3e58] italic">Not seen by anyone yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   MAIN Message component
───────────────────────────────────────────────────────────── */
function Message({ msg, key, isGroupChat, onReply = () => { } }) {

    const context = useContext(authContext)
    const { user } = userAuthStore()
    const {
        resetNewMessagesCount,
        setCurrentPreviewFile,
        currentPreviewFile,
        removeMessage,
        isReplying,
        setIsReplying,
        messageBeingReplied,
        setMessageBeingReplied,
        reaction,
        setReaction,
        resetReaction
    } = useChatStore()

    const messageRef = useRef(null)
    const bubbleRef = useRef(null)

    const [showMenu, setShowMenu] = useState(false)
    const [showEmojiBar, setShowEmojiBar] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showInfoModal, setShowInfoModal] = useState(false)
    const [showInfoModalGroup, setShowInfoModalGroup] = useState(false)
    const [reactions, setReactions] = useState(msg?.reactions || [])
    const [copied, setCopied] = useState(false)

    // ── Suspicious warning state ──────────────────────────────────────
    // Set isSuspiciousLink / isSuspiciousMessage to true to show the warning.
    // Replace these with your real detection logic later.
    const [isSuspiciousLink, setIsSuspiciousLink] = useState(false)       // ← wire your detection here
    const [isSuspiciousMessage, setIsSuspiciousMessage] = useState(false) // ← wire your detection here
    const [warningDismissed, setWarningDismissed] = useState(false)
    const [proceedAnyway, setProceedAnyway] = useState(false)
    // ─────────────────────────────────────────────────────────────────

    const longPressTimer = useRef(null)
    const longPressTriggered = useRef(false)

    const senderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender
    const isSent = senderId === user._id
    const senderName = typeof msg.sender === 'object' ? (msg.sender?.username || msg.sender?.name) : ''
    const hasImage = msg?.attachments?.length > 0
    const hasText = msg?.message && msg.message.trim() !== ""
    const hasReply = !!msg?.reply
    const [isLink, setIsLink] = useState(false)

    const [seenBy, setSeenBy] = useState([])

    // Derived: should we show the warning banner?
    const showLinkWarning = isSuspiciousLink && !warningDismissed && !proceedAnyway && isLink
    const showMessageWarning = isSuspiciousMessage && !warningDismissed && !proceedAnyway && !isLink

    /* ── Sync reactions from updated message ── */
    useEffect(() => {
        setReactions(msg?.reactions || [])
    }, [msg?.reactions])

    const getSeenMembers = async () => {
        const res = await messageApi.getSeenMembers(msg._id)
        if (res.success) {
            console.log("Seen members :: ", res.data)
            setSeenBy(res.data)
        }
    }

    useEffect(() => {
        if (showInfoModalGroup) getSeenMembers()
    }, [showInfoModalGroup])

    /* ── Intersection observer (seen) ── */
    useEffect(() => {
        if (senderId === user._id) return
        if (msg.status === "seen") return
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (isGroupChat) {
                            socket.emit(socketEvents.MESSAGE_SEEN_GROUP_CHAT, { messageId: msg._id, chatId: msg.chatId })
                        } else {
                            socket.emit(socketEvents.MESSAGE_SEEN_SINGLE_CHAT, { messageId: msg._id, chatId: msg.chatId })
                        }
                        resetNewMessagesCount(msg.chatId)
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.6 }
        )
        if (messageRef.current) observer.observe(messageRef.current)
        return () => observer.disconnect()
    }, [msg._id])

    useEffect(() => {
        if (showMenu) setShowEmojiBar(false)
    }, [showMenu])

    useEffect(() => {
        let is = isThisLink(msg.message)
        setIsLink(is)
    }, [])

    const handleTouchStart = useCallback(() => {
        longPressTriggered.current = false
        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true
            setShowMenu(true)
        }, 500)
    }, [])

    const handleTouchEnd = useCallback(() => { clearTimeout(longPressTimer.current) }, [])
    const handleTouchMove = useCallback(() => { clearTimeout(longPressTimer.current) }, [])

    const handleAction = (actionId) => {
        switch (actionId) {
            case 'reply':
                if (onReply) onReply(msg)
                setIsReplying(true)
                setMessageBeingReplied(msg)
                break
            case 'copy':
                if (msg.message) {
                    navigator.clipboard.writeText(msg.message).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1800)
                    })
                }
                break
            case 'forward':
                socket.emit(socketEvents.FORWARD_MESSAGE || 'forward_message', { messageId: msg._id })
                break
            case 'info':
                if (isGroupChat) setShowInfoModalGroup(true)
                else setShowInfoModal(true)
                break
            case 'delete':
                setShowDeleteModal(true)
                break
            default:
                break
        }
    }

    const handleDeleteForMe = async () => {
        const res = await messageApi.deleteForMe(msg._id)
        if (res.success) {
            console.log("Delete :: ", msg.chatId, msg._id)
            removeMessage(msg.chatId, msg._id)
        }
        setShowDeleteModal(false)
    }

    const handleDeleteForEveryone = async () => {
        const res = await messageApi.deleteForEveryone(msg._id)
        if (res.success) {
            console.log("Delete :: ", msg.chatId, msg._id)
            removeMessage(msg.chatId, msg._id)
        }
        setShowDeleteModal(false)
    }

    const handleEmojiPick = (emoji) => {
        setReaction(msg._id, emoji)
        setReactions(prev => {
            const existing = prev.find(r => r.userId === user._id && r.emoji === emoji)
            if (existing) return prev.filter(r => !(r.userId === user._id && r.emoji === emoji))
            return [...prev.filter(r => r.userId !== user._id), { userId: user._id, emoji }]
        })
        setShowEmojiBar(false)
        socket.emit(socketEvents.REACT_MESSAGE_SINGLE_CHAT, {
            messageId: msg._id,
            chatId: msg.chatId,
            emoji,
            to: senderId === user._id ? "receiver" : "sender"
        })
        resetReaction()
    }

    const hoverTimer = useRef(null)
    const handleMouseEnter = () => { hoverTimer.current = setTimeout(() => setShowEmojiBar(true), 400) }
    const handleMouseLeave = () => { clearTimeout(hoverTimer.current); setShowEmojiBar(false) }

    // Handle indicator messages
    if (msg?.isIndicator) {
        return (
            <div className="flex justify-center my-3">
                <div className="text-[12px] text-gray-400 bg-gray-700/40 px-3 py-1 rounded-full">
                    {msg.message}
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @keyframes msgIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes replyQuoteIn {
                    from { opacity: 0; transform: scaleY(0.8); transform-origin: top; }
                    to   { opacity: 1; transform: scaleY(1); }
                }
                @keyframes warnIn {
                    from { opacity: 0; transform: translateY(6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes warnShake {
                    0%,100% { transform: translateX(0); }
                    20%     { transform: translateX(-3px); }
                    40%     { transform: translateX(3px); }
                    60%     { transform: translateX(-2px); }
                    80%     { transform: translateX(2px); }
                }
                .warn-icon-shake { animation: warnShake 0.5s ease 0.1s; }
            `}</style>

            {/* ── Suspicious warning banner — renders ABOVE the bubble row ── */}
            {(showLinkWarning || showMessageWarning) && (
                <SuspiciousWarning
                    type={showLinkWarning ? 'link' : 'message'}
                    isSent={isSent}
                    onDismiss={() => setWarningDismissed(true)}
                    onProceed={() => setProceedAnyway(true)}
                />
            )}

            {/* Row */}
            <div
                ref={messageRef}
                key={key}
                className={[
                    'flex mb-1.5 px-1 group select-none',
                    isSent ? 'justify-end' : 'justify-start',
                    'animate-[msgIn_0.2s_ease]'
                ].join(' ')}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Action btn — left (received) */}
                {!isSent && (
                    <div className="flex items-center mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 self-end pb-1">
                        <button
                            onClick={() => setShowMenu(v => !v)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/10 transition-colors"
                        >
                            <MoreHorizontal size={13} color="#4a4e6a" />
                        </button>
                    </div>
                )}

                {/* Bubble column */}
                <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[65%]`}>
                    {isGroupChat && !isSent && senderName && (
                        <span className="text-[11px] font-semibold mb-[3px] ml-1 text-[#818cf8] leading-none">
                            {senderName}
                        </span>
                    )}
                    <div className="relative">
                        <EmojiBar show={showEmojiBar} isSent={isSent} onPick={handleEmojiPick} />

                        {/* Bubble */}
                        <div
                            ref={bubbleRef}
                            className={[
                                'relative min-w-[72px] rounded-2xl overflow-hidden break-words whitespace-pre-wrap',
                                'shadow-md',
                                isSent
                                    ? 'text-white rounded-br-md bg-gradient-to-br from-accent to-violet'
                                    : 'bg-surface-600 text-text-primary rounded-bl-md border border-white/[0.06]',
                                msg.status === 'uploading' ? 'opacity-75' : '',
                                // Dim suspicious content that hasn't been explicitly unlocked
                                (isSuspiciousLink || isSuspiciousMessage) && !proceedAnyway && !warningDismissed
                                    ? 'blur-[1.5px] pointer-events-none select-none'
                                    : '',
                            ].join(' ')}
                        >
                            {/* ── Reply Quote ── */}
                            {hasReply && (
                                <div style={{ animation: 'replyQuoteIn 0.16s ease' }}>
                                    <ReplyQuote reply={msg.reply} isSent={isSent} />
                                </div>
                            )}

                            {/* Image */}
                            {hasImage && (
                                <div
                                    onClick={() => {
                                        if (!longPressTriggered.current) {
                                            setCurrentPreviewFile(msg.attachments[0]?.secure_url || msg.attachments[0]?.preview)
                                        }
                                    }}
                                    className="relative w-full min-w-[180px] max-w-[320px] cursor-pointer"
                                >
                                    <img
                                        className="block w-full object-cover rounded-[inherit]"
                                        src={msg.attachments[0]?.preview || msg.attachments[0]?.secure_url}
                                        alt=""
                                        draggable={false}
                                    />
                                    {msg.status === "uploading" && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[4px] rounded-[inherit]">
                                            <div className="w-8 h-8 rounded-full border-[3px] border-white/15 border-t-[#818cf8] animate-spin" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Text */}
                            {hasText && (isLink ?
                                <div className={`text-[13.5px] leading-[1.55] px-3.5 pt-2.5 font-[Sora,sans-serif] ${!hasImage ? 'pb-[26px]' : 'pb-6'} text-blue-300 hover:underline`}>
                                    <a href={msg.message} target='_blank'>{msg.message}</a>
                                </div> :
                                <div className={`text-[13.5px] leading-[1.55] px-3.5 pt-2.5 font-[Sora,sans-serif] ${!hasImage ? 'pb-[26px]' : 'pb-6'}`}>
                                    {msg.message}
                                </div>
                            )}

                            {/* Meta */}
                            <div className={[
                                'absolute bottom-[5px] right-[10px] flex items-center gap-[3px]',
                                hasImage && !hasText ? 'bg-black/45 backdrop-blur-[6px] rounded-[20px] px-[7px] py-[2px]' : ''
                            ].join(' ')}>
                                {msg?.createdAt && (
                                    <span className="font-[JetBrains_Mono,monospace] text-[10.5px] opacity-65 tracking-[-0.3px]" style={{ color: 'inherit' }}>
                                        {getTime(msg.createdAt)}
                                    </span>
                                )}
                                {isSent && (
                                    <>
                                        {msg.status === "sent" && <CheckIcon size={13} className="text-white/50" />}
                                        {msg.status === "seen" && <CheckCheck size={13} className="text-[#a5f3fc]" />}
                                    </>
                                )}
                            </div>
                        </div>

                        <ReactionChips reactions={reactions} isSent={isSent} msg={msg} />
                    </div>
                </div>

                {/* Action btn — right (sent) */}
                {isSent && (
                    <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 self-end pb-1">
                        <button
                            onClick={() => setShowMenu(v => !v)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/10 transition-colors"
                        >
                            <MoreHorizontal size={13} color="#4a4e6a" />
                        </button>
                    </div>
                )}
            </div>

            {/* Copied toast */}
            {copied && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[999] px-4 py-2 rounded-full text-[12px] font-medium text-white bg-[#1a1d2e] border border-white/10 shadow-lg backdrop-blur-sm"
                    style={{ animation: 'ctxIn 0.15s ease' }}>
                    Copied to clipboard
                </div>
            )}

            <MessageContextMenu
                open={showMenu}
                isSent={isSent}
                onAction={handleAction}
                onClose={() => setShowMenu(false)}
                anchorRef={bubbleRef}
            />

            <DeleteModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onDeleteForMe={handleDeleteForMe}
                onDeleteForEveryone={handleDeleteForEveryone}
            />

            <MessageInfoModal
                show={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                msg={msg}
            />

            <MessageInfoModalGroup
                show={showInfoModalGroup}
                onClose={() => setShowInfoModalGroup(false)}
                msg={msg}
                seenBy={seenBy}
            />
        </>
    )
}

export default Message