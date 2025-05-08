import { startBot } from './bot/client';
import firestoreService from './db/firebase';
import { config } from './config';

console.log('Starting Discord bot with Firestore integration...');

// Handle process termination signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  handleShutdown();
});

/**
 * Start the application
 */
async function startApp() {
  try {
    // Validate environment variables
    console.log('Environment configuration loaded.');
    
    // Test Firebase connection by listing collections
    try {
      const collections = await firestoreService.listCollections();
      console.log(`Connected to Firestore. Available collections: ${collections.length}`);
    } catch (error) {
      console.error('Failed to connect to Firestore:', error);
      process.exit(1);
    }
    
    // Start Discord bot
    await startBot();
    
    console.log('Discord bot with Firestore integration is now running!');
    console.log(`Use "${config.COMMAND_PREFIX}help" to see available commands.`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
function handleShutdown() {
  console.log('Shutting down gracefully...');
  // Any cleanup code here
  
  process.exit(0);
}

// Start the application
startApp();

