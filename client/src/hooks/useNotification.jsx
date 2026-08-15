import React from 'react'
import { useGroupChatStore } from '../store/useGroupChatStore'
import { chatApi } from '../api/chat.api'
import { useChatStore } from '../store/useChatStore'
import { notificationApi } from '../api/notification.api'

export const useNotification = () => {

    const { setNewGroupInfo, GroupInfo, newGroupNotication, setNewGroupNotification, participants, resetParticipant } = useGroupChatStore()
    const { universalInfo, updateNotificationsCount, incrementNotificationCount, setRequests, requests } = useChatStore()
    const [loading, setLoading] = React.useState(false)


    const createGroup = async (groupName, participants) => {
        setLoading(true)
        console.log("Creating Group with Data :: ", participants)
        const response = await chatApi.createGroupChat(groupName, participants)
    }

    const fetchNotifications = async () => {
        setLoading(true)
        const response = await notificationApi.getMyNotifications()
        if (response.success) {
            console.log("Notifications :: ", response.data)
            setRequests(response.data)
            updateNotificationsCount(response.data.count)
        }
        setLoading(false)
    }

    const markAllNotificationsAsRead = async (count) => {
        setLoading(true)
        const response = await notificationApi.markAllAsRead(count)
        if (response.success) {
            console.log("All notifications marked as read")
            updateNotificationsCount(0)
        }
        setLoading(false)
    }


    return {

        loading,
        setLoading,
        createGroup,
        fetchNotifications,
        markAllNotificationsAsRead
    }
}