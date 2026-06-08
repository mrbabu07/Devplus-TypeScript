import bcrypt from "bcrypt";
import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { pool } from "../../config/database.js";
import type { LoginBody, SignupBody, UserPublicRow, UserRow } from "../../types.js";
import {
  getErrorMessage,
  hasDatabaseErrorCode,
  sendError,
  sendSuccess,
} from "../../utils/response.js";
import { isUserRole, isValidEmail } from "../../utils/validation.js";

const router = Router();

const userSelectFields = `
  id,
  name,
  email,
  role,
  created_at,
  updated_at
`;

router.post(
  "/signup",
  async (
    req: Request<Record<string, never>, unknown, SignupBody>,
    res: Response,
  ): Promise<void> => {
    const { name, email, password } = req.body;
    const role = req.body.role ?? "contributor";

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        "name, email and password are required",
      );
      return;
    }

    if (!isValidEmail(email)) {
      sendError(res, StatusCodes.BAD_REQUEST, "valid email is required");
      return;
    }

    if (!isUserRole(role)) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        "role must be contributor or maintainer",
      );
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

      const result = await pool.query<UserPublicRow>(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING ${userSelectFields}`,
        [name, email, hashedPassword, role],
      );

      sendSuccess(
        res,
        StatusCodes.CREATED,
        "User registered successfully",
        result.rows[0],
      );
    } catch (error) {
      if (hasDatabaseErrorCode(error, "23505")) {
        sendError(
          res,
          StatusCodes.BAD_REQUEST,
          "user already exists with this email",
        );
        return;
      }

      console.log(error);
      sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "failed to register user",
        getErrorMessage(error),
      );
    }
  },
);

router.post(
  "/login",
  async (
    req: Request<Record<string, never>, unknown, LoginBody>,
    res: Response,
  ): Promise<void> => {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      sendError(res, StatusCodes.BAD_REQUEST, "email and password are required");
      return;
    }

    try {
      const result = await pool.query<UserRow>(
        `SELECT * FROM users WHERE email = $1`,
        [email],
      );

      const user = result.rows[0];

      if (!user) {
        sendError(res, StatusCodes.UNAUTHORIZED, "invalid email or password");
        return;
      }

      const isPasswordMatched = await bcrypt.compare(password, user.password);

      if (!isPasswordMatched) {
        sendError(res, StatusCodes.UNAUTHORIZED, "invalid email or password");
        return;
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        env.jwtSecret,
        {
          expiresIn: env.jwtExpiresIn,
        },
      );

      sendSuccess(res, StatusCodes.OK, "Login successful", {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      console.log(error);
      sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "failed to login",
        getErrorMessage(error),
      );
    }
  },
);

export default router;
