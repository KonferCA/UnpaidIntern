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
  const currentAppCount = await getApplicationCount();
  const currentDraftCount = await getApplicationDraftCount();
  const applicationsLiveDate = new Date(2025, 5, 6); // May 6th, 2025
  const applicationsCloseDate = new Date(2025, 6, 9); // June 9th, 2025
  const currentDate = new Date();
  const daysUntilClose = Math.floor((applicationsCloseDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksUntilClose = (daysUntilClose / 7).toFixed(2);
  const overallApplicationPeriodDayCount = Math.floor((applicationsCloseDate.getTime() - applicationsLiveDate.getTime()) / (1000 * 60 * 60 * 24));
  const overallApplicationPeriodWeekCount = (overallApplicationPeriodDayCount / 7).toFixed(2);

  // these are the parameters we are using to calculate the number of applications needed to reach a certain number of attendees
  // we are using 50% and 80% attrition rates
  // we are using 1500 and 2000 attendees as the target
  const targetAttendeeMin = 1500;
  const targetAttendeeMax = 2000;
  const mlhAttritionRate = 0.5;
  const konferAttritionRate = 0.8;

  // what is the current apps per day rate
  const overallCurrentAppsPerDay = currentAppCount / overallApplicationPeriodDayCount;
  const currentAppsPerDay = currentAppCount / daysUntilClose;
  const currentDraftAppsPerDay = currentDraftCount / daysUntilClose;

  // how many apps do we need so we can have a certain number of attendees, using 50% and 80% attrition.
  const appsRequiredForAttendeeMinUsingMLH = targetAttendeeMin / mlhAttritionRate;
  const appsRequiredForAttendeeMaxUsingMLH = targetAttendeeMax / mlhAttritionRate;
  const appsRequiredForAttendeeMinUsingKonfer = targetAttendeeMin / konferAttritionRate;
  const appsRequiredForAttendeeMaxUsingKonfer = targetAttendeeMax / konferAttritionRate;

  // how many apps do we need to reach 1500 and 2000 attendees over the entire application period.
  const overallAppsPerDayRateFor1500UsingMLH = appsRequiredForAttendeeMinUsingMLH / overallApplicationPeriodDayCount;
  const overallAppsPerDayRateFor2000UsingMLH = appsRequiredForAttendeeMaxUsingMLH / overallApplicationPeriodDayCount;
  const overallAppsPerDayRateFor1500UsingKonfer = appsRequiredForAttendeeMinUsingKonfer / overallApplicationPeriodDayCount;
  const overallAppsPerDayRateFor2000UsingKonfer = appsRequiredForAttendeeMaxUsingKonfer / overallApplicationPeriodDayCount;

  // what apps per day rate is needed to reach 1500 and 2000 attendees from now onward.
  const appsPerDayRateFor1500UsingMLH = appsRequiredForAttendeeMinUsingMLH / daysUntilClose;
  const appsPerDayRateFor2000UsingMLH = appsRequiredForAttendeeMaxUsingMLH / daysUntilClose;
  const appsPerDayRateFor1500UsingKonfer = appsRequiredForAttendeeMinUsingKonfer / daysUntilClose;
  const appsPerDayRateFor2000UsingKonfer = appsRequiredForAttendeeMaxUsingKonfer / daysUntilClose;

  // how different is the current apps per day rate from the apps per day rate needed to reach 1500 and 2000 attendees.
  const appsPerDayDiffFor1500UsingMLH = appsPerDayRateFor1500UsingMLH - currentAppsPerDay;
  const appsPerDayDiffFor2000UsingMLH = appsPerDayRateFor2000UsingMLH - currentAppsPerDay;
  const appsPerDayDiffFor1500UsingKonfer = appsPerDayRateFor1500UsingKonfer - currentAppsPerDay;
  const appsPerDayDiffFor2000UsingKonfer = appsPerDayRateFor2000UsingKonfer - currentAppsPerDay;

  return new EmbedBuilder()
    .setColor(0x0099FF)
	  .setTitle("Current Application Stats")
	  .setAuthor({ name: "big n hard r", iconURL: "https://i.imgur.com/AfFp7pu.png", url: "https://github.com/KonferCA/UnpaidIntern" })
	  .setDescription("Updated every hour. In case of no update, contact Nausher!")
	  .setThumbnail("https://i.imgur.com/AfFp7pu.png")
	  .addFields(
      { name: "Time Until Apps Close", value: `${daysUntilClose} days / ${weeksUntilClose} weeks`, inline: true },
      { name: "Overall Application Period Length", value: `${overallApplicationPeriodDayCount} days / ${overallApplicationPeriodWeekCount} weeks`, inline: true },
      { name: `MLH Avg Attrition Rate "attr"`, value: `${mlhAttritionRate * 100}%`, inline: true },
      { name: `Konfer Avg Attrition Rate "attr"`, value: `${konferAttritionRate * 100}%`, inline: true },
      { name: "\u200B", value: "\u200B" },
		  { name: "Current Apps", value: currentAppCount.toString(), inline: true },
      { name: "Current Drafts", value: currentDraftCount.toString(), inline: true },
      { name: `Current Overall APD`, value: overallCurrentAppsPerDay.toFixed(2).toString(), inline: false },
      { name: `Current APD`, value: currentAppsPerDay.toFixed(2).toString(), inline: false },
      { name: `Current DPD`, value: currentDraftAppsPerDay.toFixed(2).toString(), inline: true },
      { name: "\u200B", value: "\u200B" },
      { name: "Apps needed for 1,500 attendees @ 50% attr", value: appsRequiredForAttendeeMinUsingMLH.toFixed(2).toString(), inline: false },
      { name: "Apps needed for 2,000 attendees @ 50% attr", value: appsRequiredForAttendeeMaxUsingMLH.toFixed(2).toString(), inline: false },
      { name: "Apps needed for 1,500 attendees @ 80% attr", value: appsRequiredForAttendeeMinUsingKonfer.toFixed(2).toString(), inline: false },
      { name: "Apps needed for 2,000 attendees @ 80% attr", value: appsRequiredForAttendeeMaxUsingKonfer.toFixed(2).toString(), inline: false },
      { name: "\u200B", value: "\u200B" },
      { name: "oAPD needed for 1,500 attendees @ 50% attr", value: overallAppsPerDayRateFor1500UsingMLH.toFixed(2).toString(), inline: false },
      { name: "oAPD needed for 2,000 attendees @ 50% attr", value: overallAppsPerDayRateFor2000UsingMLH.toFixed(2).toString(), inline: false },
      { name: "oAPD needed for 1,500 attendees @ 80% attr", value: overallAppsPerDayRateFor1500UsingKonfer.toFixed(2).toString(), inline: false },
      { name: "oAPD needed for 2,000 attendees @ 80% attr", value: overallAppsPerDayRateFor2000UsingKonfer.toFixed(2).toString(), inline: false },
      { name: "\u200B", value: "\u200B" },
      { name: "cAPD needed for 1,500 attendees @ 50% attr", value: appsPerDayRateFor1500UsingMLH.toFixed(2).toString(), inline: false },
      { name: "cAPD needed for 2,000 attendees @ 50% attr", value: appsPerDayRateFor2000UsingMLH.toFixed(2).toString(), inline: false },
      { name: "cAPD needed for 1,500 attendees @ 80% attr", value: appsPerDayRateFor1500UsingKonfer.toFixed(2).toString(), inline: false },
      { name: "cAPD needed for 2,000 attendees @ 80% attr", value: appsPerDayRateFor2000UsingKonfer.toFixed(2).toString(), inline: false },
      // { name: "\u200B", value: "\u200B" },
      // { name: "cAPD Diff for 1,500 attendees @ 50% attr", value: appsPerDayDiffFor1500UsingMLH.toFixed(2).toString(), inline: false },
      // { name: "cAPD Diff for 2,000 attendees @ 50% attr", value: appsPerDayDiffFor2000UsingMLH.toFixed(2).toString(), inline: false },
      // { name: "cAPD Diff for 1,500 attendees @ 80% attr", value: appsPerDayDiffFor1500UsingKonfer.toFixed(2).toString(), inline: false },
      // { name: "cAPD Diff for 2,000 attendees @ 80% attr", value: appsPerDayDiffFor2000UsingKonfer.toFixed(2).toString(), inline: false }
    )
	  .setTimestamp()
	  .setFooter({ text: `Last updated  ${new Date().toLocaleString()}`, iconURL: "https://i.imgur.com/AfFp7pu.png" });
}
