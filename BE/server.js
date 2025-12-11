import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import connectCloudinary from "./configs/cloudinary.js";
import userRoutes from "./routes/user.routes.js";
import roomRoute from "./routes/room.routes.js";
import matchRoutes from "./routes/match.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

await connectDB();
await connectCloudinary();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  const { name } = req.body;
  res.send(`Caro Game Backend is running ${name}`);
});

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoute);
app.use("/api/matches", matchRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
