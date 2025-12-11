import mongoose from "mongoose";

const MoveSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },

    moveIndex: {
      type: Number,
      required: true,
    },

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

    x: {
      type: Number,
      required: true,
    },

    y: {
      type: Number,
      required: true,
    },

    timeTakenMs: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Move", MoveSchema);
