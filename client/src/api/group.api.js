import axios from "axios";

class GroupApi {
    constructor() {
        this.baseUrl = `${import.meta.env.VITE_ENV === "production" ? import.meta.env.VITE_BACKEND_URL_PROD : import.meta.env.VITE_BACKEND_URL}/api/groups`
    }

    getGroupMembers = async (groupId) => {
        try {
            console.log("GroupId in API :: ", groupId)
            const response = await axios.get(`${this.baseUrl}/members/${groupId}`, {
                withCredentials: true
            });
            console.log("Group Members Response :: ", response.data);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    updateGroupChat = async (groupId, groupName, groupDescription) => {
        try {
            const response = await axios.put(`${this.baseUrl}/update/${groupId}`, {
                groupName,
                groupDescription
            }, {
                withCredentials: true
            });
            console.log("Update Group Chat Response :: ", response.data);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    uploadGroupPicture = async (groupId, formData) => {
        try {
            const response = await axios.post(`${this.baseUrl}/upload-picture/${groupId}`, formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            console.log("Upload Group Picture Response :: ", response);
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    getConversation = async (groupId, before = null) => {
        try {
            console.log("Messages in Conversation :: ")
            const params = {}
            if (before) params.before = before
            const response = await axios.get(`${this.baseUrl}/convo/${groupId}`,
                {
                    withCredentials: true,
                    params
                }
            )

            console.log("Messages in Conversation :: ")

            return {
                success: true,
                message: "",
                data: response.data || []
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            }
        }
    }

    getUserChatUsersExceptGroupMembers = async (groupId) => {
        try {

            console.log("GroupId :: ", groupId)

            const response = await axios.get(`${this.baseUrl}/non-group-members/${groupId}`, {
                withCredentials: true
            })

            console.log(response.data)

            return {
                success: true,
                data: response.data.data,
                message: "Users Fetched Successfully"
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            }
        }
    }

    addMemberToGroup = async (groupId, memberId) => {
        try {

            // console.log("GroupId :: ",groupId)

            const response = await axios.post(`${this.baseUrl}/add-member`,
                {
                    groupId,
                    memberId
                },
                {
                    withCredentials: true
                })

            console.log(response.data)

            return {
                success: true,
                data: response.data.data,
                message: "Member Added to Group Successfully"
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            }
        }
    }

    markMemberAsAdmin = async (groupId, memberId) => {
        try {

            // console.log("GroupId :: ",groupId)

            const response = await axios.post(`${this.baseUrl}/mark-admin`,
                {
                    groupId,
                    memberId
                },
                {
                    withCredentials: true
                })

            console.log(response.data)

            return {
                success: true,
                data: response.data.data,
                message: "Member Marked as Group Admin."
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            }
        }
    }

    unmarkMemberAsAdmin = async (groupId, memberId) => {
        try {

            // console.log("GroupId :: ",groupId)

            const response = await axios.post(`${this.baseUrl}/unmark-admin`,
                {
                    groupId,
                    memberId
                },
                {
                    withCredentials: true
                })

            console.log(response.data)

            return {
                success: true,
                data: response.data.data,
                message: "Member Unmarked as Group Admin."
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            }
        }
    }

    getGroupMedia = async (groupId) => {
        try {
            const response = await axios.get(`${this.baseUrl}/media/${groupId}`, {
                withCredentials: true
            })
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    leaveGroup = async (groupId) => {
        try {

            console.log("GroupId :: ", groupId)

            const response = await axios.get(`${this.baseUrl}/leave/${groupId}`,
                {
                    withCredentials: true
                })

            console.log(response.data)

            return {
                success: true,
                data: response.data.data,
                message: "Leaved from group."
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            }
        }
    }

    deleteGroup = async (groupId) => {
        try {


            const response = await axios.delete(`${this.baseUrl}/delete/${groupId}`, {
                withCredentials: true
            })

            console.log("Delete Group Response:", response.data)

            return {
                success: true,
                data: response.data.data,
                message: "Group deleted."
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            }
        }
    }
}

export const groupApi = new GroupApi();