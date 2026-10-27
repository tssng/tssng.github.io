import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../build/", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain; charset=utf-8",
};
await stat(path.join(root, "index.html")).catch(() => {
  console.error("Run npm run build before npm start.");
  process.exit(1);
});
http
  .createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      let filename = path.resolve(root, "." + pathname);
      if (filename !== root && !filename.startsWith(root + path.sep)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      if ((await stat(filename)).isDirectory()) {
        if (!pathname.endsWith("/")) {
          response.writeHead(301, { Location: pathname + "/" }).end();
          return;
        }
        filename = path.join(filename, "index.html");
      }
      response.writeHead(200, {
        "Content-Type":
          mime[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      response.end(await readFile(filename));
    } catch {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end(await readFile(path.join(root, "404.html")));
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Local: http://127.0.0.1:" + port),
  );
