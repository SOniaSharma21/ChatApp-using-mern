import express from "express";
import {
  signup,
  login,
  updateProfile,
  checkAuth
} from "../controllers/userController.js"; // added .js + imported all needed functions
import { protectRoute } from "../middleware/auth.js"; // also add .js if needed

const userRouter = express.Router();

userRouter.post("/signup",signup);
userRouter.post("/login",login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;
