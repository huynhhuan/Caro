import express from "express";
import * as userCtrl from "../controllers/user.controller.js";

const router = express.Router();

// Tạo user mới
router.post("/", userCtrl.registerUser);

// Login bằng username + pass
router.post("/login", userCtrl.loginUser);

// Get all users
router.get("/", userCtrl.getUsers);


// Update user by userId
router.put("/:userId", userCtrl.updateUser); 

export default router;
