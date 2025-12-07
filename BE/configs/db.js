import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    await mongoose.connect(`mongodb+srv://db_game_caro:caropassword@dbcaro.cljiww1.mongodb.net/?appName=dbcaro`);
  } catch (error) {
    console.error("Lỗi kết nối DB:", error.message);
  }
};

export default connectDB;
