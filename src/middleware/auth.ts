import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sendError, getErrorMessage } from "../utils/response.js";
import { isUserRole } from "../utils/validation.js";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    sendError(res, StatusCodes.UNAUTHORIZED, "authorization token is required");
    return;
  }

  const [scheme, value] = authorization.split(" ");
  const token = scheme === "Bearer" ? value : authorization;

  if (!token) {
    sendError(res, StatusCodes.UNAUTHORIZED, "authorization token is required");
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded === "string") {
      sendError(res, StatusCodes.UNAUTHORIZED, "invalid token payload");
      return;
    }

    const id = typeof decoded.id === "number" ? decoded.id : null;
    const name = typeof decoded.name === "string" ? decoded.name : null;
    const role = decoded.role;

    if (!id || !name || !isUserRole(role)) {
      sendError(res, StatusCodes.UNAUTHORIZED, "invalid token payload");
      return;
    }

    req.user = {
      id,
      name,
      role,
    };

    next();
  } catch (error) {
    sendError(
      res,
      StatusCodes.UNAUTHORIZED,
      "invalid or expired token",
      getErrorMessage(error),
    );
  }
};

export const requireMaintainer = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    sendError(res, StatusCodes.UNAUTHORIZED, "authentication is required");
    return;
  }

  if (req.user.role !== "maintainer") {
    sendError(res, StatusCodes.FORBIDDEN, "maintainer permission is required");
    return;
  }

  next();
};
