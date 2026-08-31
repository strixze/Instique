import React from 'react'
import { X, Bell, User, Zap, ChevronRight } from 'lucide-react'


function Settings({
    setActivePanel=()=>{},

}) {

    

  return (
       <div className="slide-in-panel flex flex-col h-full">
                            <div className="flex items-center justify-between px-5 pt-6 pb-4">
                                <span className="text-[15px] font-bold tracking-tight">Settings</span>
                                <button onClick={() => setActivePanel(null)} className="text-[#4a4e6a] hover:text-[#818cf8] transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="panel-divider" />
                            <div className="px-3 flex flex-col gap-0.5">
                                {[
                                    { label: 'Notifications', icon: Bell },
                                    { label: 'Privacy & Security', icon: User },
                                    { label: 'Appearance', icon: Zap },
                                    { label: 'Blocked Users', icon: X },
                                ].map(({ label, icon: Icon }) => (
                                    <div key={label} className="action-row">
                                        <Icon size={15} color="#6366f1" />
                                        <span>{label}</span>
                                        <ChevronRight size={13} color="#4a4e6a" className="ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
  )
}

export default Settings