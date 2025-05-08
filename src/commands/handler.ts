import { Message, EmbedBuilder } from 'discord.js';
import { config } from '../config';
import firestoreService from '../db/firebase';

// Command interface definition
export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (message: Message, args: string[]) => Promise<void>;
}

// Collection of registered commands
const commands = new Map<string, Command>();

/**
 * Register a command
 */
export function registerCommand(command: Command): void {
  commands.set(command.name.toLowerCase(), command);
  console.log(`Command registered: ${command.name}`);
}

/**
 * Get a registered command
 */
export function getCommand(name: string): Command | undefined {
  return commands.get(name.toLowerCase());
}

/**
 * List all registered commands
 */
export function getCommands(): Command[] {
  return Array.from(commands.values());
}

/**
 * Process a message as a command
 */
export async function commandHandler(message: Message): Promise<void> {
  // Extract command name and arguments
  const args = message.content.slice(config.COMMAND_PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  // Find command
  const command = getCommand(commandName);

  if (!command) {
    // Handle unknown command
    if (commandName === 'help') {
      await sendHelpMessage(message);
      return;
    }

    await message.reply(`Unknown command: ${commandName}. Use ${config.COMMAND_PREFIX}help to see available commands.`);
    return;
  }

  try {
    // Execute command
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    await message.reply('There was an error executing that command.');
  }
}

/**
 * Send help message with list of commands
 */
async function sendHelpMessage(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('Available Commands')
    .setColor('#0099ff')
    .setDescription(`Command prefix: ${config.COMMAND_PREFIX}`);

  getCommands().forEach(cmd => {
    embed.addFields({
      name: `${config.COMMAND_PREFIX}${cmd.name}`,
      value: `${cmd.description}\nUsage: ${config.COMMAND_PREFIX}${cmd.usage}`
    });
  });

  await message.reply({ embeds: [embed] });
}

// Register built-in commands
const pingCommand: Command = {
  name: 'ping',
  description: 'Check if the bot is responding',
  usage: 'ping',
  execute: async (message: Message): Promise<void> => {
    const reply = await message.reply('Pinging...');
    const pingTime = reply.createdTimestamp - message.createdTimestamp;
    await reply.edit(`Pong! Bot latency: ${pingTime}ms | API Latency: ${message.client.ws.ping}ms`);
  }
};

const collectionsCommand: Command = {
  name: 'collections',
  description: 'List all collections in Firestore',
  usage: 'collections',
  execute: async (message: Message): Promise<void> => {
    try {
      // await (message.channel as TextChannel).sendTyping();

      const collections = await firestoreService.listCollections();

      if (collections.length === 0) {
        await message.reply('No collections found in the Firestore database.');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Firestore Collections')
        .setColor('#4285F4')
        .setDescription(collections.map(name => `- ${name}`).join('\n'))
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error listing collections:', error);
      await message.reply('Failed to retrieve collections from Firestore.');
    }
  }
};

// Query command for retrieving data from Firestore
const queryCommand: Command = {
  name: 'query',
  description: 'Query documents from a Firestore collection',
  usage: 'query <collection> [limit=10]',
  execute: async (message: Message, args: string[]): Promise<void> => {
    try {
      // Check arguments
      if (args.length < 1) {
        await message.reply(`Please specify a collection name. Usage: ${config.COMMAND_PREFIX}${queryCommand.usage}`);
        return;
      }

      // await message.channel.sendTyping();

      const collectionName = args[0];
      const limit = parseInt(args[1]) || 10;

      // Validate limit
      if (limit < 1 || limit > 50) {
        await message.reply('Limit must be between 1 and 50 documents.');
        return;
      }

      // Query the collection
      const documents = await firestoreService.getAllDocuments(collectionName);

      if (documents.length === 0) {
        await message.reply(`No documents found in collection: ${collectionName}`);
        return;
      }

      // Create embed with formatted data
      const embed = new EmbedBuilder()
        .setTitle(`Collection: ${collectionName}`)
        .setColor('#4285F4')
        .setDescription(`Found ${documents.length} documents. Showing up to ${Math.min(limit, documents.length)}.`);

      // Add document previews
      documents.slice(0, limit).forEach((doc: any, index: number) => {
        // Try to get an ID from the document
        const id = doc.id || `Document ${index + 1}`;

        // Create a preview of the document data
        const preview = Object.entries(doc)
          .filter(([key]) => key !== 'id') // Skip ID as it's already the field name
          .slice(0, 3) // Only include first 3 fields in preview
          .map(([key, value]) => {
            const valueStr = typeof value === 'object' ?
              JSON.stringify(value).substring(0, 50) :
              String(value).substring(0, 50);

            return `${key}: ${valueStr}${valueStr.length >= 50 ? '...' : ''}`;
          })
          .join('\n');

        embed.addFields({
          name: `📄 ${id}`,
          value: preview || '(Empty document)',
          inline: false
        });
      });

      // Send full data as JSON for larger results
      if (documents.length > 5) {
        const buffer = Buffer.from(JSON.stringify(documents, null, 2));
        const attachment = { attachment: buffer, name: `${collectionName}.json` };

        await message.reply({
          content: `Here are the documents from ${collectionName}:`,
          embeds: [embed],
          files: [attachment]
        });
      } else {
        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error executing query command:', error);
      await message.reply(`Error querying Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Get document command
const getDocCommand: Command = {
  name: 'get',
  description: 'Get a specific document from Firestore',
  usage: 'get <collection> <documentId>',
  execute: async (message: Message, args: string[]): Promise<void> => {
    try {
      // Check arguments
      if (args.length < 2) {
        await message.reply(`Please specify both collection name and document ID. Usage: ${config.COMMAND_PREFIX}${getDocCommand.usage}`);
        return;
      }

      // await message.channel.sendTyping();

      const collectionName = args[0];
      const documentId = args[1];

      // Get the document
      const document = await firestoreService.getDocument(collectionName, documentId);

      if (!document) {
        await message.reply(`Document not found: ${collectionName}/${documentId}`);
        return;
      }

      // Format the document data
      const embed = new EmbedBuilder()
        .setTitle(`Document: ${documentId}`)
        .setColor('#4285F4')
        .setDescription(`Collection: ${collectionName}`);

      // Add fields for document data
      Object.entries(document).forEach(([key, value]) => {
        const valueStr = typeof value === 'object' ?
          JSON.stringify(value, null, 2) :
          String(value);

        // Skip large fields
        if (valueStr.length > 1024) {
          embed.addFields({
            name: key,
            value: valueStr.substring(0, 1000) + '... (truncated)',
            inline: false
          });
        } else {
          embed.addFields({
            name: key,
            value: valueStr,
            inline: valueStr.length < 100 // Inline for short values
          });
        }
      });

      // Send the document data
      const buffer = Buffer.from(JSON.stringify(document, null, 2));
      const attachment = { attachment: buffer, name: `${documentId}.json` };

      await message.reply({
        embeds: [embed],
        files: [attachment]
      });
    } catch (error) {
      console.error('Error executing get command:', error);
      await message.reply(`Error retrieving document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Register default commands
registerCommand(pingCommand);
registerCommand(collectionsCommand);
registerCommand(queryCommand);
registerCommand(getDocCommand);
export default commandHandler;

