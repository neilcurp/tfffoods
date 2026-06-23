import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log("Using cached database connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Creating new database connection...");
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log("Connected to MongoDB");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", {
          error,
          stack: error.stack,
          uri: MONGODB_URI!.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"), // Hide credentials
        });
        cached.promise = null;
        throw error;
      });
  }

  try {
    console.log("Waiting for database connection...");
    cached.conn = await cached.promise;
    console.log("Database connection established");
    return cached.conn;
  } catch (error) {
    console.error("Failed to establish database connection:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    cached.promise = null;
    throw error;
  }
}

// Add connection event handlers
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", {
    error,
    stack: error instanceof Error ? error.stack : undefined,
  });
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
  cached.conn = null;
  cached.promise = null;
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed through app termination");
  process.exit(0);
});

export default connectDB;
