import { Pool } from "pg";
import { env } from "./env.js";

if (!env.databaseURL) {
  throw new Error("DATABASE_URL is missing. Create a .env file from .env.example.");
}

export const pool = new Pool({
  connectionString: env.databaseURL,
});

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'contributor',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'contributor'
  `);

  await pool.query(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
  `);

  await pool.query(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('contributor', 'maintainer'))
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues(
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      reporter_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CHECK (char_length(description) >= 20),
      CHECK (type IN ('bug', 'feature_request')),
      CHECK (status IN ('open', 'in_progress', 'resolved'))
    )
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS update_users_updated_at ON users
  `);

  await pool.query(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS update_issues_updated_at ON issues
  `);

  await pool.query(`
    CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
  `);

  console.log("Database initialized successfully");
};
