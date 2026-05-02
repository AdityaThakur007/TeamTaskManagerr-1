import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer = null;

const connectDB = async () => {
  try {
    // Try real MongoDB first (for production / Atlas / local install)
    if (process.env.MONGO_URI && process.env.MONGO_URI !== "mongodb://localhost:27017/taskify_db") {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }

    // Try local MongoDB
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/taskify_db", {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch {
      console.log("Local MongoDB not available, starting in-memory database...");
    }

    // Fallback: In-memory MongoDB for development
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB In-Memory Connected: ${conn.connection.host}`);
    console.log("⚠️  Data will be lost when server stops. Set MONGO_URI to Atlas for persistence.");
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

export default connectDB;
