import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "simple_pos",
  password: process.env.PGPASSWORD || "postgres",
  port: parseInt(process.env.PGPORT || "5432", 10),
});

export default pool;
