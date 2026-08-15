import mongoose from "mongoose";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config({ path: "./.env" })

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
    avtar: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/previews/024/983/914/non_2x/simple-user-default-icon-free-png.png"
    },
    bio: {
        type: String,
        default: ""
    },
    refreshToken: {
        type: String,
    },
    lastActive: {
        type: Date
    },
    isUnreadNotification:{
        type: Boolean,
        default: false
    },
    lastNotificationRead: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    }
},
    { timestamps: true })

userSchema.pre("save", async function () {

    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10)


})

userSchema.methods.isCorrectPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.EXPIRES_IN_REFRESH_TOKEN }
    )
}

export const User = mongoose.model("User", userSchema);