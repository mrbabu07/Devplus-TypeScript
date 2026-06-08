import express, { type Application, type Request, type Response } from "express";
import authRouter from "./modules/auth/auth.routes.js";
import issueRouter from "./modules/issues/issue.routes.js";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  res.status(200).send(
     "The DevPlus TypeScript Server is running!"
  );
});

app.get("/api-test", (req: Request, res: Response) => {
  res.sendFile("api-test.html", {
    root: "public",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);

export default app;
