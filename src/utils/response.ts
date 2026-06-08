import type { Response } from "express";

type ErrorDetails = string | string[] | Record<string, unknown> | null;

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
) => {
  if (data === undefined) {
    res.status(statusCode).json({
      success: true,
      message,
    });
    return;
  }

  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: ErrorDetails,
) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors ?? null,
  });
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "unexpected error";
};

export const hasDatabaseErrorCode = (error: unknown, code: string) => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const databaseError = error as { code?: unknown };
  return databaseError.code === code;
};
