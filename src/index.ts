import { config } from "./config.ts";
import logger from "./log.ts";
import { getApplicationCount, getApplicationDraftCount } from "./firebase.ts";
import * as discord from "./discord.ts";

/**
 * Start the application
 */
const start = async () => {
  try {
    logger.success("Environment configuration loaded.");

    try {
      const apps = await getApplicationCount();
      const drafts = await getApplicationDraftCount();
      logger.success(`Connected to Firestore. apps=${apps}, drafts=${drafts}`);

    } catch (error) {
      logger.err("Failed to connect to Firestore:", error);
      process.exit(1);
    }

    await discord.start();
    logger.success("Discord bot is live!");

  } catch (error) {
    logger.err("Failed to start application:", error);
    process.exit(1);
  }
}

/**
 * Handle shutdown
 */
const handleShutdown = () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
}

logger.info("Starting Discord bot with Firestore integration...");
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

process.on("unhandledRejection", (reason, promise) => {
  logger.err("Unhandled Promise Rejection for:", reason);
});

process.on("uncaughtException", (error) => {
  logger.err("Uncaught Exception:", error);
  handleShutdown();
});

start();
