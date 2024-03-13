import * as dotenv from "dotenv";

dotenv.config();

export const REDIS_URL = process.env.REDIS as string;
