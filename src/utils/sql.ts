import type { SqlValue } from "../types.js";

type SqlFilter = {
  column: "type" | "status";
  value: SqlValue;
};

type SqlUpdateField = {
  column: "title" | "description" | "type" | "status";
  value: SqlValue | undefined;
};

export const buildWhereClause = (filters: SqlFilter[]) => {
  const values = filters.map((filter) => filter.value);
  const conditions = filters.map(
    (filter, index) => `${filter.column} = $${index + 1}`,
  );

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
};

export const buildCoalesceUpdateSet = (fields: SqlUpdateField[]) => {
  const values = fields.map((field) => field.value ?? null);
  const setSql = fields
    .map(
      (field, index) =>
        `${field.column} = COALESCE($${index + 1}, ${field.column})`,
    )
    .join(", ");

  return {
    setSql,
    values,
  };
};
