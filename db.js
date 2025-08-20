import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
});