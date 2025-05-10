import { config } from "./config.ts";
import { getApplicationCount, getApplicationDraftCount } from "./firebase.ts";

console.log("ℹ Starting Discord bot with Firestore integration...");
// process.on("SIGINT", handleShutdown);
// process.on("SIGTERM", handleShutdown);

// process.on("unhandledRejection", (reason, promise) => {
//   console.error("Unhandled Rejection at:", promise, "reason:", reason);
// });

// process.on("uncaughtException", (error) => {
//   console.error("Uncaught Exception:", error);
//   handleShutdown();
// });

/**
 * Start the application
 */
const startApp = async () => {
  try {
    console.log("✅ Environment configuration loaded.");

    try {
      const apps = await getApplicationCount();
      const drafts = await getApplicationDraftCount();
      console.log(`✅ Connected to Firestore. apps=${apps}, drafts=${drafts}`);

    } catch (error) {
      console.error("❌ Failed to connect to Firestore:", error);
      process.exit(1);
    }

    console.log("✅ Discord bot is live!");
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

/**
 * Handle shutdown
 */
const handleShutdown = () => {
  console.log("ℹ Shutting down gracefully...");
  process.exit(0);
}

startApp();
