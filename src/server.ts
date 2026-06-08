import app from "./app.js";
import { ensureDB } from "./config/database.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    await ensureDB();

    app.listen(env.port, () => {
      console.log(`Example app listening on port ${env.port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
