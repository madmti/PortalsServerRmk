import * as dotenv from 'dotenv';
dotenv.config();

export const URI = process.env.DB_URI || 'uri';