import dotenv from "dotenv";

// Load .env file 
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

// Required variables
const requiredVars = ["CLERK_SECRET_KEY"];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (NODE_ENV === "production" && missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
}

export const config = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT || "3000", 10),

  // Clerk
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
  CLERK_WEBHOOK_SIGNING_SECRET:
    process.env.CLERK_WEBHOOK_SIGNING_SECRET || "",
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // GitHub
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",

  // Debugging
  DEBUG: process.env.DEBUG === "true",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Environment helpers
  isDevelopment: NODE_ENV === "development",
  isProduction: NODE_ENV === "production",
  isTest: NODE_ENV === "test",
};

// Prevent accidental modification
Object.freeze(config);

export default config;