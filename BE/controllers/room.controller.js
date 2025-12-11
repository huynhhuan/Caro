// controllers/room.controller.js
import mongoose from "mongoose";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Match from "../models/Match.js";

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

async function createNewMatchForRoom(room) {
  const playerX = room.players.find((p) => p.symbol === "X");
  const playerO = room.players.find((p) => p.symbol === "O");

  if (!playerX || !playerO) {
    throw new Error("Room must have both X and O players to start a new match");
  }

  const now = new Date();

  const match = await Match.create({
    roomId: room._id,
    players: {
      X: playerX.userId,
      O: playerO.userId,
    },
    config: {
      boardSize: room.config.boardSize,
      timePerTurnSec: room.config.timePerTurnSec,
    },
    result: {
      status: "playing",
      winnerUserId: null,
      winnerSymbol: null,
      winningLine: [],
    },
  });

  room.status = "playing";
  room.currentMatchId = match._id;
  // giữ nguyên isReady = true cho cả 2 (vì vừa bấm “Đấu lại”)
  await room.save();

  return match;
}

/**
 * POST /rooms/decision
 * body: { roomId, userId, action: "rematch" | "leave" }
 *
 * - rematch: user đồng ý đấu tiếp (set isReady = true, nếu cả 2 true -> tạo match mới)
 * - leave: user rời phòng (không đấu tiếp)
 */
export const decideRematchOrLeave = async (req, res) => {
  try {
    const { roomId, userId, action } = req.body;

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid roomId" });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (!["rematch", "leave"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // === CASE 1: REMATCH (ĐẤU TIẾP) ===
    if (action === "rematch") {
      // chỉ cho rematch khi room đang waiting (vừa xong ván)
      if (room.status !== "waiting") {
        return res
          .status(400)
          .json({ message: "Room is not in waiting state for rematch" });
      }

      const player = room.players.find((p) => p.userId.toString() === userId);

      if (!player) {
        return res.status(404).json({ message: "Player not in this room" });
      }

      // user này đồng ý đấu lại
      player.isReady = true;

      const allReady =
        room.players.length === 2 &&
        room.players.every((p) => p.isReady === true);

      let match = null;

      if (allReady) {
        // cả 2 đã đồng ý -> tạo match mới
        match = await createNewMatchForRoom(room);
      } else {
        // mới 1 người đồng ý -> chỉ lưu lại state ready
        await room.save();
      }

      return res.json({
        message: "Decision processed (rematch)",
        data: {
          roomId: room._id,
          status: room.status,
          players: room.players,
          allReady,
          matchId: match ? match._id : null,
        },
      });
    }

    // === CASE 2: LEAVE (RỜI PHÒNG / KHÔNG ĐẤU TIẾP) ===
    if (action === "leave") {
      const beforeCount = room.players.length;

      room.players = room.players.filter((p) => p.userId.toString() !== userId);

      const afterCount = room.players.length;

      if (beforeCount === afterCount) {
        return res.status(404).json({ message: "Player not in this room" });
      }

      // Nếu không còn ai -> kết thúc phòng
      if (afterCount === 0) {
        room.status = "finished";
        room.currentMatchId = null;
      } else if (afterCount === 1) {
        // còn 1 người -> phòng waiting, reset isReady thằng còn lại
        room.status = "waiting";
        room.currentMatchId = null;
        room.players[0].isReady = false;
      } else {
        // phòng hơn 2 người -> set waiting
        room.status = "waiting";
        room.currentMatchId = null;
        room.players.forEach((p) => {
          p.isReady = false;
        });
      }

      await room.save();

      return res.json({
        message: "Decision processed (leave)",
        data: {
          roomId: room._id,
          status: room.status,
          players: room.players,
        },
      });
    }
  } catch (error) {
    console.error("decideRematchOrLeave error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
