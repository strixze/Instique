import React, { useState, useRef } from 'react'
import { userAuthStore } from '../../store/userStore'
import {
    X, User, Settings, LogOut, ChevronRight, ChevronLeft,
    Camera, Check, Bell, Shield, Palette, Globe, Trash2
} from 'lucide-react'
import { userApi } from '../../api/user.api'
import { useNavigate } from 'react-router-dom'
import { socket } from '../../socket/socket'
import { socketEvents } from '../../constants/socketEvents'

function Profile({ setActivePanel = () => {} }) {

    const { user } = userAuthStore()
    const [view, setView] = useState('main') // 'main' | 'edit' | 'settings'

    return (
        <>
            <style>{`
                .profile-slide {
                    animation: slideInPanel 0.22s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes slideInPanel {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .sub-slide {
                    animation: subSlide 0.2s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes subSlide {
                    from { opacity: 0; transform: translateX(10px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .action-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 13.5px;
                    font-weight: 500;
                    color: #c4c6d8;
                    transition: background 0.15s;
                }
                .action-row:hover { background: rgba(255,255,255,0.05); }
                .action-row:active { background: rgba(99,102,241,0.1); }

                .panel-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                    margin: 0 0px;
                }

                .profile-input {
                    width: 100%;
                    background: #1a1d28;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 10px;
                    padding: 10px 12px;
                    color: #f1f2f7;
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    font-family: 'Sora', sans-serif;
                }
                .profile-input:focus {
                    border-color: rgba(99,102,241,0.45);
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
                }
                .profile-input::placeholder { color: #4a4e6a; }

                .save-btn:hover {
                    box-shadow: 0 4px 16px rgba(99,102,241,0.45) !important;
                    transform: translateY(-1px);
                }
                .save-btn:active { transform: scale(0.97); }

                .toggle-track {
                    width: 36px; height: 20px;
                    border-radius: 20px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.2s;
                    flex-shrink: 0;
                }
                .toggle-thumb {
                    position: absolute;
                    top: 2px; left: 2px;
                    width: 16px; height: 16px;
                    border-radius: 50%;
                    background: #fff;
                    transition: transform 0.2s;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                }
                .toggle-thumb.on { transform: translateX(16px); }

                .settings-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 11px 12px;
                    border-radius: 10px;
                    font-size: 13px;
                    color: #c4c6d8;
                }
                .settings-section-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #4a4e6a;
                    padding: 0 12px 6px;
                    margin-top: 8px;
                }
            `}</style>

            <div className="profile-slide flex flex-col h-[100dvh]">
                {view === 'main' && <MainView user={user} setActivePanel={setActivePanel} setView={setView} />}
                {view === 'edit' && <EditProfileView user={user} setView={setView} />}
                {view === 'settings' && <AccountSettingsView user={user} setView={setView} />}
            </div>
        </>
    )
}

/* ─── MAIN VIEW ─────────────────────────────────── */
function MainView({ user, setActivePanel, setView }) {

    const { logout } = userAuthStore()

    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState(null)

    const navigate = useNavigate()

    const handleSignOut = async () => {
        try {
            await userApi.logoutUser();
        } catch (error) {
            console.error("Logout API failed:", error);
        }
        logout();
        socket.disconnect();
        navigate('/login');
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
                <span className="text-[15px] font-bold tracking-tight text-[#f1f2f7]">My Profile</span>
                <button onClick={() => setActivePanel(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a4e6a] hover:text-[#818cf8] hover:bg-white/[0.05] transition-all">
                    <X size={15} />
                </button>
            </div>
            <div className="panel-divider" />

            {/* Avatar + info */}
            <div className="flex flex-col items-center gap-3 px-5 pt-5 pb-5">
                <div className="relative">
                    <img
                        src={user?.avtar || user?.avatar}
                        alt={user?.username}
                        className="w-20 h-20 rounded-full object-cover border-[3px]"
                        style={{ borderColor: 'rgba(99,102,241,0.5)', boxShadow: '0 0 24px rgba(99,102,241,0.25)' }}
                    />
                    <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#22d3a0] border-2 border-[#0e1018]" />
                </div>
                <div className="text-center">
                    <p className="text-[16px] font-bold text-[#f1f2f7] tracking-tight">{user?.username}</p>
                    <p className="text-[12px] text-[#4a4e6a] mt-0.5">{user?.email}</p>
                </div>
                {/* Active badge */}
                <div className="w-full p-2.5 rounded-[10px] flex items-center gap-2"
                    style={{ background: 'rgba(34,211,160,0.08)', border: '1px solid rgba(34,211,160,0.2)' }}>
                    <div className="w-2 h-2 rounded-full bg-[#22d3a0]" />
                    <span className="text-[12px] text-[#22d3a0] font-medium">Active now</span>
                </div>
            </div>
            <div className="panel-divider" />

            {/* Actions */}
            <div className="px-3 pt-2 flex flex-col gap-0.5 flex-1">
                <div className="action-row" onClick={() => setView('edit')}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.15)' }}>
                        <User size={13} color="#818cf8" />
                    </div>
                    <span>Edit Profile</span>
                    <ChevronRight size={13} color="#4a4e6a" className="ml-auto" />
                </div>
                {/* <div className="action-row" onClick={() => setView('settings')}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.15)' }}>
                        <Settings size={13} color="#818cf8" />
                    </div>
                    <span>Account Settings</span>
                    <ChevronRight size={13} color="#4a4e6a" className="ml-auto" />
                </div> */}

                {/* Sign out pushed to bottom */}
                <div
                onClick={handleSignOut}
                className="mt-auto pt-4 pb-3">
                    <div className="panel-divider mb-3" />
                    <div className="action-row" style={{ color: '#f87171' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(248,113,113,0.1)' }}>
                            <LogOut size={13} color="#f87171" />
                        </div>
                        <span>Sign Out</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── EDIT PROFILE VIEW ──────────────────────────── */
function EditProfileView({ user, setView }) {
    const [name, setName] = useState(user?.name || user?.username || '')
    const [username, setUsername] = useState(user?.username || '')
    const [bio, setBio] = useState(user?.bio || '')
    const [saved, setSaved] = useState(false)
    const [file, setFile] = useState(null)
    const fileRef = useRef(null)

    const handleSave = async () => {
        
        const updatedData = { name, username, bio }

        console.log("Updated profile data to save:", updatedData)

        let avatarUpdate;

        if(file){
            avatarUpdate = await userApi.updateAvatar(file)

            if(avatarUpdate.success){
                user.avtar = avatarUpdate.data.avtar
            }
        }

        const response = await userApi.updateProfile(updatedData)

        if (response.success) {
            setSaved(true)
            
        } else {
            alert("Error saving profile changes. Please try again.")
        }
    }

    return (
        <div className="sub-slide flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-4">
                <button onClick={() => setView('main')}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a4e6a] hover:text-[#818cf8] hover:bg-white/[0.05] transition-all">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-[15px] font-bold tracking-tight text-[#f1f2f7]">Edit Profile</span>
            </div>
            <div className="panel-divider" />

            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 flex flex-col gap-5">
                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative cursor-pointer group" onClick={() => fileRef.current?.click()}>
                        <img
                            src={ file && user?.avtar ? URL.createObjectURL(file) : !file && user?.avtar ? user.avtar : user?.avtar}
                            alt={user?.username}
                            className="w-20 h-20 rounded-full object-cover border-[3px] transition-opacity group-hover:opacity-70"
                            style={{ borderColor: 'rgba(99,102,241,0.5)', boxShadow: '0 0 24px rgba(99,102,241,0.25)' }}
                        />
                        <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(0,0,0,0.5)' }}>
                            <Camera size={18} color="#fff" />
                        </div>
                        <input
                         ref={fileRef}
                         onChange={(e)=>{
                            setFile(e.target.files[0])
                         }}
                          type="file"
                           accept="image/*"
                            className="hidden"
                             />
                    </div>
                    <span className="text-[11px] text-[#4a4e6a]">Click to change photo</span>
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-[11px] font-semibold text-[#4a4e6a] uppercase tracking-[0.8px] mb-1.5 block">Display Name</label>
                        <input
                            className="profile-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your display name"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-[#4a4e6a] uppercase tracking-[0.8px] mb-1.5 block">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4e6a] text-sm">@</span>
                            <input
                                className="profile-input pl-7"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="username"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-[#4a4e6a] uppercase tracking-[0.8px] mb-1.5 block">Bio</label>
                        <textarea
                            className="profile-input resize-none"
                            rows={3}
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Write something about yourself…"
                            style={{ lineHeight: '1.5' }}
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-[#4a4e6a] uppercase tracking-[0.8px] mb-1.5 block">Email</label>
                        <input
                            className="profile-input opacity-50 cursor-not-allowed"
                            value={user?.email || ''}
                            readOnly
                        />
                        <p className="text-[10.5px] text-[#4a4e6a] mt-1 ml-1">Email cannot be changed</p>
                    </div>
                </div>
            </div>

            {/* Save btn */}
            <div className="px-5 pb-5 pt-2">
                <div className="panel-divider mb-4" />
                <button
                    onClick={handleSave}
                    className="save-btn w-full py-2.5 rounded-[11px] text-white text-sm font-semibold tracking-wide border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                    style={{ background: saved ? 'linear-gradient(135deg,#22d3a0,#16a37f)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                >
                    {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}

/* ─── ACCOUNT SETTINGS VIEW ─────────────────────── */
function AccountSettingsView({ user, setView }) {
    const [notifications, setNotifications] = useState(true)
    const [sounds, setSounds] = useState(true)
    const [readReceipts, setReadReceipts] = useState(true)
    const [onlineVisible, setOnlineVisible] = useState(true)

    const Toggle = ({ on, onToggle }) => (
        <div
            className="toggle-track"
            style={{ background: on ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)' }}
            onClick={onToggle}
        >
            <div className={`toggle-thumb ${on ? 'on' : ''}`} />
        </div>
    )

    return (
        <div className="sub-slide flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-4">
                <button onClick={() => setView('main')}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4a4e6a] hover:text-[#818cf8] hover:bg-white/[0.05] transition-all">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-[15px] font-bold tracking-tight text-[#f1f2f7]">Account Settings</span>
            </div>
            <div className="panel-divider" />

            <div className="flex-1 overflow-y-auto px-3 pb-4">

                {/* Notifications */}
                <p className="settings-section-label">Notifications</p>
                <div className="settings-row justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <Bell size={13} color="#818cf8" />
                        </div>
                        <div>
                            <p className="text-[13px] text-[#c4c6d8] font-medium">Push Notifications</p>
                            <p className="text-[11px] text-[#4a4e6a]">New messages & activity</p>
                        </div>
                    </div>
                    <Toggle on={notifications} onToggle={() => setNotifications(p => !p)} />
                </div>
                <div className="settings-row justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <Palette size={13} color="#818cf8" />
                        </div>
                        <div>
                            <p className="text-[13px] text-[#c4c6d8] font-medium">Message Sounds</p>
                            <p className="text-[11px] text-[#4a4e6a]">Play sound on new message</p>
                        </div>
                    </div>
                    <Toggle on={sounds} onToggle={() => setSounds(p => !p)} />
                </div>

                {/* Privacy */}
                <p className="settings-section-label">Privacy</p>
                <div className="settings-row justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <Shield size={13} color="#818cf8" />
                        </div>
                        <div>
                            <p className="text-[13px] text-[#c4c6d8] font-medium">Read Receipts</p>
                            <p className="text-[11px] text-[#4a4e6a]">Show when you've read messages</p>
                        </div>
                    </div>
                    <Toggle on={readReceipts} onToggle={() => setReadReceipts(p => !p)} />
                </div>
                <div className="settings-row justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <Globe size={13} color="#818cf8" />
                        </div>
                        <div>
                            <p className="text-[13px] text-[#c4c6d8] font-medium">Online Status</p>
                            <p className="text-[11px] text-[#4a4e6a]">Show when you're active</p>
                        </div>
                    </div>
                    <Toggle on={onlineVisible} onToggle={() => setOnlineVisible(p => !p)} />
                </div>

                {/* Danger zone */}
                <p className="settings-section-label" style={{ color: '#f87171' }}>Danger Zone</p>
                <div className="action-row mx-0" style={{ color: '#f87171' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(248,113,113,0.1)' }}>
                        <Trash2 size={13} color="#f87171" />
                    </div>
                    <div>
                        <p className="text-[13px] font-medium">Delete Account</p>
                        <p className="text-[11px] text-[#f87171]/60">This action is irreversible</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile