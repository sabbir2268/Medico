import { createServer } from "node:http";
import app from "./src/app.js";
import { env, isProduction } from "./src/config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
  registerDatabaseEventHandlers,
} from "./src/config/database.js";
import { logger } from "./src/utils/logger.js";
let httpServer = null;
let isShuttingDown = false;

async function startServer() {
  registerDatabaseEventHandlers();
  try {
    await connectDatabase();
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (isProduction) {
      // A live instance with no database is worse than a failed deploy: Render
      // will restart/report the failure and /api/health can never go green.
      logger.error(
        "Refusing to start in production without MongoDB. Check MONGODB_URI, Atlas credentials and network access.",
      );
      process.exitCode = 1;
      return;
    }
    logger.warn(
      "Starting in degraded mode; /api/health will report the database as unavailable.",
    );
  }
  httpServer = createServer(app);
  await new Promise((resolve, reject) => {
    const onError = (error) => reject(error);
    httpServer.once("error", onError);
    httpServer.listen(env.port, () => {
      httpServer.off("error", onError);
      resolve();
    });
  });
  logger.info(`Server listening on port ${env.port} in ${env.nodeEnv} mode`);
}

async function shutdown(signal = "SIGTERM", exitCode = 0) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);
  if (httpServer?.listening) {
    await new Promise((resolve) => httpServer.close(resolve));
    logger.info("HTTP server closed.");
  }
  try {
    await disconnectDatabase();
  } catch (error) {
    logger.error(`Error while closing MongoDB connection: ${error.message}`);
  }
  logger.info("Graceful shutdown complete.");
  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason?.stack || reason}`);
  shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error.stack || error}`);
  shutdown("uncaughtException", 1);
});

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.stack || error.message}`);
  process.exitCode = 1;
});
