// routes/room.routes.js
import { Router } from "express";
import {
  createFriendRoom,
  decideRematchOrLeave,
  joinFriendRoomByCode,
} from "../controllers/room.controller.js";

const router = Router();

// User A tạo phòng friend
router.post("/friend", createFriendRoom);

// User B join bằng roomCode
router.post("/friend/join", joinFriendRoomByCode);

// User quyết định chơi lại hoặc rời phòng
router.post("/decision", decideRematchOrLeave);

export default router;
