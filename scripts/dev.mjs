import { watch } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { startServer } from "./lib/server.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const execute = promisify(execFile);
const build = () => execute(process.execPath, ["scripts/build.mjs", "--preview"], { cwd: root });
try {
  await build();
  const app = await startServer({ root: path.join(root, ".preview-build"), port: Number(process.env.PORT || 4173), preview: true });
  console.log("Drafts included. Edit Markdown or images and save to refresh. Ctrl+C stops preview.");
  let running = false, pending = false, debounce;
  async function rebuild() {
    if (running) { pending = true; return; }
    running = true;
    try { const result = await build(); console.log(result.stdout.trim()); app.changed(); }
    catch (error) { const message = error.stderr || error.message; console.error(message); app.changed(message); }
    finally { running = false; if (pending) { pending = false; await rebuild(); } }
  }
  const watchers = ["content", "public", "scripts"].map(directory => watch(path.join(root, directory), { recursive: true }, () => {
    clearTimeout(debounce); debounce = setTimeout(rebuild, 150);
  }));
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
    clearTimeout(debounce); watchers.forEach(watcher => watcher.close()); app.close(); process.exit(0);
  });
} catch (error) {
  console.error(error.stderr || error.message);
  process.exitCode = 1;
}
