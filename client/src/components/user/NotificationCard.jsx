import React from "react"
import { UserPlus, AtSign, MessageCircle, ShieldCheck, Bell, Check, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

// ─── Config ────────────────────────────────────────────────────────────────────

const NOTIFICATION_CONFIG = {
  group_add: {
    icon: UserPlus,
    color: "#7c83e5",          // indigo-violet accent
    bg: "rgba(124,131,229,0.12)",
    label: "Group Invite",
  },
  mention: {
    icon: AtSign,
    color: "#e57c9a",          // rose accent
    bg: "rgba(229,124,154,0.12)",
    label: "Mentioned you",
  },
  message: {
    icon: MessageCircle,
    color: "#7ce5c4",          // teal accent
    bg: "rgba(124,229,196,0.12)",
    label: "New Message",
  },
  admin_promote: {
    icon: ShieldCheck,
    color: "#e5c87c",          // amber accent
    bg: "rgba(229,200,124,0.12)",
    label: "Promoted to Admin",
  },
  friend_request: {
    icon: UserPlus,
    color: "#7ce5c4",          // teal accent
    bg: "rgba(124,229,196,0.12)",
    label: "Friend Request",
  },
  default: {
    icon: Bell,
    color: "#c4c6e7",
    bg: "rgba(196,198,231,0.10)",
    label: "Notification",
  },
  notify: {
    icon: Bell,
    color: "#c4c6e7",
    bg: "rgba(196,198,231,0.10)",
    label: "Notification",
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function Avatar({ src, username, size = 36 }) {
  const initials = username
    ?.split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"

  return src ? (
    <img
      src={src}
      alt={username}
      style={{ width: size, height: size }}
      className="rounded-full object-cover flex-shrink-0"
      onError={e => { e.currentTarget.style.display = "none" }}
    />
  ) : (
    <div
      //   style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full flex-shrink-0 flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "rgba(124,131,229,0.2)",
        color: "#c4c6e7",
        flexShrink: 0,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
      }}
    >
      {initials}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * NotificationCard
 *
 * Props:
 *  notification  – Notification document from DB
 *  senderInfo    – { username, avatar } resolved from sender ObjectId
 *  onClick       – called when card is clicked
 *  onMarkRead    – called when "mark read" dot is clicked
 *  onAccept      – called when accepting a friend request
 *  onReject      – called when rejecting a friend request
 */
function NotificationCard({ notification, senderInfo, onClick, onMarkRead, onAccept, onReject }) {
  const { type, content, isRead, createdAt, renderUrl, status } = notification
  const config = NOTIFICATION_CONFIG[type] ?? NOTIFICATION_CONFIG.default
  const Icon = config.icon
  const navigate = useNavigate()

  function handleMarkRead(e) {
    e.stopPropagation()
    onMarkRead?.(notification._id)
  }

  return (
    <div
      onClick={() => {onClick?.(notification)
        if(notification?.renderUrl){
          navigate(notification.renderUrl)
        }
      }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        padding: "11px 12px",
        borderRadius: 12,
        cursor: "pointer",
        transition: "background 0.18s ease",
        background: isRead ? "transparent" : "rgba(124,131,229,0.055)",
        marginBottom: 2,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = isRead
          ? "rgba(255,255,255,0.04)"
          : "rgba(124,131,229,0.10)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isRead
          ? "transparent"
          : "rgba(124,131,229,0.055)"
      }}
    >
      {/* ── Avatar + icon badge ── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar
          src={senderInfo?.avatar}
          username={senderInfo?.username}
          size={38}
        />
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: config.bg,
            border: "1.5px solid rgba(30,32,60,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={9.5} color={config.color} strokeWidth={2.4} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>

        {/* type label + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: config.color,
            }}
          >
            {config.label}
          </span>
          <span style={{ fontSize: 10.5, color: "rgba(196,198,231,0.45)", flexShrink: 0, marginLeft: 8 }}>
            {timeAgo(createdAt)}
          </span>
        </div>

        {/* sender name */}
        {senderInfo?.username && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e4f0",
              marginBottom: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {senderInfo.username}
          </div>
        )}

        {/* content */}
        <p
          style={{
            fontSize: 12.5,
            color: "rgba(196,198,231,0.7)",
            margin: 0,
            lineHeight: 1.45,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {content}
        </p>

        {/* Friend request actions */}
        {type === "friend_request" && status === "pending" && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAccept?.()
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 12px",
                borderRadius: 6,
                background: "rgba(124,229,196,0.15)",
                color: "#7ce5c4",
                border: "1px solid rgba(124,229,196,0.3)",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(124,229,196,0.25)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(124,229,196,0.15)"
              }}
            >
              <Check size={12} />
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReject?.()
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 12px",
                borderRadius: 6,
                background: "rgba(229,124,154,0.15)",
                color: "#e57c9a",
                border: "1px solid rgba(229,124,154,0.3)",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(229,124,154,0.25)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(229,124,154,0.15)"
              }}
            >
              <X size={12} />
              Reject
            </button>
          </div>
        )}

        {/* CTA link if renderUrl exists */}
        {renderUrl && (
          <span
            style={{
              display: "inline-block",
              marginTop: 5,
              fontSize: 11.5,
              color: config.color,
              fontWeight: 500,
              opacity: 0.85,
            }}
          >
            View →
          </span>
        )}
      </div>

      {/* ── Unread dot (click to mark read) ── */}
      {!isRead && status !== "pending" && (
        <button
          onClick={handleMarkRead}
          title="Mark as read"
          style={{
            flexShrink: 0,
            marginTop: 6,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: config.color,
            border: "none",
            cursor: "pointer",
            padding: 0,
            boxShadow: `0 0 6px 1px ${config.color}55`,
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.4)" }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)" }}
        />
      )}
    </div>
  )
}

export default NotificationCard


// ─── Usage in Notification.jsx ─────────────────────────────────────────────────
//
//  import NotificationCard from "./NotificationCard"
//
//  <NotificationCard
//    key={notif._id}
//    notification={notif}          // full DB document
//    senderInfo={{                 // resolved sender data
//      username: notif.sender.username,
//      avatar:   notif.sender.avatar,
//    }}
//    onClick={(notif) => {
//      if (notif.renderUrl) navigate(notif.renderUrl)
//      setActivePanel(null)
//    }}
//    onMarkRead={(id) => markNotificationRead(id)}
//  />