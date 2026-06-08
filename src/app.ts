import express, { type Application, type Request, type Response } from "express";
import { ensureDatabaseReady } from "./middleware/database.js";
import authRouter from "./modules/auth/auth.routes.js";
import issueRouter from "./modules/issues/issue.routes.js";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "The DevPlus TypeScript Server is running!",
  });
});

app.use("/api", ensureDatabaseReady);
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);

export default app;
