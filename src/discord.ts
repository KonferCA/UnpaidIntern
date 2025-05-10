import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
  TextChannel,
  ClientOptions
} from "discord.js";
import { config } from "./config.ts";
import logger from "./log.ts";
import { getApplicationCount, getApplicationDraftCount } from "./firebase.ts";

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
 * Start the Discord bot
 */
export const start = async (): Promise<void> => {
  try {
    await init();
    logger.info("Connecting to Discord...");
    await client.login(config.DISCORD_TOKEN);
    return Promise.resolve();

  } catch (error) {
    logger.err("Failed to start bot:", error);
    return Promise.reject(error);
  }
}

/**
 * Initialize the Discord bot client and set up event handlers
 */
export const init = async (): Promise<void> => {
  client.once(Events.ClientReady, async (readyClient) => {
    logger.success(`Discord bot logged in as ${readyClient.user.tag}`);
    logger.success(`Connected to ${readyClient.guilds.cache.size} servers`);
    readyClient.user.setPresence({
      activities: [{
        name: "Checking SpurHacks Applications",
        url: "https://spurhacks.com",
        type: ActivityType.Custom
      }],
      status: "online"
    });

    isReconnecting = false;
    reconnectAttempts = 0;
    updateMessage();
  });

  client.on(Events.Error, (error) => {
    logger.err("Discord client error:", error);
    if (!isReconnecting) {
      attemptReconnect();
    }
  });

  client.on(Events.Warn, (info) => {
    logger.warn("Discord API Warning:", info);
  });

  if (process.env.NODE_ENV === "development") {
    client.on(Events.Debug, (info) => {
      logger.debug("Discord Debug:", info);
    });
  }


}

/**
 * Attempt to reconnect to Discord
 */
export const attemptReconnect = async (): Promise<void> => {
  if (isReconnecting) return;

  isReconnecting = true;
  reconnectAttempts++;
  logger.info(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    logger.err("Maximum reconnection attempts reached. Giving up.");
    process.exit(1);
    return;
  }

  try {
    if (client) {
      await client.destroy();
    }

    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
    logger.info(`Waiting ${backoffTime}ms before reconnecting...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    await client.login(config.DISCORD_TOKEN);

  } catch (error) {
    logger.err("Failed to reconnect:", error);
    setTimeout(attemptReconnect, 5000);
  }
}

export const updateMessage = async () => {
    const server = await client.guilds.fetch(config.DISCORD_GUILD_ID);
    const channel = (await server?.channels.fetch(config.DISCORD_CHANNEL_ID)) as TextChannel;
    const lastMessage = await channel.lastMessage?.fetch();

    const appCount = await getApplicationCount();
    const draftCount = await getApplicationDraftCount();
    const message = `apps = ${appCount}, drafts = ${draftCount}, actual drafts = ${draftCount - appCount}, last updated = ${new Date().toLocaleString()}`;

    if(lastMessage && lastMessage.author.id === client.user.id) {
      await lastMessage.edit(message);
      logger.success("Edited last message");

    } else {
      await channel.send(message);
      logger.success("Sent new message");
    }

  setInterval(updateMessage, 1000 * 60 * 15); // 15 minutes
}
