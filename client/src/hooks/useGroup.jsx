import React from 'react'
import { useGroupChatStore } from '../store/useGroupChatStore'
import { chatApi } from '../api/chat.api'
import { groupApi } from '../api/group.api'
import { useChatStore } from '../store/useChatStore'
import { useNavigate } from 'react-router-dom'

export const useGroup = () => {

  const { setNewGroupInfo, GroupInfo, newGroupNotication, setNewGroupNotification, participants, resetParticipant } = useGroupChatStore()
  const { removeChat } = useChatStore()
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()


  const createGroup = async (groupName, participants) => {
    setLoading(true)
    console.log("Creating Group with Data :: ", participants)
    const response = await chatApi.createGroupChat(groupName, participants)
  }

  const leaveGroup = async (groupId) => {
    setLoading(true)
    const leave = await groupApi.leaveGroup(groupId)
    removeChat(groupId)
    navigate("/")
  }

  const deleteGroup = async (groupId) => {
    setLoading(true)
    const deleteResponse = await groupApi.deleteGroup(groupId)
    removeChat(groupId)
    navigate("/")
  }

  return {
    loading,
    setLoading,
    createGroup,
    leaveGroup,
    deleteGroup
  }
}