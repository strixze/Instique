import React, { useState } from 'react'
import { useGroupChatStore } from '../store/useGroupChatStore'
import { chatApi } from '../api/chat.api'
import { useChatStore } from '../store/useChatStore'
import { requestApi } from '../api/request.api'

export const useRequest = () => {

    const { setNewGroupInfo, GroupInfo, newGroupNotication, setNewGroupNotification, participants, resetParticipant } = useGroupChatStore()

    const { universalInfo, updateNotificationsCount, incrementNotificationCount, setRequests, requests } = useChatStore()

    const [loading, setLoading] = React.useState(false)

    const [sendingRequest, setSendingRequest] = useState(false);
    const [requestSent, setRequestSent] = useState(false);



    const sendFriendRequest = async (friendId) => {
        setSendingRequest(true);
        try {
            const response = await requestApi.sendFriendRequest(friendId);
            if (response.success) {
                setRequestSent(true);
            }
        } catch (error) {
            console.error('Failed to send friend request:', error);
        } finally {
            setSendingRequest(false);
        }
    }

    const fetchRequests = async () => {
        setLoading(true)
        const response = await requestApi.getMyRequests()
        if (response.success) {
            setRequests(response.data)
            updateNotificationsCount(response.data.length)
        }
        setLoading(false);
    }

    const acceptRequest = async (requestId) => {
        const response = await requestApi.acceptRequest(requestId)

        // if (response.success) {
        //     toast.success(response.message)
        // }
    }

    const rejectRequest = async (requestId) => {
        const response = await requestApi.rejectRequest(requestId)

        // if (response.success) {
        //     toast.success(response.message)
        // }
    }


    return {

        loading,
        setLoading,
        fetchRequests,
        acceptRequest,
        rejectRequest,
        sendFriendRequest,
        sendingRequest,
        setSendingRequest,
        requestSent,
        setRequestSent
    }
}