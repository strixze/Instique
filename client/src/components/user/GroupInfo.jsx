import React, { useState } from 'react'
import {
    X, ChevronLeft, Camera, Crown, Shield, UserPlus, UserMinus,
    MoreVertical, Search, Bell, BellOff, LogOut, Trash2,
    Check, Copy, Link2, Users, Lock, Globe, ChevronRight,
    Image, FileText, Hash, Settings, Edit3
} from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'
import { useGroupChatStore } from '../../store/useGroupChatStore'
import { useRef } from 'react'
import { useEffect } from 'react'
import { groupApi } from '../../api/group.api'
import { useParams } from 'react-router-dom'
import { userAuthStore } from '../../store/userStore'
import { chatApi } from '../../api/chat.api'
import { socket } from '../../socket/socket'
import { socketEvents } from '../../constants/socketEvents'
import Swal from "sweetalert2"
import { useGroup } from '../../hooks/useGroup'

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_MEMBERS = [
    { _id: '1', username: 'alexmontoya', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', role: 'owner', online: true },
    { _id: '2', username: 'sarahkim', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', role: 'admin', online: true },
    { _id: '3', username: 'devraj_p', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev', role: 'member', online: false },
    { _id: '4', username: 'luna_west', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luna', role: 'member', online: true },
    { _id: '5', username: 'marcus.t', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus', role: 'member', online: false },
    { _id: '6', username: 'priya_s', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', role: 'member', online: true },
]



// const {
//         userSearch,
//         setUserSearch,
//         setChatUsersInfo,
//         chatUsersInfo,
//         emitedTyping,
//         toogleEmitedTyping,
//         onlineStatus,
//         incrementNewMessagesCount,
//         incrementNewMessagesCountByN,
//         resetNewMessagesCount,
//         mediaFiles,
//         removeMessage,
//         resetMediaFiles,
//         setCurrentPreviewFile,
//         currentPreviewFile,
//         isGroupChat,
//         groupChat,
//     } = useChatStore()

const MOCK_GROUP = {}

const CURRENT_USER_ID = '1'

// ─── Role Badge ────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
    if (role === 'owner') return (
        <span className="inline-flex items-center gap-[3px] text-[9.5px] font-bold tracking-[0.4px] px-[7px] py-[2px] rounded-full bg-yellow-400/[0.13] text-yellow-400 border border-yellow-400/25">
            <Crown size={9} strokeWidth={2.5} /> Owner
        </span>
    )
    if (role === 'admin') return (
        <span className="inline-flex items-center gap-[3px] text-[9.5px] font-bold tracking-[0.4px] px-[7px] py-[2px] rounded-full bg-indigo-500/[0.15] text-[#818cf8] border border-indigo-500/[0.28]">
            <Shield size={9} strokeWidth={2.5} /> Admin
        </span>
    )
    return null
}

// ─── Toggle ────────────────────────────────────────────────────────────────
const Toggle = ({ on, toggle }) => (
    <div
        onClick={toggle}
        className={`relative w-9 h-5 rounded-full cursor-pointer flex-shrink-0 transition-all duration-200 ${on ? 'bg-gradient-to-br from-indigo-500 to-violet-500' : 'bg-white/10'
            }`}
    >
        <div className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${on ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
)

// ─── Shared sub-view header ────────────────────────────────────────────────
const SubHeader = ({ title, onBack, action }) => (
    <>
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
            <button
                onClick={onBack}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a4e6a] hover:text-[#818cf8] hover:bg-white/[0.05] transition-all"
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-[15px] font-bold tracking-tight text-[#f1f2f7]">{title}</span>
            {action && <div className="ml-auto">{action}</div>}
        </div>
        <div className="h-px bg-white/[0.06] mx-5" />
    </>
)

// ─── Section label ─────────────────────────────────────────────────────────
const SectionLabel = ({ children, danger }) => (
    <p className={`text-[10px] font-semibold tracking-[1px] uppercase px-3 pb-[5px] mt-[10px] ${danger ? 'text-red-400' : 'text-[#4a4e6a]'}`}>
        {children}
    </p>
)

// ─── Generic action row ────────────────────────────────────────────────────
const ActionRow = ({ onClick, iconBg, icon, label, sublabel, right, danger }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-[10px] px-3 py-[10px] rounded-[10px] cursor-pointer transition-colors duration-150 ${danger ? 'hover:bg-red-400/[0.06]' : 'hover:bg-white/[0.05] active:bg-indigo-500/[0.08]'
            }`}
    >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg || (danger ? 'bg-red-400/10' : 'bg-indigo-500/[0.15]')}`}>
            {icon}
        </div>
        <div className="flex flex-col min-w-0">
            <span className={`text-[13.5px] font-medium ${danger ? 'text-red-400' : 'text-[#c4c6d8]'}`}>{label}</span>
            {sublabel && <span className={`text-[11px] font-normal ${danger ? 'text-red-400/50' : 'text-[#4a4e6a]'}`}>{sublabel}</span>}
        </div>
        {right && <div className="ml-auto flex-shrink-0">{right}</div>}
    </div>
)

// ═══════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════
function GroupInfo({ setActivePanel = () => { }, group = MOCK_GROUP, currentUserId = CURRENT_USER_ID }) {
    const [view, setView] = useState('main')
    const [mediaData, setMediaData] = useState(null)
    const [mediaLoading, setMediaLoading] = useState(false)
    const groupId = group?._id



    useEffect(() => {
        if (!groupId) return
        const fetchMedia = async () => {
            setMediaLoading(true)
            const res = await groupApi.getGroupMedia(groupId)
            if (res.success) {
                setMediaData(res.data)
            }
            setMediaLoading(false)
        }
        fetchMedia()
    }, [groupId])

    return (
        <div className="flex flex-col h-full w-full bg-[#0e1018]">
            {view === 'main' && <MainView group={group} currentUserId={currentUserId} setView={setView} setActivePanel={setActivePanel} mediaData={mediaData} />}
            {view === 'members' && <MembersView group={group} currentUserId={currentUserId} setView={setView} />}
            {view === 'media' && <MediaView group={group} setView={setView} mediaData={mediaData} mediaLoading={mediaLoading} />}
            {view === 'edit' && <EditView group={group} setView={setView} />}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════════════════
function MainView({ group, currentUserId, setView, setActivePanel, mediaData }) {
    const [muted, setMuted] = useState(false)
    const [copied, setCopied] = useState(false)
    const isOwner = currentUserId === CURRENT_USER_ID
    const { setGroupChat, groupChat } = useGroupChatStore();
    const { currentChatId } = useChatStore()
    const { leaveGroup, deleteGroup } = useGroup()

    const copyLink = () => {
        navigator.clipboard.writeText(`https://chat.app/invite/${groupChat._id}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleLeaveGroup = async () => {
        await leaveGroup(group?._id)
    }

    const handleDeleteGroup = async () => {
        await deleteGroup(group?._id)
    }

    return (
        <div className="flex flex-col h-full bg-[#0e1018]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
                <span className="text-[15px] font-bold tracking-tight text-[#f1f2f7]">Group Info</span>
                <button
                    onClick={() => setActivePanel(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a4e6a] hover:text-[#818cf8] hover:bg-white/[0.05] transition-all"
                >
                    <X size={15} />
                </button>
            </div>
            <div className="h-px bg-white/[0.06] mx-5" />

            {/* Body */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1a1d28_transparent]">

                {/* Avatar + info block */}
                <div className="flex flex-col items-center gap-3 px-5 pt-5 pb-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-[2.5px] border-indigo-500/[0.45] shadow-[0_0_28px_rgba(99,102,241,0.2)]">
                            <img src={groupChat?.groupPicture || group?.name} alt={group?.name} className="w-full h-full object-cover" />
                        </div>
                        {isOwner && (
                            <button
                                onClick={() => setView('edit')}
                                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] border-[#0e1018] bg-gradient-to-br from-indigo-500 to-violet-500 hover:scale-110 transition-transform"
                            >
                                <Camera size={11} color="#fff" />
                            </button>
                        )}
                    </div>

                    <div className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                            <p className="text-[16px] font-bold text-[#f1f2f7] tracking-tight">{group?.name}</p>
                            {isOwner && (
                                <button onClick={() => setView('edit')} className="text-[#4a4e6a] hover:text-[#818cf8] transition-colors">
                                    <Edit3 size={13} />
                                </button>
                            )}
                        </div>
                        <p className="text-[11.5px] text-[#4a4e6a] mt-0.5">{group?.memberCount} members · Created {group?.createdAt}</p>
                    </div>

                    {group?.description && (
                        <p className="text-center text-[12px] text-[#6b7099] leading-relaxed px-2">{group?.description}</p>
                    )}

                    {/* Privacy pill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${group?.isPublic
                        ? 'bg-emerald-400/[0.08] border-emerald-400/20'
                        : 'bg-indigo-500/[0.08] border-indigo-500/20'
                        }`}>
                        {group?.isPublic
                            ? <Globe size={11} color="#22d3a0" />
                            : <Lock size={11} color="#818cf8" />}
                        <span className={`text-[11px] font-semibold ${group?.isPublic ? 'text-[#22d3a0]' : 'text-[#818cf8]'}`}>
                            {group?.isPublic ? 'Public Group' : 'Private Group'}
                        </span>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="px-4 mb-1">
                    <div className="flex gap-2">
                        {[
                            { label: 'Members', value: group?.memberCount, dest: 'members' },
                            { label: 'Photos', value: mediaData?.photos?.length || 0, dest: 'media' },
                            { label: 'Links', value: mediaData?.links?.length || 0, dest: 'media' },
                        ].map(s => (
                            <button
                                key={s.label}
                                onClick={() => s.dest && setView(s.dest)}
                                className="flex flex-col items-center gap-[3px] py-[10px] flex-1 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-indigo-500/[0.08] hover:border-indigo-500/20 transition-all duration-150 cursor-pointer"
                            >
                                <span className="text-[18px] font-bold text-[#818cf8]">{s.value}</span>
                                <span className="text-[10px] text-[#4a4e6a] font-medium">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-white/[0.06] mx-4 my-3" />

                {/* Navigation rows */}
                <div className="px-3">
                    {/* Members row (custom — needs avatar stack) */}
                    <div
                        onClick={() => setView('members')}
                        className="flex items-center gap-[10px] px-3 py-[10px] rounded-[10px] cursor-pointer text-[13.5px] font-medium text-[#c4c6d8] hover:bg-white/[0.05] transition-colors"
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-500/[0.15]">
                            <Users size={13} color="#818cf8" />
                        </div>
                        <span>Members</span>
                        <div className="flex ml-auto mr-1 items-center">
                            {MOCK_MEMBERS.slice(0, 3).map((m, i) => (
                                <img
                                    key={m._id} src={m.avtar} alt=""
                                    className="w-5 h-5 rounded-full object-cover border border-[#0e1018]"
                                    style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 3 - i }}
                                />
                            ))}
                        </div>
                        <ChevronRight size={13} color="#4a4e6a" />
                    </div>

                    <ActionRow
                        onClick={() => setView('media')}
                        icon={<Image size={13} color="#818cf8" />}
                        label="Media & Files"
                        right={<ChevronRight size={13} color="#4a4e6a" />}
                    />

                    {isOwner && (
                        <ActionRow
                            onClick={() => setView('edit')}
                            icon={<Settings size={13} color="#818cf8" />}
                            label="Group Settings"
                            right={<ChevronRight size={13} color="#4a4e6a" />}
                        />
                    )}
                </div>

                <div className="h-px bg-white/[0.06] mx-4 my-3" />

                {/* Invite link */}
                <div className="px-4 mb-1">
                    <SectionLabel>Invite</SectionLabel>
                    <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-white/[0.025] border border-white/[0.06] mt-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-500/[0.12]">
                            <Link2 size={12} color="#818cf8" />
                        </div>
                        <p className="text-[11px] text-[#4a4e6a] truncate flex-1">chat.app/invite/{group?._id}</p>
                        <button
                            onClick={copyLink}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-all border ${copied
                                ? 'bg-emerald-400/[0.15] text-[#22d3a0] border-emerald-400/25'
                                : 'bg-indigo-500/[0.15] text-[#818cf8] border-indigo-500/25 hover:bg-indigo-500/25'
                                }`}
                        >
                            {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                    </div>
                </div>

                <div className="h-px bg-white/[0.06] mx-4 my-3" />

                {/* Preferences */}
                <div className="px-3">
                    <SectionLabel>Preferences</SectionLabel>
                    <div className="flex items-center gap-[10px] px-3 py-[10px] rounded-[10px] text-[#c4c6d8]">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-500/[0.15]">
                            {muted ? <BellOff size={13} color="#818cf8" /> : <Bell size={13} color="#818cf8" />}
                        </div>
                        <div>
                            <p className="text-[13px] font-medium">Mute Notifications</p>
                            <p className="text-[11px] text-[#4a4e6a]">Silence group messages</p>
                        </div>
                        <div className="ml-auto">
                            <Toggle on={muted} toggle={() => setMuted(p => !p)} />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/[0.06] mx-4 my-3" />

                {/* Danger zone */}
                <div className="px-3 pb-5">
                    <SectionLabel danger>Danger Zone</SectionLabel>
                    <ActionRow
                        onClick={handleLeaveGroup}
                        danger
                        icon={<LogOut size={13} color="#f87171" />}
                        label="Leave Group"
                        sublabel="You won't receive messages"
                    />
                    {isOwner && (
                        <ActionRow
                            onClick={handleDeleteGroup}
                            danger
                            icon={<Trash2 size={13} color="#f87171" />}
                            label="Delete Group"
                            sublabel="Permanently remove for everyone"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMBERS VIEW
// ═══════════════════════════════════════════════════════════════════════════
function MembersView({ group, currentUserId, setView }) {
    const [members, setMembers] = useState(MOCK_MEMBERS)
    const [search, setSearch] = useState('')
    const [openMenu, setOpenMenu] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const { currentGroupParticipants, setCurrentGroupParticipants, groupChat } = useGroupChatStore();
    const { user } = userAuthStore()
    const { onlineStatus } = useChatStore();

    const isOwner = currentUserId === CURRENT_USER_ID
    const currentRole = members.find(m => m._id === currentUserId)?.role || 'member'
    const canManage = isOwner || currentRole === 'admin'
    // const filtered    = currentGroupParticipants.filter(m => m.username.toLowerCase().includes(search.toLowerCase()))



    const handleRemove = (id) => { setMembers(p => p.filter(m => m._id !== id)); setOpenMenu(null) }

    const handleToggleAdmin = async (member) => {

        if (member.isAdmin) {
            const res = await groupApi.unmarkMemberAsAdmin(groupChat._id, member._id)
        }
        else {
            const res = await groupApi.markMemberAsAdmin(groupChat._id, member._id)
        }
        setOpenMenu(null)
    }

    return (
        <div className="flex flex-col h-full bg-[#0e1018]">
            <SubHeader
                title={`Members · ${new Array(group?.participants).length}`}
                onBack={() => setView('main')}
                action={canManage && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:scale-110 transition-transform"
                    >
                        <UserPlus size={13} color="#fff" />
                    </button>
                )}
            />

            {/* Search */}
            <div className="px-4 pt-3 pb-2 relative">
                <Search size={13} color="#4a4e6a" className="absolute left-7 top-[50%] -translate-y-[40%] pointer-events-none" />
                <input
                    className="w-full bg-[#141720] border border-white/[0.07] rounded-[10px] py-[9px] pl-8 pr-3 text-[#f1f2f7] text-[12.5px] outline-none placeholder-[#4a4e6a] focus:border-indigo-500/40 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all"
                    placeholder="Search members…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1a1d28_transparent] px-3 pb-4 flex flex-col gap-0.5">
                {currentGroupParticipants?.map(member => {
                    const isSelf = member._id === currentUserId
                    const canAct = canManage && !isSelf && member?.role !== 'owner' || ""
                    const menuOpen = openMenu === member._id

                    return (
                        <div
                            key={member._id}
                            className="group/member flex items-center gap-[10px] px-3 py-[9px] rounded-[11px] hover:bg-white/[0.04] transition-colors relative"
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <img src={member.avtar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/[0.07]" />
                                {onlineStatus[member._id] && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22d3a0] border-2 border-[#0e1018]" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[13px] font-semibold text-[#f1f2f7] truncate">
                                        {member._id === user._id ? "you" : member.username}
                                    </span>
                                    <RoleBadge role={
                                        member._id === group?.ownerId ? 'owner' :
                                            member.isAdmin ? 'admin' :
                                                null
                                    } />
                                </div>
                                <span className="text-[11px] text-[#4a4e6a]">{onlineStatus[member._id] ? 'Online' : 'Offline'}</span>
                            </div>

                            {/* Context menu trigger */}
                            {canAct && (
                                <div className="relative ml-auto flex-shrink-0">
                                    <button
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all
                                            ${menuOpen
                                                ? 'bg-indigo-500/[0.15] text-[#818cf8]'
                                                : 'text-[#4a4e6a] opacity-0 group-hover/member:opacity-100'
                                            }`}
                                        onClick={e => { e.stopPropagation(); setOpenMenu(menuOpen ? null : member._id) }}
                                    >
                                        <MoreVertical size={14} />
                                    </button>

                                    {menuOpen && (
                                        <div className="absolute right-0 top-8 z-50 rounded-xl overflow-hidden flex flex-col bg-[#1a1d28] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[156px]">
                                            <button
                                                className="flex items-center gap-2.5 px-3 py-2.5 text-left text-[12.5px] text-[#c4c6d8] font-medium hover:bg-white/[0.05] transition-colors"
                                                onClick={e => { e.stopPropagation(); handleToggleAdmin(member) }}
                                            >
                                                {member.isAdmin
                                                    ? <><UserMinus size={13} color="#818cf8" /> Remove Admin</>
                                                    : <><Shield size={13} color="#818cf8" /> Make Admin</>}
                                            </button>
                                            {isOwner && (
                                                <button
                                                    className="flex items-center gap-2.5 px-3 py-2.5 text-left text-[12.5px] text-red-400 font-medium hover:bg-white/[0.05] transition-colors"
                                                    onClick={e => { e.stopPropagation(); handleRemove(member._id) }}
                                                >
                                                    <UserMinus size={13} /> Remove Member
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {showAddModal && (
                <AddMemberModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={() => setShowAddModal(false)}
                    group={group}
                />
            )}
        </div>
    )
}

// ─── Add Member Modal ──────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd, group }) {
    const [q, setQ] = useState('')
    const { currentGroupParticipants, setCurrentGroupParticipants, groupChat } = useGroupChatStore();
    const [users, setUsers] = useState([])
    const SUGGESTIONS = [
        { _id: '99', username: 'kai_design', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kai' },
        { _id: '100', username: 'nina.rx', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nina' },
        { _id: '101', username: 'theo_dev', avtar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=theo' },
    ]
    const [results, setResults] = useState([])

    const getUsers = async () => {
        const users = await groupApi.getUserChatUsersExceptGroupMembers(groupChat._id)
        if (users.success) {
            setResults(users.data)

        }
    }

    const handleAddMember = async (userId, username) => {
        console.log("Emitting Add Memeber :: ", userId)
        const payload = {
            groupId: groupChat._id,
            userId
        }
        const res = await groupApi.addMemberToGroup(groupChat._id, userId)
        if (res.success) {
            onAdd()
            Swal.fire({
                icon: "success",
                title: `User Added to Group`,
                html: `<b>${username}</b> has been added to <b>${group?.name}</b>.`,
                confirmButtonText: "OK",
            });
        }
    }

    useEffect(() => {
        getUsers()
    }, [])



    return (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#0a0b0f]/95 backdrop-blur-xl overflow-hidden">
            <SubHeader title="Add Members" onBack={onClose} />

            <div className="px-4 pt-3 pb-2 relative">
                <Search size={13} color="#4a4e6a" className="absolute left-7 top-[50%] -translate-y-[40%] pointer-events-none" />
                <input
                    className="w-full bg-[#141720] border border-white/[0.07] rounded-[10px] py-[9px] pl-8 pr-3 text-[#f1f2f7] text-[12.5px] outline-none placeholder-[#4a4e6a] focus:border-indigo-500/40 transition-all"
                    placeholder="Search users…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto px-3">
                {results?.map(u => (
                    <div key={u._id} className="flex items-center gap-[10px] px-3 py-[9px] rounded-[11px] hover:bg-white/[0.04] transition-colors">
                        <img src={u.avtar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/[0.07]" />
                        <span className="text-[13px] font-semibold text-[#f1f2f7] flex-1">{u.username}</span>
                        <button
                            onClick={() => { handleAddMember(u._id, u.username) }}
                            className="px-2.5 py-1 rounded-[8px] text-[11.5px] font-semibold bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_3px_10px_rgba(99,102,241,0.35)] hover:opacity-85 transition-opacity"
                        >
                            Add
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA VIEW
// ═══════════════════════════════════════════════════════════════════════════
function MediaView({ group, setView, mediaData, mediaLoading }) {
    const [tab, setTab] = useState('photos')
    const tabs = [
        { id: 'photos', label: 'Photos', Icon: Image },
        { id: 'files', label: 'Files', Icon: FileText },
        { id: 'links', label: 'Links', Icon: Hash },
    ]

    const photos = mediaData?.photos || []
    const links = mediaData?.links || []

    return (
        <div className="flex flex-col h-full bg-[#0e1018]">
            <SubHeader title="Media & Files" onBack={() => setView('main')} />

            {/* Tabs */}
            <div className="flex gap-1 px-4 pt-3 pb-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all border ${tab === t.id
                            ? 'bg-indigo-500/[0.2] text-[#818cf8] border-indigo-500/30'
                            : 'bg-transparent text-[#4a4e6a] border-transparent hover:text-[#818cf8]'
                            }`}
                    >
                        <t.Icon size={11} /> {t.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1a1d28_transparent] px-4 pb-4">
                {mediaLoading ? (
                    <div className="flex items-center justify-center h-full text-[13px] text-[#4a4e6a]">Loading...</div>
                ) : tab === 'photos' && (
                    photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {photos.map((photo, i) => (
                                <div key={photo.public_id || i} className="rounded-[8px] overflow-hidden aspect-square cursor-pointer border border-white/[0.06] hover:scale-[1.04] hover:opacity-85 transition-all duration-150">
                                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-[13px] text-[#4a4e6a] gap-2">
                            <Image size={24} color="#4a4e6a" />
                            No photos shared yet
                        </div>
                    )
                )}

                {tab === 'files' && (
                    <div className="flex flex-col items-center justify-center h-40 text-[13px] text-[#4a4e6a] gap-2 mt-1">
                        <FileText size={24} color="#4a4e6a" />
                        No files shared yet
                    </div>
                )}

                {tab === 'links' && (
                    links.length > 0 ? (
                        <div className="flex flex-col gap-2 mt-1">
                            {links.map((link, i) => (
                                <a
                                    key={link.messageId + String(i)}
                                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-[11px] bg-white/[0.03] border border-white/[0.06] hover:bg-indigo-500/[0.08] hover:border-indigo-500/20 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 bg-emerald-400/[0.1]">
                                        <Link2 size={14} color="#22d3a0" />
                                    </div>
                                    <p className="text-[12px] font-medium text-[#818cf8] truncate flex-1">{link.url}</p>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-[13px] text-[#4a4e6a] gap-2 mt-1">
                            <Hash size={24} color="#4a4e6a" />
                            No links shared yet
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// EDIT GROUP VIEW
// ═══════════════════════════════════════════════════════════════════════════
function EditView({ group, setView }) {
    const { groupChat, setGroupChat } = useGroupChatStore();
    const [name, setName] = useState(groupChat?.groupName || group?.name)
    const [desc, setDesc] = useState(groupChat?.groupDescription || group?.groupDescription)
    const [isPublic, setPublic] = useState(groupChat?.isPublic || group?.isPublic)
    const [saved, setSaved] = useState(false)
    const [file, setFile] = useState(null);
    const fileRef = useRef(null)

    const handleSave = async () => {
        // groupApi.updateGroup({ name, desc, isPublic })
        if (file) {
            const formData = new FormData();
            formData.append("groupPicture", file);
            const uploadRes = await groupApi.uploadGroupPicture(groupChat._id, formData);
            setGroupChat({ ...groupChat, groupPicture: uploadRes.data.groupPicture })
        }
        const response = await groupApi.updateGroupChat(groupChat._id, name, desc);
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    const handleFileClick = () => {
        fileRef.current.click();
    }

    return (
        <div className="flex flex-col h-full bg-[#0e1018]">
            <SubHeader title="Group Settings" onBack={() => setView('main')} />

            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1a1d28_transparent] px-5 pt-4 pb-4 flex flex-col gap-4">

                {/* Avatar */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative cursor-pointer group/avatar">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-[2.5px] border-indigo-500/[0.45] shadow-[0_0_24px_rgba(99,102,241,0.2)] group-hover/avatar:opacity-70 transition-opacity">
                            <img src={groupChat && !file ? groupChat?.groupPicture : groupChat && file ? URL.createObjectURL(file) : ""} alt="" className="w-full h-full object-cover" />
                            <input
                                ref={fileRef}
                                onChange={(e) => {
                                    setFile(e.target.files[0])
                                }}
                                className='hidden'
                                type="file" />
                        </div>
                        <div
                            onClick={handleFileClick}
                            className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <Camera size={18} color="#fff" />
                        </div>
                    </div>
                    <span className="text-[11px] text-[#4a4e6a]">Tap to change group photo</span>
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-[11px] font-semibold text-[#4a4e6a] uppercase tracking-[0.8px] mb-1.5 block">Group Name</label>
                        <input
                            className="w-full bg-[#1a1d28] border border-white/[0.06] rounded-[10px] px-3 py-[10px] text-[#f1f2f7] text-[13px] outline-none placeholder-[#4a4e6a] focus:border-indigo-500/[0.45] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Group name"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-[#4a4e6a] uppercase tracking-[0.8px] mb-1.5 block">Description</label>
                        <textarea
                            className="w-full bg-[#1a1d28] border border-white/[0.06] rounded-[10px] px-3 py-[10px] text-[#f1f2f7] text-[13px] outline-none placeholder-[#4a4e6a] focus:border-indigo-500/[0.45] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all resize-none leading-relaxed"
                            rows={3}
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="What's this group about?"
                        />
                    </div>

                    {/* Visibility toggle
                    <div className="flex items-center justify-between p-3 rounded-[11px] bg-white/[0.025] border border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500/[0.15]">
                                {isPublic ? <Globe size={13} color="#818cf8" /> : <Lock size={13} color="#818cf8" />}
                            </div>
                            <div>
                                <p className="text-[13px] text-[#c4c6d8] font-medium">{isPublic ? 'Public Group' : 'Private Group'}</p>
                                <p className="text-[11px] text-[#4a4e6a]">{isPublic ? 'Anyone can join' : 'Invite only'}</p>
                            </div>
                        </div>
                        <Toggle on={isPublic} toggle={() => setPublic(p => !p)} />
                    </div> */}
                </div>
            </div>

            {/* Save button */}
            <div className="px-5 pb-5 pt-2">
                <div className="h-px bg-white/[0.06] mb-4" />
                <button
                    onClick={handleSave}
                    className={`w-full py-2.5 rounded-[11px] text-white text-sm font-semibold tracking-wide border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-px active:scale-[0.97] ${saved
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_4px_14px_rgba(34,211,160,0.3)] hover:shadow-[0_4px_18px_rgba(34,211,160,0.45)]'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_18px_rgba(99,102,241,0.5)]'
                        }`}
                >
                    {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}

export default GroupInfo