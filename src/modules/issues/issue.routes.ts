import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import { pool } from "../../config/database.js";
import { auth, requireMaintainer } from "../../middleware/auth.js";
import type {
  CreateIssueBody,
  IssueQuery,
  IssueResponse,
  IssueRow,
  IssueUpdateBody,
  Reporter,
  SqlValue,
} from "../../types.js";
import {
  getErrorMessage,
  sendError,
  sendSuccess,
} from "../../utils/response.js";
import { buildCoalesceUpdateSet, buildWhereClause } from "../../utils/sql.js";
import {
  getQueryValue,
  getValidId,
  isIssueStatus,
  isIssueType,
} from "../../utils/validation.js";

const router = Router();

const issueSelectFields = `
  id,
  title,
  description,
  type,
  status,
  reporter_id,
  created_at,
  updated_at
`;

const validateIssueInput = (
  title: unknown,
  description: unknown,
  type: unknown,
) => {
  if (typeof title !== "string" || title.trim().length === 0) {
    return "title is required";
  }

  if (title.length > 150) {
    return "title must be maximum 150 characters";
  }

  if (typeof description !== "string" || description.length < 20) {
    return "description must be minimum 20 characters";
  }

  if (!isIssueType(type)) {
    return "type must be bug or feature_request";
  }

  return null;
};

const makeIssueResponse = (
  issue: IssueRow,
  reporter: Reporter | null,
): IssueResponse => {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

const getReporterById = async (reporterId: number) => {
  const result = await pool.query<Reporter>(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [reporterId],
  );

  return result.rows[0] || null;
};

router.post(
  "/",
  auth,
  async (
    req: Request<Record<string, never>, unknown, CreateIssueBody>,
    res: Response,
  ): Promise<void> => {
    const user = req.user;

    if (!user) {
      sendError(res, StatusCodes.UNAUTHORIZED, "authentication is required");
      return;
    }

    const { title, description, type } = req.body;
    const validationError = validateIssueInput(title, description, type);

    if (validationError) {
      sendError(res, StatusCodes.BAD_REQUEST, validationError);
      return;
    }

    try {
      const userResult = await pool.query(
        `SELECT id FROM users WHERE id = $1`,
        [user.id],
      );

      if (userResult.rows.length === 0) {
        sendError(res, StatusCodes.UNAUTHORIZED, "token user was not found");
        return;
      }

      const result = await pool.query<IssueRow>(
        `INSERT INTO issues (title, description, type, reporter_id)
         VALUES ($1, $2, $3, $4)
         RETURNING ${issueSelectFields}`,
        [title, description, type, user.id],
      );

      sendSuccess(
        res,
        StatusCodes.CREATED,
        "Issue created successfully",
        result.rows[0],
      );
    } catch (error) {
      console.log(error);
      sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "failed to create issue",
        getErrorMessage(error),
      );
    }
  },
);

router.get(
  "/",
  async (
    req: Request<Record<string, never>, unknown, unknown, IssueQuery>,
    res: Response,
  ): Promise<void> => {
    const sort = getQueryValue(req.query.sort) || "newest";
    const type = getQueryValue(req.query.type);
    const status = getQueryValue(req.query.status);

    if (sort !== "newest" && sort !== "oldest") {
      sendError(res, StatusCodes.BAD_REQUEST, "sort must be newest or oldest");
      return;
    }

    if (type && !isIssueType(type)) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        "type must be bug or feature_request",
      );
      return;
    }

    if (status && !isIssueStatus(status)) {
      sendError(
        res,
        StatusCodes.BAD_REQUEST,
        "status must be open, in_progress or resolved",
      );
      return;
    }

    try {
      const filters: Array<{ column: "type" | "status"; value: SqlValue }> = [];

      if (type) {
        filters.push({
          column: "type",
          value: type,
        });
      }

      if (status) {
        filters.push({
          column: "status",
          value: status,
        });
      }

      const { whereSql, values } = buildWhereClause(filters);
      const order = sort === "oldest" ? "ASC" : "DESC";
      const result = await pool.query<IssueRow>(
        `SELECT ${issueSelectFields}
         FROM issues
         ${whereSql}
         ORDER BY created_at ${order}`,
        values,
      );

      const reporterIds = [
        ...new Set(result.rows.map((issue) => issue.reporter_id)),
      ];

      let reporters: Reporter[] = [];

      if (reporterIds.length > 0) {
        const reporterResult = await pool.query<Reporter>(
          `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
          [reporterIds],
        );

        reporters = reporterResult.rows;
      }

      const reporterMap = new Map(
        reporters.map((reporter) => [reporter.id, reporter]),
      );

      sendSuccess(
        res,
        StatusCodes.OK,
        "Issues retrived successfully",
        result.rows.map((issue) =>
          makeIssueResponse(issue, reporterMap.get(issue.reporter_id) || null),
        ),
      );
    } catch (error) {
      console.log(error);
      sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "failed to retrieve issues",
        getErrorMessage(error),
      );
    }
  },
);

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = getValidId(req.params.id);

  if (!id) {
    sendError(res, StatusCodes.BAD_REQUEST, "valid issue id is required");
    return;
  }

  try {
    const result = await pool.query<IssueRow>(
      `SELECT ${issueSelectFields} FROM issues WHERE id = $1`,
      [id],
    );

    const issue = result.rows[0];

    if (!issue) {
      sendError(res, StatusCodes.NOT_FOUND, "issue not found");
      return;
    }

    const reporter = await getReporterById(issue.reporter_id);

    sendSuccess(
      res,
      StatusCodes.OK,
      "Issue retrived successfully",
      makeIssueResponse(issue, reporter),
    );
  } catch (error) {
    console.log(error);
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "failed to retrieve issue",
      getErrorMessage(error),
    );
  }
});

router.patch(
  "/:id",
  auth,
  async (
    req: Request<{ id: string }, unknown, IssueUpdateBody>,
    res: Response,
  ): Promise<void> => {
    const user = req.user;
    const id = getValidId(req.params.id);

    if (!user) {
      sendError(res, StatusCodes.UNAUTHORIZED, "authentication is required");
      return;
    }

    if (!id) {
      sendError(res, StatusCodes.BAD_REQUEST, "valid issue id is required");
      return;
    }

    try {
      const issueResult = await pool.query<IssueRow>(
        `SELECT ${issueSelectFields} FROM issues WHERE id = $1`,
        [id],
      );

      const issue = issueResult.rows[0];

      if (!issue) {
        sendError(res, StatusCodes.NOT_FOUND, "issue not found");
        return;
      }

      if (user.role !== "maintainer") {
        if (issue.reporter_id !== user.id) {
          sendError(
            res,
            StatusCodes.FORBIDDEN,
            "you can update only your own issue",
          );
          return;
        }

        if (issue.status !== "open") {
          sendError(
            res,
            StatusCodes.CONFLICT,
            "contributors can update only open issues",
          );
          return;
        }
      }

      const { title, description, type, status } = req.body;
      const hasUpdateField =
        title !== undefined ||
        description !== undefined ||
        type !== undefined ||
        status !== undefined;

      if (title !== undefined) {
        if (typeof title !== "string" || title.trim().length === 0) {
          sendError(res, StatusCodes.BAD_REQUEST, "title is required");
          return;
        }

        if (title.length > 150) {
          sendError(
            res,
            StatusCodes.BAD_REQUEST,
            "title must be maximum 150 characters",
          );
          return;
        }

      }

      if (description !== undefined) {
        if (typeof description !== "string" || description.length < 20) {
          sendError(
            res,
            StatusCodes.BAD_REQUEST,
            "description must be minimum 20 characters",
          );
          return;
        }

      }

      if (type !== undefined) {
        if (!isIssueType(type)) {
          sendError(
            res,
            StatusCodes.BAD_REQUEST,
            "type must be bug or feature_request",
          );
          return;
        }

      }

      if (status !== undefined) {
        if (user.role !== "maintainer") {
          sendError(
            res,
            StatusCodes.FORBIDDEN,
            "maintainer permission is required to update status",
          );
          return;
        }

        if (!isIssueStatus(status)) {
          sendError(
            res,
            StatusCodes.BAD_REQUEST,
            "status must be open, in_progress or resolved",
          );
          return;
        }

      }

      if (!hasUpdateField) {
        sendError(
          res,
          StatusCodes.BAD_REQUEST,
          "title, description, type or status is required",
        );
        return;
      }

      const { setSql, values } = buildCoalesceUpdateSet([
        {
          column: "title",
          value: title,
        },
        {
          column: "description",
          value: description,
        },
        {
          column: "type",
          value: type,
        },
        {
          column: "status",
          value: status,
        },
      ]);
      const result = await pool.query<IssueRow>(
        `UPDATE issues
         SET ${setSql}
         WHERE id = $${values.length + 1}
         RETURNING ${issueSelectFields}`,
        [...values, id],
      );

      sendSuccess(
        res,
        StatusCodes.OK,
        "Issue updated successfully",
        result.rows[0],
      );
    } catch (error) {
      console.log(error);
      sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "failed to update issue",
        getErrorMessage(error),
      );
    }
  },
);

router.delete(
  "/:id",
  auth,
  requireMaintainer,
  async (req: Request, res: Response): Promise<void> => {
    const id = getValidId(req.params.id);

    if (!id) {
      sendError(res, StatusCodes.BAD_REQUEST, "valid issue id is required");
      return;
    }

    try {
      const result = await pool.query<IssueRow>(
        `DELETE FROM issues WHERE id = $1 RETURNING ${issueSelectFields}`,
        [id],
      );

      if (result.rows.length === 0) {
        sendError(res, StatusCodes.NOT_FOUND, "issue not found");
        return;
      }

      sendSuccess(res, StatusCodes.OK, "Issue deleted successfully");
    } catch (error) {
      console.log(error);
      sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        "failed to delete issue",
        getErrorMessage(error),
      );
    }
  },
);

export default router;
