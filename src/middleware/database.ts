import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ensureDB } from "../config/database.js";
import { getErrorMessage, sendError } from "../utils/response.js";

export const ensureDatabaseReady = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await ensureDB();
    next();
  } catch (error) {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "database initialization failed",
      getErrorMessage(error),
    );
  }
};
