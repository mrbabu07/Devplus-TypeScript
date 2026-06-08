import app from "./app.js";
import { initDB } from "./config/database.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    await initDB();

    app.listen(env.port, () => {
      console.log(`Example app listening on port ${env.port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
