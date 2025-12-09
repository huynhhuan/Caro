import mongoose from "mongoose";
import { generateUniqueRoomCode } from "../utils/generateRoomCode.js";

const PlayerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      enum: ["X", "O"],
      required: true,
    },
    isReady: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["quick", "friend"],
      required: true,
    },

    // Mã phòng để nhập (chỉ dùng cho friend)
    roomCode: {
      type: String,
      unique: true,
      sparse: true, // chỉ friend room mới có
    },

    players: {
      type: [PlayerSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },

    config: {
      boardSize: { type: Number, default: 30 },
      timePerTurnSec: { type: Number, default: 30 },
    },

    currentMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
    },
  },
  { timestamps: true }
);

RoomSchema.pre("save", async function () {
  // Chỉ sinh mã cho room friend và chưa có roomCode
  if (this.type !== "friend" || this.roomCode) return;
  // Sinh mã phòng duy nhất
  this.roomCode = await generateUniqueRoomCode();
});
export default mongoose.model("Room", RoomSchema);
