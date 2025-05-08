import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Events, 
  ActivityType,
  Message,
  ClientOptions
} from 'discord.js';
import { config } from '../config';
import { commandHandler } from '../commands/handler';

// Configure client options with required intents
const clientOptions: ClientOptions = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message
  ],
  // Reconnection configuration
  failIfNotExists: false,
  rest: {
    retries: 3,
    timeout: 15000
  }
};

// Create Discord client instance
export const client = new Client(clientOptions);

// Connection status tracking
let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize the Discord bot client and set up event handlers
 */
async function initializeClient(): Promise<void> {
  // Ready event handler
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Discord bot logged in as ${readyClient.user.tag}`);
    console.log(`Connected to ${readyClient.guilds.cache.size} servers`);
    
    // Set bot presence
    readyClient.user.setPresence({
      activities: [{ 
        name: 'Firestore data', 
        type: ActivityType.Watching 
      }],
      status: 'online'
    });
    
    // Reset reconnection state
    isReconnecting = false;
    reconnectAttempts = 0;
  });
  
  // Message event handler
  client.on(Events.MessageCreate, async (message: Message) => {
    try {
      // Ignore bot messages
      if (message.author.bot) return;
      
      // Process commands starting with the configured prefix
      if (message.content.startsWith(config.COMMAND_PREFIX)) {
        await commandHandler(message);
      }
    } catch (error) {
      console.error('Error handling message event:', error);
      
      // Respond to the user if possible
      try {
        if (message.channel.isTextBased()) {
          await message.reply({
            content: 'An error occurred while processing your command.'
          }).catch(err => {
            console.error('Failed to send error message:', err);
          });
        }
      } catch (replyError) {
        console.error('Failed to send error response:', replyError);
      }
    }
  });
  
  // Error event handler
  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
    
    // Attempt reconnection if not already in progress
    if (!isReconnecting) {
      attemptReconnect();
    }
  });
  
  // Debug event handler (optional)
  if (process.env.NODE_ENV === 'development') {
    client.on(Events.Debug, (info) => {
      console.log('Discord Debug:', info);
    });
  }
  
  // Warning event handler
  client.on(Events.Warn, (info) => {
    console.warn('Discord Warning:', info);
  });
}

/**
 * Attempt to reconnect to Discord
 */
async function attemptReconnect(): Promise<void> {
  // Avoid multiple reconnection attempts
  if (isReconnecting) return;
  
  isReconnecting = true;
  reconnectAttempts++;
  
  console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
  
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    console.error('Maximum reconnection attempts reached. Giving up.');
    process.exit(1);
    return;
  }
  
  try {
    // Destroy the old client if it exists
    if (client) {
      try {
        await client.destroy();
      } catch (error) {
        console.error('Error destroying client:', error);
      }
    }
    
    // Wait before reconnecting
    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
    console.log(`Waiting ${backoffTime}ms before reconnecting...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    // Attempt to log in again
    await client.login(config.DISCORD_TOKEN);
  } catch (error) {
    console.error('Failed to reconnect:', error);
    
    // Schedule another reconnection attempt
    setTimeout(attemptReconnect, 5000);
  }
}

/**
 * Start the Discord bot
 */
export async function startBot(): Promise<void> {
  try {
    // Set up event handlers
    await initializeClient();
    
    // Login to Discord
    console.log('Connecting to Discord...');
    await client.login(config.DISCORD_TOKEN);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to start bot:', error);
    return Promise.reject(error);
  }
}

export default client;

