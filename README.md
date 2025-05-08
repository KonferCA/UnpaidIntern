# UnpaidIntern

Our Discord bot that helps us with random things, now with Firestore database integration.

## Features

- Query and display Firestore database collections and documents in Discord channels
- List all collections available in your Firestore database
- Retrieve specific documents by ID with formatted display
- Automatically format complex data structures into readable Discord embeds
- Export large datasets as JSON attachments
- Built with TypeScript for type safety and maintainability

## Setup Instructions

### Prerequisites

- Node.js v16 or higher
- pnpm package manager
- Discord bot token (from Discord Developer Portal)
- Firebase project with Firestore database
- Firebase service account credentials

### Discord Bot Setup

1. Visit the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it
3. Go to the "Bot" tab and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - Server Members Intent
   - Message Content Intent
5. Copy your bot token (you'll need this for the `.env` file)
6. Navigate to the "OAuth2" > "URL Generator" section
7. Select scopes: `bot` and `applications.commands`
8. Select bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
9. Use the generated URL to invite the bot to your server

### Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Set up Firestore database if not already configured
4. Go to Project Settings > Service Accounts
5. Click "Generate new private key" to download your service account JSON
6. Rename this file to `firebase-service-account.json` and place it in the project root

### Project Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file with the following variables:
   ```
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_application_client_id_here
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_firebase_project_id
   
   # Optional configurations
   # FIREBASE_PRIVATE_KEY_PATH=./path/to/service-account.json
   # COMMAND_PREFIX=!
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

4. Start the bot:
   ```bash
   pnpm start
   ```

## Available Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `!help` | Display available commands | `!help` |
| `!ping` | Check if bot is responding | `!ping` |
| `!collections` | List all Firestore collections | `!collections` |
| `!query` | Retrieve documents from a collection | `!query <collection> [limit=10]` |
| `!get` | Get a specific document by ID | `!get <collection> <documentId>` |

## Development

For development with auto-reloading:

```bash
pnpm dev
```

### Project Structure

```
src/
├── bot/            # Discord bot client setup
├── commands/       # Command handling logic
├── db/             # Firestore database connection
├── utils/          # Utility functions
├── config.ts       # Environment configuration
└── index.ts        # Application entry point
```

### Adding New Commands

To create a new command:

1. Open `src/commands/handler.ts`
2. Define a new command object following the existing pattern:
   ```typescript
   const newCommand: Command = {
     name: 'commandname',
     description: 'Description of what the command does',
     usage: 'commandname <required_arg> [optional_arg]',
     execute: async (message: Message, args: string[]): Promise<void> => {
       // Command implementation
     }
   };
   ```
3. Register the command by adding it to the registerCommand calls:
   ```typescript
   registerCommand(newCommand);
   ```

## Deployment

For production deployment:

1. Ensure all environment variables are properly set in your production environment
2. Build the TypeScript code:
   ```bash
   pnpm build
   ```
3. Start the production server:
   ```bash
   pnpm start
   ```

### Using PM2 for Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot with PM2
pm2 start dist/index.js --name "discord-firestore-bot"

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

## Troubleshooting

### Common Issues

**Bot doesn't respond to commands:**
- Check if the bot is online in your Discord server
- Ensure you're using the correct command prefix (default is `!`)
- Verify the bot has proper permissions in the channel
- Check console logs for any errors

**Firestore connection issues:**
- Verify your `firebase-service-account.json` file is valid and has correct permissions
- Check that your Firebase project ID in `.env` matches the service account
- Ensure your Firestore database exists and is not in locked mode

**TypeScript build errors:**
- Run `pnpm build` to see detailed error messages
- Make sure all dependencies are installed: `pnpm install`

### Logs

To enable verbose logging for debugging:

```bash
NODE_ENV=development pnpm dev
```

### Getting Help

If you encounter issues not covered here, check:
- Discord.js documentation: https://discord.js.org/
- Firebase Admin SDK docs: https://firebase.google.com/docs/admin/setup
