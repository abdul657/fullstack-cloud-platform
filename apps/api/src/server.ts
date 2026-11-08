import "dotenv/config";
import { createApp } from "./app";
import { createPool } from "./db";

const port = Number(process.env.API_PORT ?? 4000);
const pool = createPool();
const app = createApp(pool);
const server = app.listen(port, () => console.log("API listening on http://localhost:" + port));

async function shutdown(signal: string) {
  console.log(signal + " received; shutting down.");
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
