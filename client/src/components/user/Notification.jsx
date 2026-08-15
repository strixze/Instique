// import { X } from 'lucide-react'
// import React from 'react'

// function Notification({activePanel,setActivePanel,chatUsersInfo,newGroupNotication}) {

//              return <div className="slide-in-panel flex flex-col h-full">

//                 <div className="flex items-center justify-between px-5 pt-6 pb-4">
//                   <span className="text-[15px] font-bold">
//                     Notifications
//                   </span>

//                   <button
//                     onClick={() => setActivePanel(null)}
//                   >
//                     <X size={16}/>
//                   </button>
//                 </div>

//                 <div className="panel-divider"/>

//                 <div className="flex-1 overflow-y-auto px-3 custom-scroll">

//                   {Object.entries(chatUsersInfo)
//                     .filter(([,c]) => c?.newMessages > 0)
//                     .map(([chatId, info]) => {

//                       const chat =
//                         users?.find(
//                           c => c._id === chatId
//                         )

//                       if(!chat) return null

//                       const otherUser =
//                         chat.participants[0]._id === user._id
//                           ? chat.participants[1]
//                           : chat.participants[0]

//                       return (
//                         <div
//                           key={chatId}
//                           className="notif-item unread"
//                           onClick={() =>
//                             setActivePanel(null)
//                           }
//                         >

//                           <img
//                             src={otherUser.avtar}
//                             className="w-9 h-9 rounded-full"
//                           />

//                           <div>
//                             {otherUser.username}
//                           </div>

//                         </div>
//                       )

//                     })}

//                   {
//                     newGroupNotication &&
//                     <div className="notif-item unread">
//                       <img
//                         src={""}
//                         className="w-9 h-9 rounded-full"
//                       />
//                       <div
//                         className="text-sm font-medium text-[#c4c6e7]"
//                       >
//                         {"User1 Added you to "}
//                       </div>
//                     </div>
//                   }

//                 </div>

//               </div>

// }

// export default Notification








import { X } from "lucide-react"
import React, { useState, useEffect, useCallback } from "react"
import NotificationCard from "./NotificationCard"
import { requestApi } from "../../api/request.api"
import { notificationApi } from "../../api/notification.api"
import { userAuthStore } from "../../store/userStore"
import { socket } from "../../socket/socket"
import { socketEvents } from "../../constants/socketEvents"
import { useChatStore } from "../../store/useChatStore"
import { useRequest } from "../../hooks/useRequest"
import { useNotification } from "../../hooks/useNotification"

// ─── Component ─────────────────────────────────────────────────────────────────

function Notification({ activePanel, setActivePanel }) {
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const user = userAuthStore((state) => state.user)
  const { updateNotificationsCount, incrementNotificationCount,universalInfo } = useChatStore()
  const { acceptRequest, rejectRequest } = useRequest()
  const { markAllNotificationsAsRead} = useNotification()

  // Fetch user requests
  const fetchRequests = useCallback(async () => {
    if (!user?._id) return
    setLoading(true)
    const response = await requestApi.getMyRequests()
    if (response.success) {
      setRequests(response.data || [])
    }
  }, [user?._id])

  // Fetch general notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return
    const response = await notificationApi.getMyNotifications()
    if (response.success) {
      setNotifications(response.data?.notifications || [])
    }
  }, [user?._id])

  // Update badge count whenever requests or notifications change
  useEffect(() => {
    const count = requests.filter(r => r.status === "pending").length + notifications.length
    updateNotificationsCount(universalInfo.notifications || 0)
  }, [requests, notifications])

  useEffect(() => {
    Promise.all([fetchRequests(), fetchNotifications()]).then(() => {
      setLoading(false)
    })
  }, [fetchRequests, fetchNotifications])

  const markNotificationsAsRead = async () => {
     
      await markAllNotificationsAsRead(universalInfo.notifications || 0)
    }

  // Listen for new request socket event
  useEffect(() => {
    const handleNewRequest = (newRequest) => {
      console.log("New request received:", newRequest)
      setRequests(prev => [newRequest, ...prev])
    }

    
    markAllNotificationsAsRead()


    socket.on(socketEvents.NEW_REQUEST, handleNewRequest)
    return () => {
      socket.off(socketEvents.NEW_REQUEST, handleNewRequest)
    }
  }, [])

  // Listen for new notification socket event
  useEffect(() => {
    const handleNewNotification = (notification) => {
      console.log("New notification received:", notification)
      setNotifications(prev => [notification, ...prev])
      incrementNotificationCount(1)
    }

    socket.on(socketEvents.NEW_NOTIFICATION, handleNewNotification)
    return () => {
      socket.off(socketEvents.NEW_NOTIFICATION, handleNewNotification)
    }
  }, [])

  const unreadCount = requests.filter(r => r.status === "pending").length + notifications.length

  // Handle accepting a request
  const handleAcceptRequest = async (requestId) => {
    await acceptRequest(requestId)
    console.log("Accept request:", requestId)
    setRequests(prev =>
      prev.map(r => r._id === requestId ? { ...r, status: "accepted" } : r)
    )
  }

  // Handle rejecting a request
  const handleRejectRequest = async (requestId) => {
    // TODO: Implement reject request API call when backend adds the endpoint
    console.log("Reject request:", requestId)
    setRequests(prev =>
      prev.map(r => r._id === requestId ? { ...r, status: "rejected" } : r)
    )
  }

  // Navigate to the notification's context
  const handleClick = (request) => {
    if (request.status === "pending") {
      handleAcceptRequest(request._id)
    }
    setActivePanel(null)
  }

  return (
    <div className="slide-in-panel flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold">Friend Requests</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "rgba(124,131,229,0.2)",
                color: "#7c83e5",
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 20,
                letterSpacing: "0.02em",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <button onClick={() => setActivePanel(null)}>
          <X size={16} />
        </button>
      </div>

      <div className="panel-divider" />

      {/* ── Notification list ── */}
      <div className="flex-1 overflow-y-auto px-2 custom-scroll">
        {loading ? (
          <div className="flex items-center justify-center h-full" style={{ color: "rgba(196,198,231,0.3)", fontSize: 13 }}>
            Loading...
          </div>
        ) : requests.length === 0 && notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {requests.map(request => (
              <NotificationCard
                key={request._id}
                notification={{
                  _id: request._id,
                  type: "friend_request",
                  isRead: request.status !== "pending",
                  content: `${request.sender?.username || "Someone"} sent you a friend request`,
                  createdAt: request.createdAt,
                  sender: request.sender,
                  status: request.status
                }}
                senderInfo={request.sender ? {
                  username: request.sender.username,
                  avatar: request.sender.avtar
                } : null}
                onClick={() => handleClick(request)}
                onAccept={() => handleAcceptRequest(request._id)}
                onReject={() => handleRejectRequest(request._id)}
              />
            ))}
            {notifications.length > 0 && notifications.map(notif => (
              <NotificationCard
                key={notif._id}
                notification={notif}
                senderInfo={notif.sender ? {
                  username: notif.sender.username,
                  avatar: notif.sender.avtar
                } : null}
                onClick={() => setActivePanel(null)}
              />
            ))}
          </>
        )}
      </div>

    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-3"
      style={{ color: "rgba(196,198,231,0.3)", fontSize: 13, paddingBottom: 40 }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(196,198,231,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(196,198,231,0.3)">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      </div>
      <span>You&apos;re all caught up!</span>
    </div>
  )
}

export default Notification