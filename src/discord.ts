import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
  Message,
  ClientOptions
} from 'discord.js';
import { config } from './config';

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

export const client = new Client(clientOptions);
let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize the Discord bot client and set up event handlers
 */
const init = async (): Promise<void> => {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Discord bot logged in as ${readyClient.user.tag}`);
    console.log(`✅ Connected to ${readyClient.guilds.cache.size} servers`);

    readyClient.user.setPresence({
      activities: [{
        name: 'Test',
        type: ActivityType.Watching
      }],
      status: 'online'
    });

    isReconnecting = false;
    reconnectAttempts = 0;
  });

  client.on(Events.Error, (error) => {
    console.error('❌ Discord client error:', error);
    if (!isReconnecting) {
      attemptReconnect();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    client.on(Events.Debug, (info) => {
      console.log('Discord Debug:', info);
    });
  }

  client.on(Events.Warn, (info) => {
    console.warn('⚠ Discord Warning:', info);
  });
}

/**
 * Attempt to reconnect to Discord
 */
const attemptReconnect = async (): Promise<void> => {
  if (isReconnecting) return;

  isReconnecting = true;
  reconnectAttempts++;
  console.log(`⚡ Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    console.error('⚡ Maximum reconnection attempts reached. Giving up.');
    process.exit(1);
    return;
  }

  try {
    if (client) {
      await client.destroy();
    }

    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
    console.log(`⌛ Waiting ${backoffTime}ms before reconnecting...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    await client.login(config.DISCORD_TOKEN);

  } catch (error) {
    console.error('⌛ Failed to reconnect:', error);
    setTimeout(attemptReconnect, 5000);
  }
}

/**
 * Start the Discord bot
 */
const startBot = async (): Promise<void> => {
  try {
    await init();
    console.log('⚡ Connecting to Discord...');
    await client.login(config.DISCORD_TOKEN);
    return Promise.resolve();

  } catch (error) {
    console.error('Failed to start bot:', error);
    return Promise.reject(error);
  }
}

export default client;
