// routes/room.routes.js
import { Router } from "express";
import {
  createFriendRoom,
  joinFriendRoomByCode,
  setPlayerReady,
} from "../controllers/room.controller.js";

const router = Router();

// User A tạo phòng friend
router.post("/friend", createFriendRoom);

// User B join bằng roomCode
router.post("/friend/join", joinFriendRoomByCode);

// player nhấn Bắt đầu -> isReady = true
router.post("/ready", setPlayerReady);

export default router;
