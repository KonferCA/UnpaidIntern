import fs from "node:fs";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
  TextChannel,
  ClientOptions,
  EmbedBuilder,
} from "discord.js";
import { config } from "./config.ts";
import logger from "./log.ts";
import { getApplicationByPersonEmail, getApplicationCount, getApplicationDraftCount } from "./firebase.ts";

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
    if (!isReconnecting)
      attemptReconnect();
  });

  client.on(Events.Warn,
    (info) => logger.warn("Discord API Warning:", info)
  );

  if (process.env.NODE_ENV === "development")
    client.on(Events.Debug,
      (info) => logger.debug("Discord API Debug:", info)
    );

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
  }

  try {
    if (client)
      await client.destroy();

    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
    logger.info(`Waiting ${backoffTime}ms before reconnecting...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    await client.login(config.DISCORD_TOKEN);

  } catch (error) {
    logger.err("Failed to reconnect:", error);
    setTimeout(attemptReconnect, 5000);
  }
}

/**
 * Fetch the application count from the database
 */
export const updateMessage = async () => {
    const server = await client.guilds.fetch(config.DISCORD_GUILD_ID);
    const channel = (await server?.channels.fetch(config.DISCORD_CHANNEL_ID)) as TextChannel;
    const lastMessage = await channel.lastMessage?.fetch();
    const statsMessage = await _formatStats();

    if(lastMessage && lastMessage.author.id === client.user.id) {
      await lastMessage.edit({ embeds: [statsMessage] });
      logger.success("Edited last message");

    } else {
      await channel.send({ embeds: [statsMessage] });
      logger.success("Sent new message");
    }

    const logFilePath = "./data/data6.txt";
    fs.appendFile(logFilePath, "test" + "\n",
      (err) => {
        if (err) {
          logger.err("Failed to append message to log file:", err);
          return;
        }

        logger.success("Appended message to log file");
      }
    );

  setInterval(updateMessage, 1000 * 60 * 60); // 1 second * 60 seconds * 60 minutes
}

const formatStats = async () => {
  const currentApps = await getApplicationCount();
  const currentDrafts = await getApplicationDraftCount();
  const applicationsLiveDate = new Date(2025, 5, 6); // May 6th, 2025
  const applicationsCloseDate = new Date(2025, 6, 9); // June 9th, 2025

  const currentDate = new Date();
  const daysUntilClose = Math.floor((applicationsCloseDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksUntilClose = (daysUntilClose / 7).toFixed(2);


}

const _formatStats = async () => {
  const targetAttendeeMin = 1500;
  const targetAttendeeMax = 2000;
  const mlhAttritionRate = 0.5;
  const konferAttritionRate = 0.8;

  const submittedAppCount = await getApplicationCount();
  const totalAppCount = await getApplicationDraftCount();
  const draftAppCount = totalAppCount - submittedAppCount;

  const applicationsLiveDate = new Date(1746590399000); // May 6th, 2025
  const applicationsCloseDate = new Date(1749527999000); // June 9th, 2025
  const currentDate = new Date();

  const totalApplicationPeriodDayCount = Math.floor(Math.abs(applicationsCloseDate.getTime() - applicationsLiveDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilClose = Math.floor(Math.abs(applicationsCloseDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const overallAppsPerDay = totalAppCount / totalApplicationPeriodDayCount;
  const projectedAppsWithCurrentRate = totalAppCount + (overallAppsPerDay * daysUntilClose);
  const projectedAttendanceWithMLHRate = projectedAppsWithCurrentRate * mlhAttritionRate;
  const projectedAttendanceWithKonferRate = projectedAppsWithCurrentRate * konferAttritionRate;

  return new EmbedBuilder()
    .setColor(0x0099FF)
	  .setTitle("Current Application Stats")
	  .setAuthor({ name: "big n hard r", iconURL: "https://i.imgur.com/AfFp7pu.png", url: "https://github.com/KonferCA/UnpaidIntern" })
	  .setDescription("Updated every hour. In case of no update, contact Nausher!")
	  .setThumbnail("https://i.imgur.com/AfFp7pu.png")
	  .addFields(
      { name: "Apps Close In", value: `${daysUntilClose} days`, inline: true },
      { name: "Overall Application Period", value: `${totalApplicationPeriodDayCount} days`, inline: true },
      { name: `MLH Avg Attrition Rate`, value: `${mlhAttritionRate * 100}%`, inline: true },
      { name: `Konfer Avg Attrition Rate`, value: `${konferAttritionRate * 100}%`, inline: true },
      { name: "\u200B", value: "\u200B" },
		  { name: "Submitted Apps", value: submittedAppCount.toString(), inline: true },
		  { name: "Draft Apps", value: draftAppCount.toString(), inline: true },
      { name: "Total Apps", value: totalAppCount.toString(), inline: true },
      { name: "\u200B", value: "\u200B" },
      { name: `Overall Apps Per Day`, value: overallAppsPerDay.toFixed(2).toString(), inline: false },
      { name: `Projected Apps With Current Rate`, value: projectedAppsWithCurrentRate.toFixed(2).toString(), inline: false },
      { name: "\u200B", value: "\u200B" },
      { name: `Target Attendee Min`, value: targetAttendeeMin.toString(), inline: true },
      { name: `Target Attendee Max`, value: targetAttendeeMax.toString(), inline: true },
      { name: `Projected Attendance With MLH Rate`, value: projectedAttendanceWithMLHRate.toFixed(2).toString(), inline: true },
      { name: `Projected Attendance With Konfer Rate`, value: projectedAttendanceWithKonferRate.toFixed(2).toString(), inline: true }
    )
	  .setTimestamp()
	  .setFooter({ text: `Last updated  ${new Date().toLocaleString()}`, iconURL: "https://i.imgur.com/AfFp7pu.png" });
}
