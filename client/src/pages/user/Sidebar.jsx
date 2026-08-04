import React from "react"
import {
  MessageCircle,
  Bell,
  Users,
  Settings,
  User,
  Zap,
  X
} from "lucide-react"

import Profile from "../../components/user/Profile.jsx"
import SettingsPanel from "../../components/user/Settings.jsx"
import ChatList from "./../../components/user/ChatList.jsx"
import GroupInfo from ".././../components/user/GroupInfo.jsx"
import { useGroupChatStore } from "../../store/useGroupChatStore.js"
import Notification from "../../components/user/Notification.jsx"
import { useChatStore } from "../../store/useChatStore.js"
import { useNotification } from "../../hooks/useNotification.jsx"

function Sidebar({
  activePanel,
  setActivePanel,
  query,
  setQuery,
  users,
  setShowSidebar,
  chatUsersInfo,
  totalUnread,
  user,
  hideOnMobile = false,
  searchUsers = () => { },
  paramChatId = null
}) {

  const togglePanel = (panel) =>
    setActivePanel(prev => prev === panel ? null : panel)
  const { setNewGroupInfo, GroupInfo, newGroupNotication, setNewGroupNotification, resetParticipant, participants } = useGroupChatStore()

  const { updateNotificationsCount, universalInfo } = useChatStore()
  const { markAllNotificationsAsRead } = useNotification()


  // Nav button
  const NavIconBtn = ({ icon: Icon, panel, badge, tooltip , onClick = () => {
          togglePanel(panel)
          resetParticipant()
          console.log("Clicked Panel :: ", panel)
          console.log("Clicked Panel :: ", participants)
        } }) => {
    const active = activePanel === panel

    return (
      <button
          onClick={onClick}
        title={tooltip}
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group ${active ? 'bg-accent-glow' : 'hover:bg-white/[0.03]'
          }`}
        style={{
          border: active
            ? "1px solid rgba(99,102,241,0.4)"
            : "1px solid transparent",
          boxShadow: active
            ? "0 0 16px rgba(99,102,241,0.18)"
            : "none"
        }}
      >
        <Icon
          size={18}
          className={active ? 'text-accent-light' : 'text-text-dim'}
        />

        {badge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg,#6366f1,#8b5cf6)"
            }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}

        <span className="absolute left-full ml-2.5 px-2 py-1 text-[11px] font-medium text-text-secondary bg-surface-700 border border-white/[0.08] rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
          {tooltip}
        </span>
      </button>
    )
  }

  return (
    <>
      {/* ICON RAIL */}
      <div className={`${hideOnMobile ? 'hidden md:flex' : 'flex'} flex-col items-center gap-1.5 w-[62px] min-w-[62px] h-[100dvh] bg-surface-900 border-r border-white/[0.05] pt-5 pb-4 z-30`}>

        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl mb-4 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg,#6366f1,#8b5cf6)",
            boxShadow:
              "0 4px 14px rgba(99,102,241,0.45)"
          }}
        >
          <Zap size={18} className="text-white" />
        </div>

        <NavIconBtn
          icon={MessageCircle}
          panel="chats"
          tooltip="Chats"
        />

        <NavIconBtn
          onClick={async() => {
            await markAllNotificationsAsRead(universalInfo.notifications || 0)
          togglePanel("notifications")
          resetParticipant()
          }}
          icon={Bell}
          panel="notifications"
          badge={universalInfo.notifications}
          tooltip="Notifications"
        />

        <NavIconBtn
          icon={Users}
          panel="newGroup"
          tooltip="New Group"
        />

        <div className="flex-1" />

        {/* <NavIconBtn
          icon={Settings}
          panel="settings"
          tooltip="Settings"
        /> */}

        <NavIconBtn
          icon={User}
          panel="profile"
          tooltip="Profile"
        />

      </div>


      {/* SIDEBAR PANEL */}
      <div className={`${hideOnMobile ? 'hidden md:flex' : 'flex'} relative flex flex-col w-full md:w-[300px] md:min-w-[280px] h-screen bg-surface-800 border-r border-white/[0.06]`}>

        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-60" />

        {/* Notifications */}
        {activePanel === "notifications" &&
          <Notification
            activePanel={activePanel}
            setActivePanel={setActivePanel}
            chatUsersInfo={chatUsersInfo}
            newGroupNotication={newGroupNotication}
          />
        }

        {/* Profile */}
        {activePanel === "profile" &&
          <Profile
            setActivePanel={setActivePanel}
          />
        }


        {/* New Group */}
        {activePanel === "newGroup" && (
          <ChatList
            togglePanel={setActivePanel}
            activePanel={activePanel}
            query={query}
            setQuery={setQuery}
            users={users}
            setShowSidebar={setShowSidebar}
            groupsOnly={true}
            paramChatId={paramChatId}
            searchUsers={searchUsers}
          />
        )}

        {activePanel === "createGroup" && (
          <ChatList
            togglePanel={setActivePanel}
            activePanel={activePanel}
            query={query}
            setQuery={setQuery}
            users={users}
            setShowSidebar={setShowSidebar}
            groupsOnly={true}
            paramChatId={paramChatId}
            searchUsers={searchUsers}
            createGroup={true}
          />
        )}


        {/* Settings */}
        {/* {activePanel === "settings" &&
          <SettingsPanel
            setActivePanel={setActivePanel}
          />
        } */}


        {/* Chats */}
        {(activePanel === null ||
          activePanel === "chats") && (

            <ChatList
              togglePanel={setActivePanel}
              activePanel={activePanel}
              query={query}
              setQuery={setQuery}
              users={users}
              setShowSidebar={setShowSidebar}
              groupsOnly={false}
              paramChatId={paramChatId}
              searchUsers={searchUsers}
            />

          )}


        {/* Group Info */}
        {activePanel === "groupInfo" && (

          <ChatList
            togglePanel={setActivePanel}
            activePanel={activePanel}
            query={query}
            setQuery={setQuery}
            users={users}
            setShowSidebar={setShowSidebar}
            groupsOnly={true}
            paramChatId={paramChatId}
            searchUsers={searchUsers}
          />

        )}

      </div>
    </>
  )
}

export default Sidebar