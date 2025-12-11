import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    pass: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
      elo: { type: Number, default: 1000 },
    },

    status: {
      type: String,
      default: "offline",
    },
  },
  { timestamps: true }
  
);

UserSchema.pre("save", async function () {
  if (!this.userId) {
    this.userId = "U" + Math.random().toString(36).substring(2, 10).toUpperCase();
  }
});


export default mongoose.model("User", UserSchema);
