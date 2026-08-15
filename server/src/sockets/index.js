import { httpServer } from "../server.js";
import { parseCookies } from "./utils/cookieParser.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiUtils.js";
import dotenv from "dotenv";
import { socketsMap } from "./soketsMap.js";
dotenv.config({path:"./.env"})
import { auth } from "./middleware/auth.middleware.js";
import {Server} from "socket.io"
import { registerSocketHandlers } from "./handler/index.js";
import { setIO } from "./socketInstance.js";

export const initializeSocket = () =>{
    const io = new Server(httpServer, {
    cors:{
        origin:process.env.CLIENT_URL || "http://localhost:5173",
        methods:["GET","POST"],
        credentials:true
    }
})


setIO(io)   // setting io instance in socketInstance file to use it outside this file as well

/**
 @description this is the middleware used to communicate only authenticated sockets
 */
io.use(auth)  // authentication middleware



io.on("connection",(socket)=>{    // Listen for client connections

    console.log("User connected : ",socket.id)
    
    
  registerSocketHandlers(io,socket)

})



return io

}

