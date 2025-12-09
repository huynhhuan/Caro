// controllers/room.controller.js
import mongoose from "mongoose";
import Room from "../models/Room.js";
import User from "../models/User.js";

/**
 * POST /rooms/friend
 * body: { userId, boardSize?, timePerTurnSec? }
 * → User A tạo phòng friend, trở thành player X, nhận về roomCode để share cho bạn
 */
export const createFriendRoom = async (req, res) => {
  try {
    const { userId, boardSize, timePerTurnSec } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const room = await Room.create({
      type: "friend",
      players: [
        {
          userId,
          symbol: "X", // chủ phòng cầm X
          isReady: false,
        },
      ],
      config: {
        boardSize: boardSize || 30,
        timePerTurnSec: timePerTurnSec || 30,
      },
      // status: "waiting" (default)
    });

    return res.status(201).json({
      message: "Friend room created",
      data: room,
    });
  } catch (error) {
    console.error("createFriendRoom error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /rooms/friend/join
 * body: { userId, roomCode }
 * → User B nhập roomCode để join vào phòng
 */
export const joinFriendRoomByCode = async (req, res) => {
  try {
    const { userId, roomCode } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (!roomCode || typeof roomCode !== "string") {
      return res.status(400).json({ message: "Invalid roomCode" });
    }

    const trimmedCode = roomCode.trim();

    // Tìm phòng friend còn đang waiting
    const room = await Room.findOne({
      type: "friend",
      roomCode: trimmedCode,
      status: "waiting",
    });

    if (!room) {
      return res
        .status(404)
        .json({ message: "Room not found or not available" });
    }

    // Check user đã trong phòng chưa
    const alreadyIn = room.players.some((p) => p.userId.toString() === userId);

    if (alreadyIn) {
      return res.status(200).json({
        message: "User already in this room",
        data: {
          roomMongoId: room._id,
          roomCode: room.roomCode,
          players: room.players,
          status: room.status,
          config: room.config,
        },
      });
    }

    // Check full phòng (2 người)
    if (room.players.length >= 2) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Gán symbol cho user mới
    const usedSymbols = room.players.map((p) => p.symbol);
    const symbol = usedSymbols.includes("X") ? "O" : "X";

    room.players.push({
      userId,
      symbol,
      isReady: false,
    });

    await room.save();

    return res.json({
      message: "Joined room successfully",
      data: {
        roomMongoId: room._id,
        roomCode: room.roomCode,
        players: room.players,
        status: room.status,
        config: room.config,
      },
    });
  } catch (error) {
    console.error("joinFriendRoomByCode error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /rooms/ready
 * body: { roomId, userId }
 * - Đánh dấu player trong room là isReady = true
 * - Nếu đủ 2 người và cả 2 isReady = true -> room.status = "playing"
 */
export const setPlayerReady = async (req, res) => {
  try {
    const { roomId, userId } = req.body;

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Chỉ cho ready khi room đang waiting
    if (room.status !== "waiting") {
      return res.status(400).json({ message: "Room is not in waiting status" });
    }

    // Tìm player tương ứng trong room
    const player = room.players.find((p) => p.userId.toString() === userId);

    if (!player) {
      return res.status(404).json({ message: "Player not in this room" });
    }

    // Đánh dấu đã sẵn sàng
    player.isReady = true;

    // Kiểm tra nếu đủ 2 người & cả 2 cùng ready -> chuyển room sang playing
    const allReady =
      room.players.length === 2 &&
      room.players.every((p) => p.isReady === true);

    if (allReady) {
      room.status = "playing";
    }

    await room.save();

    return res.json({
      message: "Player ready status updated",
      data: {
        roomId: room._id,
        status: room.status,
        players: room.players,
        allReady,
      },
    });
  } catch (error) {
    console.error("setPlayerReady error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
