import express from "express";
import * as userCtrl from "../controllers/user.controller.js";

const router = express.Router();

// Create user
router.post("/", userCtrl.createUser);

// Get all users
router.get("/", userCtrl.getUsers);

// Get user by userId
router.get("/:userId", userCtrl.getUserById);

// Update user by userId
router.put("/:userId", userCtrl.updateUser); 

export default router;
