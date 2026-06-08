import type { IssueStatus, IssueType, UserRole } from "../types.js";

export const isUserRole = (role: unknown): role is UserRole => {
  return role === "contributor" || role === "maintainer";
};

export const isIssueType = (type: unknown): type is IssueType => {
  return type === "bug" || type === "feature_request";
};

export const isIssueStatus = (status: unknown): status is IssueStatus => {
  return (
    status === "open" || status === "in_progress" || status === "resolved"
  );
};

export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const getValidId = (id: unknown) => {
  if (typeof id !== "string") {
    return null;
  }

  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
};

export const getQueryValue = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  return value;
};
