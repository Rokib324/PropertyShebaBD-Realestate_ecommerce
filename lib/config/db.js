import mongoose from "mongoose";

// Cache the connection to reuse in serverless environments (Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      const errorMsg = "MONGODB_URI is not defined in environment variables. Please set MONGODB_URI in your .env or .env.local file (e.g., MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/propertyshebabd or mongodb://127.0.0.1:27017/propertyshebabd).";
      console.error("❌", errorMsg);
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        console.warn("⚠️ MONGODB_URI is not defined. Database operations will fail at runtime.");
      }
      throw new Error(errorMsg);
    }

    // If already connected, return cached connection
    if (cached.conn) {
      return cached.conn;
    }

    // If connection is in progress, wait for it
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      };

      cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
        console.log("Connected to MongoDB");
        return mongoose;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (error.message && (error.message.includes("SSL alert") || error.message.includes("ServerSelectionError"))) {
      console.error("\n💡 MongoDB Atlas Connection Blocked: Your IP address is not whitelisted in MongoDB Atlas.");
      console.error("👉 Fix: Go to MongoDB Atlas → Network Access → Add IP Address (add current IP or 0.0.0.0/0).\n");
    }
    throw error;
  }
};

export default connectDB;