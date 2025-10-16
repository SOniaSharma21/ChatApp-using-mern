import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import express from "express";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;
    console.log("Backend data", req.body);
    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" })
        }
        const exisitingUser = await User.findOne({ email });
        if (exisitingUser) {
            return res.json({ success: false, message: "Account already exists" })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({
            fullName, email, password: hashedpassword, bio
        });
        console.log("Backend user", newUser._id);
        const token = generateToken(newUser._id)
        console.log("user", newUser.toObject())
        res.json({
            success: true,
            userData: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                bio: newUser.bio,
                profilepic: newUser.profilepic || null,
            },
            token,
            message: "Account created successfully",
        });
    }
    catch (error) {
        console.log("from signup",error.message);
        res.json({ success: false, message: error.message })

    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email })
        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "invalid credentials" });

        }
        const token = generateToken(userData._id)
        res.json({ success: true, userData, token, message: "login successfully " })

    }
    catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })


    }
}
export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
}
export const updateProfile = async (req, res) => {
    try {
        const { profilepic, bio, fullName } = req.body;
        const userId = req.user._id;
        let updatedUser;
        if (!profilepic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true })
        }
        else {
            const upload = await cloudinary.uploader.upload(profilepic);
            updatedUser = await User.findByIdAndUpdate(userId, { profilepic: upload.secure_url, bio, fullName }, { new: true });
        }
        res.json({ success: true, user: updatedUser })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}
