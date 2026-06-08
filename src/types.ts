export type UserRole = "contributor" | "maintainer";
export type IssueType = "bug" | "feature_request";
export type IssueStatus = "open" | "in_progress" | "resolved";
export type Timestamp = string | Date;
export type SqlValue = string | number | boolean | null | Date | number[];

export type AuthUser = {
  id: number;
  name: string;
  role: UserRole;
};

export type UserRow = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type UserPublicRow = Omit<UserRow, "password">;
export type Reporter = Pick<UserRow, "id" | "name" | "role">;

export type IssueRow = {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type IssueResponse = Omit<IssueRow, "reporter_id"> & {
  reporter: Reporter | null;
};

export type SignupBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

export type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export type CreateIssueBody = {
  title?: unknown;
  description?: unknown;
  type?: unknown;
};

export type IssueUpdateBody = {
  title?: unknown;
  description?: unknown;
  type?: unknown;
  status?: unknown;
};

export type IssueQuery = {
  sort?: unknown;
  type?: unknown;
  status?: unknown;
};
