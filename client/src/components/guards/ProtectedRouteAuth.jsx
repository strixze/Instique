import React from 'react'
import { userAuthStore } from '../../store/userStore'
import Home from '../../pages/user/Home'
import { Navigate } from 'react-router-dom'

function ProtectedRouteAuth({children}) {

    const {user} = userAuthStore()

    if(user){
        return <Navigate to="/" replace/>
    }

    return children
}

export default ProtectedRouteAuth