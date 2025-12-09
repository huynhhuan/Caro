import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    await mongoose.connect(`${process.env.MONGODB_URI}/caro`);
  } catch (error) {
    console.error("Lỗi kết nối DB:", error.message);
  }
};

export default connectDB;
