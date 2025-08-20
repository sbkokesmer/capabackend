// db.js
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_YzuC5xVf3oZK@ep-withered-feather-ad2ecejp-pooler.c-2.us-east-1.aws.neon.tech/capadental?sslmode=require'
});