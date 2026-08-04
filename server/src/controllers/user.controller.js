import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, ApiResponse } from "../utils/apiUtils.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendVerificationToken } from "../services/sendVerificationToken.js";
import { generateTokens } from "../services/generateTokens.js";
import { deleteFileFromCloudinary, uploadFileOnCloudinary } from "../services/cloudinary.service.js";
import { generateOTP } from "../services/generateOTP.js";
import { sendEmail } from "../services/brevoMail.service.js";
import { getUserChatPartners } from "../sockets/utils/getUserChatPartners.js";
import { getIO } from "../sockets/socketInstance.js";
import { socketEvents } from "../constants/socketEvents.js";
import { getUserSocket } from "../sockets/soketsMap.js";

dotenv.config({ path: "./.env" })

const registerUser = asyncHandler(async (req, res, next) => {
  const {
    username,
    name,
    email,
    password
  } = req.body

  if ([username, name, email, password].some((field) => (!field || field.trim() === ""))) {
    throw new ApiError(400, "All Fields are required!")
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be atleast 8 charachers long.")
  }

  const alreadyExists = await User.findOne({ email });

  if (alreadyExists) {
    throw new ApiError(400, "User with this email already exists.")
  }

  const usernameExists = await User.findOne({
    username: username.trim().toLowerCase()
  })

  if (usernameExists) {
    throw new ApiError(400, `Username '${username}' is already taken. Please choose a different username.`)
  }

  const newUser = await User.create({
    username,
    name,
    email,
    password,
    avtar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  })

  if (!newUser) {
    throw new ApiError(500, "User Creation Error")
  }


  req.newUser = newUser;
  console.log("New user created:", newUser);


  return res.status(201).json(
    new ApiResponse(201, "User Registered Successfully.")
  )

})

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!(email && password)) {
    throw new ApiError(400, "All Fields are Required")
  }

  if (email.trim() === "" || password.trim() === "") {
    throw new ApiError(400, "No Field can be Empty")
  }

  const user = await User.findOne({
    email: email.toLowerCase()
  })

  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(400, [], "Acoount not found!", false)
      )
  }

  // if(user.isVerified === false){
  //   return res
  //     .status(200)
  //     .json(
  //       new ApiResponse(403, {isVerified: user.isVerified}, "Email is not verified! Please verify your email to login.")
  //     )
  // }

  const isCorrect = await user.isCorrectPassword(password)

  if (!isCorrect) {
    return res.status(200).json(
      new ApiResponse(400, [], "Invalid Credentials", false)
    )
    //

  }

  // if (!user.isVerified) {
  //   return res.status(403).json(
  //     new ApiResponse(403, {isVerified: user.isVerified}, "Email is not verified! Please verify your email to login.")
  //   )
  // }


  const { accessToken, refreshToken } = generateTokens(user)

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false })

  const partners = await getUserChatPartners(user._id)

  const io = getIO()

  let onlineUsers = []

  if (partners) {
    for (let partner of partners) {
      if (getUserSocket(partner.toString())) {
        io.to(partner.toString()).emit(socketEvents.USER_ONLINE, user?._id)
        // console.log("Emitted Online Status to : ",partner.toString())
        onlineUsers.push(partner.toString())
      }
    }
    io.to(user._id.toString()).emit(socketEvents.ONLINE_USERS, onlineUsers)
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    .json(
      new ApiResponse(200, {
        _id: user._id,
        username: user.username,
      }, "Login Successful")
    )
})

const logoutUser = asyncHandler(async (req, res) => {

  const id = req.user._id;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(401, "Unauthorize Request")
  }

  const user = await User.findById(id)

  if (!user) {
    throw new ApiError(404, "Cannot Find User With Given Id")
  }

  user.refreshToken = undefined;

  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    .json(
      new ApiResponse(200, "Logout Successful")
    )

})

const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || (email && email.trim() === "")) {
    throw new ApiError(400, "Email is required to send OTP")
  }

  const otp = generateOTP();

  if (!otp) {
    throw new ApiError(500, "OTP Generation Failed")
  }

  const user = await User.updateOne(
    { email },
    {
      $set: {
        resetPasswordOTP: otp,
        resetPasswordOTPExpiry: Date.now() + 10 * 60 * 1000 //10 minutes
      }
    },
    {
      new: true
    }
  )

  if (!user) {
    throw new ApiError(500, "MongoDB Server Error While Saving OTP")
  }

  const emailResponse = await sendEmail(
    email,
    "Your Password Reset OTP",
    `Your OTP for password reset is: <h1><b>${otp}</b></h1>. It is valid for 10 minutes.`
  );

  console.log("Email service response:", emailResponse);

  // if(!emailResponse.success){
  //     throw new ApiError(500,"Email Sending Failed"); 
  // }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "OTP Sent Successfully to Email")
    )


})

const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || email.trim() === "") {
    throw new ApiError(400, "Email is required to resend verification email")
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User Not Found")
  }

  req.newUser = user;

  const response = await sendVerificationToken(req, res);

})



const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.params;
  console.log("Received token for verification:", token);

  if (!token || token.trim() === "") {
    throw new ApiError(400, "Token is required for verification")
  }

  console.log("Verifying token:", token);

  let decodeToken;

  try {
    decodeToken = jwt.verify(
      token,
      process.env.VERIFICATION_SECRET
    )

    console.log("Decoded token:", decodeToken);
    if (!decodeToken) {
      throw new ApiError(400, "Invalid or Expired Token")
    }

    const user = await User.findByIdAndUpdate(
      decodeToken.id,
      {
        $set: {
          isVerified: true
        }
      },
      {
        new: true
      }
    )

    console.log("User after verification:", user);

    if (!user) {
      throw new ApiError(404, "User Not Found")
    }

    return res.status(200).send(`
            <h1>Verification Successful</h1>
            <p>Your account has been verified successfully!</p>
        `)
  } catch (error) {
    return res.status(500).send(`
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Successful</title>
  <style>
    body {
      background-color: #0d1117;
      color: #c9d1d9;
      font-family: "Fira Code", monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }

    .container {
      background: #161b22;
      padding: 2rem 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      text-align: center;
      max-width: 500px;
      border: 1px solid #30363d;
    }

    .check-icon {
      font-size: 4rem;
      color: #3fb950;
      animation: pop 0.4s ease-in-out;
    }

    @keyframes pop {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    h1 {
      margin: 1rem 0 0.5rem;
      font-size: 1.8rem;
      color: #58a6ff;
    }

    p {
      font-size: 1rem;
      line-height: 1.5;
      color: #8b949e;
    }

    .button {
      margin-top: 1.5rem;
      text-decoration: none;
      background: #238636;
      color: white;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s ease;
      display: inline-block;
    }

    .button:hover {
      background: #2ea043;
    }

    footer {
      margin-top: 2rem;
      font-size: 0.8rem;
      color: #6e7681;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="check-icon">✅</div>
    <h1>Verification Successful</h1>
    <p>Your token has been verified successfully. You can now proceed to access secured resources.</p>
    <a href="/" class="button">Continue</a>
  </div>
  <footer>© 2025 Developer Portal</footer>
</body>
</html>
`)
  }
})

const isVerifiedUser = asyncHandler(async (req, res) => {
  const { email } = req.params;

  console.log("Checking verification status for email:", email);

  if (!email || email.trim() === "") {
    throw new ApiError(400, "Email is required")
  }

  const user = await User.findOne({ email });
  console.log("User found for email verification check:", user.isVerified);

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "User is not verified");
  }

  const { accessToken, refreshToken } = generateTokens(user)

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    .json({
      isVerified: user.isVerified,
    })
})

const isLoggedInUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        success: req.user ? true : false,
        isLoggedIn: req.user ? true : false
      })
    )
})

const uploadAvatar = asyncHandler(async (req, res) => {

  if (!req.file) {
    throw new ApiError(400, "Avatar Image Is Required.")
  }
  const avatarLocalPath = req.file.path

  try {
    const uploadData = await uploadFileOnCloudinary(avatarLocalPath)
    if (uploadData.success === false) {
      throw new ApiError(500, uploadData.message || "Avatar Upload Failed")
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: uploadData.secure_url,
          avatarPublicId: uploadData.public_id
        }
      },
      {
        new: true
      }
    )

    if (!user) {
      throw new ApiError(500, "MongoDB Server Error While Uploading Avatar.")
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, "Avatar Uploaded Successfuly.")
      )

  } catch (error) {
    throw new ApiError(500, error.message)
  }

})

const deleteUserAvatar = asyncHandler(async (req, res) => {   // Header x-delete-only:"true"  if only deletion operation

  if (!req.user.avatar || !req.user.avatarPublicId) {
    throw new ApiError(400, "No Avatar To Delete.")
  }

  await deleteFileFromCloudinary(req.user.avatarPublicId)

  const avatarDeleted = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: "",
        avatarPublicId: ""
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  if (!avatarDeleted) {
    throw new ApiError(500, "Server Error While Deleting Avatar.")
  }

  if (req.headers["x-delete-only"] && req.headers["x-delete-only"] === "true") {
    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Avatar Deleted Successfully.")
      )
  }

  return {
    success: true,
    message: "Avatar Deleted Successfully."
  }


})

const getUserAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    throw new ApiError(404, "User Not Found")
  }

  return res.status(200).json({
    avatar: user.avatar
  })
})


const updateUserAvatar = asyncHandler(async (req, res) => {
  console.log("Avatar :", req.file)
  if (!req.file) {
    throw new ApiError(400, "Avatar Image is Required for Updating Avatar.")
  }

  const newAvatar = req.file.path

  // Delete existing avatar file from Cloudinary directly (avoid calling route handler)
  // try {
  //   if (req.user.avatarPublicId) {
  //     await deleteFileFromCloudinary(req.user.avatarPublicId)
  //   }
  // } catch (err) {
  //   // log but do not send a response here; allow update to proceed or fail at upload step
  //   console.error("Failed to delete previous avatar from Cloudinary:", err.message || err)
  // }

  const uploadData = await uploadFileOnCloudinary(newAvatar)

  if (uploadData.success === false) {
    throw new ApiError(500, uploadData.message)
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avtar: uploadData.secure_url,
        // avatarPublicId: uploadData.public_id
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  if (!user) {
    throw new ApiError(500, "Server Error While Updating Avatar.")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        _id: user._id,
        avtar: uploadData.secure_url
      })
    )

})


const getUserProfile = asyncHandler(async (req, res) => {

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $project: {
        name: 1,
        username: 1,
        avatar: 1,
        totalFollowers: 1,
        totalFollowing: 1,
        totalBlogs: 1,
        totalSavedBlogs: 1,
        bio: 1,
        skills: 1,
        location: 1,
        website: 1,
        githubUrl: 1,
        linkedinUrl: 1,
        twitterUrl: 1,
        createdAt: 1,
        joinedDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        }

      }
    }
  ])

  if (!user.length) {
    throw new ApiError(500, "Server Error While Fetching User Profile.")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0], "User Profile Fetched Successfully.")
    )

})

const getPublicUserProfile = asyncHandler(async (req, res) => {

  const userId = req.params.id

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Valid User Id Is Required.")
  }

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "follows",
        let: { userId: userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$followedBy", new mongoose.Types.ObjectId(req.user._id)]
                  },
                  {
                    $eq: ["$followTo", new mongoose.Types.ObjectId(userId)]
                  }
                ]
              }
            }
          }
        ],
        as: "follows",

      }
    },
    {
      $addFields: {
        isFollowed: {
          $cond: {
            if: { $gt: [{ $size: "$follows" }, 0] },
            then: true,
            else: false
          }
        }
      }
    }
    ,
    {
      $project: {
        name: 1,
        username: 1,
        avatar: 1,
        totalFollowers: 1,
        totalFollowing: 1,
        totalBlogs: 1,
        // "follows": 1,
        isFollowed: 1,
        // totalSavedBlogs: 1,
        bio: 1,
        skills: 1,
        location: 1,
        website: 1,
        githubUrl: 1,
        linkedinUrl: 1,
        twitterUrl: 1,
        createdAt: 1,
        joinedDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        }

      }
    }
  ])

  if (!user.length) {
    throw new ApiError(500, "Server Error While Fetching User Profile.")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0], "User Profile Fetched Successfully.")
    )

})

const updateUserProfile = asyncHandler(async (req, res) => {
  const {
    name,
    username,
    bio,
  } = req.body

  console.log("Update Profile Request Body =", req.body);

  if ((!name || (name && name.trim() === "")) && (!username || (username && username.trim() === "")) && (!bio || (bio && bio.trim() === ""))) {
    throw new ApiError(400, "Atleast 1 Filed is Required for Update.")
  }

  const updateFileds = {}

  if (name) {
    if (name.trim() !== "") {
      updateFileds.name = name
    }
  }

  if (username) {
    if (username.trim() !== "") {
      updateFileds.username = username
    }
  }

  if (bio) {
    if (bio.trim() !== "") {
      updateFileds.bio = bio
    }
  }

  const updatedProfile = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updateFileds
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  if (!updatedProfile) {
    throw new ApiError(500, "Server Error While Updating Profile Details.")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProfile, "Profile Updated Successfully.")
    )

})

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  console.log("Reset Password Request Body =", req.body);

  if (!email || (email && email.trim() === "")) {
    throw new ApiError(400, "Email is required")
  }

  if (!otp || (otp && otp.trim() === "") || (otp && otp.trim().length !== 6)) {
    throw new ApiError(400, "Valid OTP is required")
  }

  if (!newPassword || (newPassword && newPassword.trim() === "")) {
    throw new ApiError(400, "New Password is required")
  }

  const user = await User.findOne({
    email
  })

  console.log("User for Password Reset = ", user)

  if (!user) {
    throw new ApiError(404, "User with given email not found")
  }

  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
    throw new ApiError(400, "Please request for OTP to reset password")
  }

  if (Date.now() > user.resetPasswordOTPExpiry) {
    throw new ApiError(400, "OTP Expired. Please request for new OTP")
  }

  if (otp.trim() !== user.resetPasswordOTP.trim()) {
    throw new ApiError(400, "Invalid OTP")
  }

  if (otp.trim() === user.resetPasswordOTP.trim()) {
    if (Date.now() > user.resetPasswordOTPExpiry) {
      throw new ApiError(400, "OTP Expired. Please request for new OTP")
    }

    const { accessToken, refreshToken } = generateTokens(user);

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false })

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Password Reset Successful")
      )

  }

})

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");

  let users1 = users.filter(user => user._id.toString() !== req.user._id.toString())

  // console.log("All Users Fetched :",users);
  // console.log("loged in user:",req.user._id);


  return res.status(200).json(
    new ApiResponse(200, users1, "All Users Fetched Successfully.")
  )
})
const authMe = asyncHandler(async (req, res) => {

  const { accessToken, refreshToken } = req.cookies;

  try {

        const decodedToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET)

    const user = await User.findById(decodedToken._id).select("-password")

    if (!user) {
      throw new ApiError(401, "Unauthorize User.")
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Authorize User.")
      )

  } catch (error) {

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorize User.")
    }

    try {

      const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET)

      const user = await User.findById(decodedRefreshToken._id).select("-password")

      if (!user) {
        throw new ApiError(401, "Unauthorize User.")
      }

      if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Unauthorize User.")
      }

      const tokens = generateTokens(user)

      user.refreshToken = tokens.refreshToken
      await user.save({ validateBeforeSave: false })

      return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        .cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        .json(
          new ApiResponse(200, user, "Authorize User.")
        )

    } catch (err) {
      throw new ApiError(401, "Unauthorize User.")
    }

  }

})

const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  // console.log("Search Query :",query);

  if (!query || query && query.trim() === "") {
    throw new ApiError(400, "Search Query is Required.")
  }


  const users = await User.aggregate([
    {
      $match: {
        $and: [
          { _id: { $ne: req.user._id } },
          {
            $or: [
              { username: { $regex: query, $options: "i" } },
              { name: { $regex: query, $options: "i" } },
              { email: { $regex: query, $options: "i" } }
            ]
          }
        ]
      }
    },
    {
      $lookup: {
        from: "chats",
        localField: "_id",
        foreignField: "participants",
        as: "chats",
      }
    },

    {
      $addFields: {
        isFriend: {
          $cond: {
            if: {
              $gt: [
                { $size: "$chats" },
                0
              ]
            },
            then: true,
            else: false
          }
        }
      }
    },

    {
      $lookup: {
        from: "requests",
        let: {
          userId: "$_id",
          currentUserId: new mongoose.Types.ObjectId(req.user._id)
        },
        pipeline: [
          {
            $match: {
              $expr:
              {
                $or: [

                  {
                    $and: [
                      { $eq: ["$sender", "$$userId"] },
                      { $eq: ["$receiver", "$$currentUserId"] }
                    ]
                  },
                  {
                    $and: [
                      { $eq: ["$sender", "$$currentUserId"] },
                      { $eq: ["$receiver", "$$userId"] }
                    ]
                  }

                ]
              },
              status: "pending",
              type: "DIRECT_CHAT_REQUEST"
            }
          },
          {
            $project: {
              status: 1,
              type: 1,
              sender: 1,
              receiver: 1
            }
          }
        ],
        as: "requests"
      }
    },

    {
      $project: {
        name: 1,
        username: 1,
        avtar: 1,
        isFriend: 1,
        requests: 1
      }
    }
  ])

  if (!users.length) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, [], "No Users Found Matching the Query.")
      )
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, users, "Users Fetched Successfully.")
    )

})

const getOnlinePartners = asyncHandler(async (req, res) => {

  const partners = await getUserChatPartners(req.user._id)

  let onlineUsers = []

  for (let partner of partners) {
    if (getUserSocket(partner.toString())) {
      onlineUsers.push(partner.toString())
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, onlineUsers, "Online Users Fetched Successfully.")
    )

})

export {
  registerUser,
  verifyUser,
  isVerifiedUser,
  loginUser,
  isLoggedInUser,
  logoutUser,
  uploadAvatar,
  getUserAvatar,
  getUserProfile,
  updateUserProfile,
  deleteUserAvatar,
  updateUserAvatar,
  getPublicUserProfile,
  sendOTP,
  resetPassword,
  resendEmailVerification,
  getAllUsers,
  authMe,
  searchUsers,
  getOnlinePartners
}
