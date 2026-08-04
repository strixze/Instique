function MessageInfoModal({ show, onClose, msg }) {
    if (!show) return null

    const seenBy = msg?.seenBy || []

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
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                    <h3 className="text-[15px] font-bold text-[#f1f2f7] tracking-tight">Message Info</h3>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 transition-colors"
                    >
                        <X size={14} color="#9ca3c4" />
                    </button>
                </div>

                {/* Meta rows */}
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
                            {msg?.status === 'seen'
                                ? '✓✓ Seen'
                                : msg?.status === 'sent'
                                ? '✓ Sent'
                                : msg?.status === 'uploading'
                                ? '⟳ Uploading'
                                : '—'}
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

                {/* Seen By section */}
                {seenBy.length > 0 && (
                    <div className="border-t border-white/[0.06]">
                        <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                            <span className="text-[12px] text-[#4a4e6a] uppercase tracking-wide font-semibold">
                                Seen by
                            </span>
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
                                const seenDate = member.seenAt
                                    ? new Date(member.seenAt)
                                    : null
                                const isToday = seenDate
                                    ? seenDate.toDateString() === new Date().toDateString()
                                    : false
                                const displayTime = seenDate
                                    ? isToday
                                        ? seenTime
                                        : seenDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + seenTime
                                    : null

                                return (
                                    <div
                                        key={member.id || i}
                                        className="flex items-center gap-3 px-3 py-[9px] rounded-[12px] hover:bg-white/[0.04] transition-colors group"
                                    >
                                        {/* Avatar */}
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ring-1 ring-white/[0.08]"
                                            style={{ background: color.bg, color: color.text }}
                                        >
                                            {member.avatar
                                                ? <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                : getInitials(member.name)
                                            }
                                        </div>

                                        {/* Name + role */}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[13px] text-[#dde0f5] font-medium truncate leading-tight">
                                                {member.name || 'Unknown'}
                                            </span>
                                            {member.role && (
                                                <span className="text-[11px] text-[#4a4e6a] truncate leading-tight mt-[1px]">
                                                    {member.role}
                                                </span>
                                            )}
                                        </div>

                                        {/* Seen time + checkmark */}
                                        <div className="flex items-center gap-[6px] shrink-0">
                                            {displayTime && (
                                                <span className="text-[11px] text-[#4a4e6a] group-hover:text-[#6b7280] transition-colors tabular-nums">
                                                    {displayTime}
                                                </span>
                                            )}
                                            <div className="w-[18px] h-[18px] rounded-full bg-[#0e3d3a] flex items-center justify-center">
                                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                    <path d="M1 3.5L3.5 6L8 1" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Empty state for seen */}
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