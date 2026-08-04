import React from 'react'
import { X, Search } from 'lucide-react'
import { userAuthStore } from '../../store/userStore'
import { useGroupChatStore } from '../../store/useGroupChatStore'
import { useGroup } from '../../hooks/useGroup'
import { useNavigate } from 'react-router-dom'


function CreateGroup({
    setActivePanel = () => { },
    users = [],

}) {

    const { user } = userAuthStore()
    const [groupName, setGroupName] = React.useState(null)
    const { participants, addParticipant, resetParticipant } = useGroupChatStore()
    const { createGroup } = useGroup()
    const navigate = useNavigate()

    const handleCreateGroup = async () => {

        await createGroup(groupName, participants)
        setActivePanel("chats")
        navigate("/")
    }

    React.useEffect(() => {
        resetParticipant()
    }, [])


    return (
        <div className="slide-in-panel flex flex-col items-center h-full border-1">
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
                <span className="text-[15px] font-bold tracking-tight">New Group</span>
                <button onClick={() => setActivePanel(null)} className="text-[#4a4e6a] hover:text-[#818cf8] transition-colors">
                    <X size={16} />
                </button>
            </div>
            <div className="panel-divider" />
            <div className="px-4 flex flex-col gap-3 pb-4 flex-1 overflow-y-auto h-fit custom-scroll">
                <div>
                    <label className="text-[10.5px] uppercase tracking-[1px] text-[#4a4e6a] font-semibold mb-1.5 block">Group Name</label>
                    <input
                        onChange={(e) => {
                            setGroupName(e.target.value)
                            console.log("Group Name :: ", e.target.value)
                        }}
                        value={groupName}
                        type="text"
                        placeholder="e.g. Design Team"
                        className="w-full py-2.5 px-3.5 bg-[#1a1d28] border border-white/[0.06] rounded-[12px] text-[13.5px] text-[#f1f2f7] outline-none placeholder-[#4a4e6a] search-input transition-all duration-200"
                    />
                </div>
                <div>
                    <label className="text-[10.5px] uppercase tracking-[1px] text-[#4a4e6a] font-semibold mb-1.5 block">Add Members</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4a4e6a]" size={13} />
                        <input
                            type="text"
                            placeholder="Search users…"
                            className="w-full py-2.5 pl-8 pr-3.5 bg-[#1a1d28] border border-white/[0.06] rounded-[12px] text-[13.5px] text-[#f1f2f7] outline-none placeholder-[#4a4e6a] search-input transition-all duration-200"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1 items-start">
                    {users?.slice(0, 8).map(chat => {
                        if (chat.isGroupChat) return null
                        const u = chat.participants[0]._id === user._id ? chat.participants[1] : chat.participants[0]
                        return (
                            <label key={chat._id} className="action-row flex items-center gap-3" style={{ cursor: 'pointer' }}>
                                <input
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            addParticipant(u._id)
                                        }
                                    }}
                                    type="checkbox"
                                    className="w-3.5 h-3.5 accent-indigo-500 flex-shrink-0"
                                />
                                <img src={u?.avtar} alt="" className="w-7 h-7 rounded-full object-cover border border-white/[0.07]" />
                                <span className="text-[13px] text-[#c4c6e7]">{u?.username}</span>
                            </label>
                        )
                    })}
                </div>


            </div>
            <button
                onClick={handleCreateGroup}
                className="w-[90%] py-2.5 rounded-[12px] text-[13.5px] font-semibold text-white mt-1 transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] mb-3"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
            >
                Create Group
            </button>
        </div>
    )
}

export default CreateGroup