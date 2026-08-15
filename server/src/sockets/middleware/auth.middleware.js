import { parseCookies } from "../utils/cookieParser.js";
import { ApiError } from "../../utils/apiUtils.js";
import jwt from "jsonwebtoken";
import { User } from "../../models/user.model.js";

export const auth = async (socket,next)=>{
    const token = parseCookies(socket.handshake?.headers);

    let decodedToken;

    try {
         decodedToken = jwt.verify(
            token.accessToken,
            process.env.JWT_ACCESS_SECRET,
        )
    } catch (error) {
        return socket.disconnect();
    }

    if(!decodedToken){
        return socket.disconnect();
    }



   const user = await User.findById(decodedToken?._id).select("-password")

//    console.log("Authenticated User in Socket Middleware : ",user);

   if(!user){
        socket.disconnect();
   }
   else{
        socket.user = user
        next()
   }
}
