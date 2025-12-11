import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    players: {
      X: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      O: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },

    // copy từ room tại thời điểm start
    config: {
      boardSize: { type: Number, required: true },
      timePerTurnSec: { type: Number, required: true },
    },

    result: {
      status: {
        type: String,
        enum: ["playing", "X_win", "O_win", "draw", "timeout_X", "timeout_O"],
        default: "playing",
      },
      winnerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      winnerSymbol: {
        type: String,
        enum: ["X", "O", null],
        default: null,
      },
      winningLine: [
        {
          x: Number,
          y: Number,
          _id: false,
        },
      ],
    },

    pointsChange: {
      X: { type: Number, default: 0 },
      O: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Match", MatchSchema);
