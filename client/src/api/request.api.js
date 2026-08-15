
import axios from "axios";

class RequestApi {
    constructor() {
        this.baseUrl = `${import.meta.env.VITE_ENV === "production" ? import.meta.env.VITE_BACKEND_URL_PROD : import.meta.env.VITE_BACKEND_URL}/api/requests`
    }

    sendFriendRequest = async (friendId) => {
        try {
            const response = await axios.post(`${this.baseUrl}/friend-request/${friendId}`, {}, { withCredentials: true })
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                error: error
            }
        }
    }

    getMyRequests = async () => {
        try {
            const response = await axios.get(`${this.baseUrl}/my`, { withCredentials: true })

            console.log("My Requests ::: ", response.data.data)

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                error: error
            }
        }
    }

    acceptRequest = async (requestId) => {
        try {
            const response = await axios.get(`${this.baseUrl}/friend-request/accept/${requestId}`, { withCredentials: true })

            console.log("Accepted Request ::: ", response.data.data)

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                error: error
            }
        }
    }

    rejectRequest = async (requestId) => {
        try {
            const response = await axios.get(`${this.baseUrl}/friend-request/reject/${requestId}`, { withCredentials: true })

            console.log("Rejected Request ::: ", response.data.data)

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                error: error
            }
        }
    }
}

export const requestApi = new RequestApi();