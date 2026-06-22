import mongoose from "mongoose";
import { logger } from "./logger";
import { ensureModelsAreRegistered } from "./models";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

interface GlobalMongo {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: GlobalMongo;
}

// Initialize the global mongoose object if it doesn't exist
if (!global.mongooseGlobal) {
  global.mongooseGlobal = { conn: null, promise: null };
}

// Now we know cached will always be defined
const cached = global.mongooseGlobal;

export async function connectToDatabase() {
  if (cached.conn) {
    logger.info("Using cached database connection");
    return cached.conn;
  }

  if (!cached.promise) {
    logger.info("Creating new database connection...");
    const opts = {
      bufferCommands: false,
      maxPoolSize: 50, // Increased from 10
      minPoolSize: 5, // Keep minimum connections alive
      serverSelectionTimeoutMS: 10000, // Increased from 5000
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4,
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: 60000, // Close idle connections after 60s
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        logger.info("Connected to MongoDB");
        ensureModelsAreRegistered();
        return mongoose;
      })
      .catch((error) => {
        logger.error("MongoDB connection error:", {
          error,
          stack: error.stack,
          uri: MONGODB_URI!.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"), // Hide credentials
        });
        cached.promise = null;
        throw error;
      });
  }

  try {
    logger.info("Waiting for database connection...");
    cached.conn = await cached.promise;
    logger.info("Database connection established");
    return cached.conn;
  } catch (error) {
    logger.error("Failed to establish database connection:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    cached.promise = null;
    throw error;
  }
}

export async function waitForConnection(
  timeout: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (cached.conn) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  logger.warn("Database connection timeout after", { timeout });
  return false;
}

export async function disconnectFromDatabase() {
  if (cached.conn) {
    try {
      await cached.conn.disconnect();
      logger.info("Disconnected from MongoDB");
      cached.conn = null;
      cached.promise = null;
    } catch (error) {
      logger.error("Error disconnecting from MongoDB:", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}

// Register connection event handlers EXACTLY ONCE.
//
// In dev, Next.js/Turbopack evaluates this module in several compiled bundles
// (route runtime, proxy.ts context, HMR reloads). Without this guard each
// evaluation re-attaches the listeners, so a single connection event gets
// logged N times (the "disconnected ×3 / connected ×3" noise in the terminal).
declare global {
  // eslint-disable-next-line no-var
  var mongooseListenersRegistered: boolean | undefined;
}

if (!global.mongooseListenersRegistered) {
  global.mongooseListenersRegistered = true;

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected successfully");
  });

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
  });

  mongoose.connection.on("disconnected", () => {
    logger.info("MongoDB disconnected");
    cached.conn = null;
    cached.promise = null;
  });

  process.on("SIGINT", async () => {
    await disconnectFromDatabase();
    logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  });
}
