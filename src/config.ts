import dotenv from 'dotenv';
dotenv.config();

interface EnvConfig {
  DISCORD_TOKEN: string;
  DISCORD_CLIENT_ID: string;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID: string;
  COMMAND_PREFIX: string;
}

// Validate required environment variables
function validateEnv(): EnvConfig {
  const requiredEnvVars = [
    'DISCORD_TOKEN',
    'DISCORD_CLIENT_ID',
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }

  return {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID!,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY!,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN!,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET!,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID!,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID!,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID!,
    COMMAND_PREFIX: process.env.COMMAND_PREFIX || '!'
  };
}

// Export validated config
export const config = validateEnv();
export default config;

