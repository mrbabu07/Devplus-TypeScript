import dotenv from "dotenv";
import type { SignOptions } from "jsonwebtoken";

dotenv.config();

const getSaltRounds = () => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  if (saltRounds < 8 || saltRounds > 12) {
    return 10;
  }

  return saltRounds;
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseURL: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "devplus_access_secret",
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ||
    "7d") as NonNullable<SignOptions["expiresIn"]>,
  bcryptSaltRounds: getSaltRounds(),
};
