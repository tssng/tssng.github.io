import { fileURLToPath } from "node:url";
import { startServer } from "./lib/server.mjs";

try {
  await startServer({ root: fileURLToPath(new URL("../build/", import.meta.url)), port: Number(process.env.PORT || 4173) });
} catch (error) {
  console.error(error.code === "ENOENT" ? "Run npm run build before npm start." : error.message);
  process.exitCode = 1;
}
