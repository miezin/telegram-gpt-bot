import * as dotenv from 'dotenv';
dotenv.config();

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOSTNAME;
const db = process.env.MONGO_DB;

export const MONGODB_URI = `mongodb://${username}:${password}@${host}:27017/${db}?authSource=admin`
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const BOT_TOKEN = process.env.BOT_TOKEN;
export const NODE_HOST = process.env.NODE_HOST;
export const NODE_PORT = process.env.NODE_PORT;

export const OPENAI_MODEL = process.env.OPENAI_MODEL
export const DEFAULT_TEMPERATURE = process.env.DEFAULT_TEMPERATURE
export const DEFAULT_SYSTEM_PROMPT = process.env.DEFAULT_SYSTEM_PROMPT