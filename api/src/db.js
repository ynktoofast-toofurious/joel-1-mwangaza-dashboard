import { Pool } from "pg";
import { config } from "./config.js";

const pool = new Pool({
  host: config.redshift.host,
  port: config.redshift.port,
  database: config.redshift.database,
  user: config.redshift.user,
  password: config.redshift.password,
  ssl: config.redshift.ssl ? { rejectUnauthorized: false } : false,
  max: 10
});

export const query = (text, params = []) => pool.query(text, params);

export const withClient = async (fn) => {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
};

export default pool;
