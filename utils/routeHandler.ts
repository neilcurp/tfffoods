import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "./database";
import { logger } from "./logger";
import mongoose from "mongoose";

interface RouteHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  maxRetries?: number;
}

/**
 * Maps a thrown error to the appropriate JSON response + status code.
 * Kept separate so the control flow in `withDatabaseConnection` stays simple.
 */
function errorToResponse(error: unknown): NextResponse {
  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json(
      { error: "Validation error", details: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return NextResponse.json(
      { error: "Invalid ID format", details: error.message },
      { status: 400 }
    );
  }

  // Duplicate key error
  if (
    error instanceof Error &&
    error.name === "MongoServerError" &&
    (error as any).code === 11000
  ) {
    return NextResponse.json(
      { error: "Duplicate entry", details: error.message },
      { status: 409 }
    );
  }

  if (error instanceof mongoose.Error) {
    return NextResponse.json(
      { error: "Database error", details: error.message },
      { status: 500 }
    );
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    if (error.message === "User not authenticated") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (error.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (error.message === "Product not found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (error.message === "Invalid product id") {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }
    if (error.message === "Missing required fields") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (error.message === "User already exists") {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }
  }

  // Surface the real message so the client isn't left with an opaque 500.
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Operation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 }
  );
}

/**
 * Establishes the DB connection (with retries) and then runs `handler` EXACTLY
 * ONCE.
 *
 * The connection step is safe to retry because it never touches the request.
 * The handler must NOT be retried: a Request body is a single-use stream, so
 * re-running a handler that calls `request.json()` throws
 * "Body is unusable: Body has already been read" — which previously masked the
 * real error and made every body-reading mutation fail. Running once also
 * prevents a transient error from accidentally double-executing a mutation.
 */
export async function withDatabaseConnection<T>(
  handler: () => Promise<T>,
  options: RouteHandlerOptions = {}
): Promise<NextResponse> {
  const { maxRetries = 3 } = options;

  let connectionError: unknown = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connectToDatabase();
      const isConnected = await waitForConnection();
      if (isConnected) {
        connectionError = null;
        break;
      }
      connectionError = new Error("Database connection timeout");
    } catch (error) {
      connectionError = error;
      logger.error(
        `Database connection failed (attempt ${attempt}/${maxRetries})`,
        error
      );
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (connectionError) {
    logger.error("Failed to establish database connection", connectionError);
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }

  try {
    const result = await handler();
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Operation failed", error);
    return errorToResponse(error);
  }
}

export function createRouteHandler(options: RouteHandlerOptions = {}) {
  return async function routeHandler<T>(
    handler: () => Promise<T>
  ): Promise<NextResponse> {
    return withDatabaseConnection(handler, options);
  };
}
