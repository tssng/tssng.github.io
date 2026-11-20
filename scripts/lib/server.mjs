import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";

const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".avif": "image/avif", ".pdf": "application/pdf", ".mp4": "video/mp4",
  ".webm": "video/webm", ".txt": "text/plain; charset=utf-8",
};
const previewScript = `
const status = document.createElement('div');
status.setAttribute('role', 'status');
status.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;padding:10px 18px;background:#232323;color:#e8e5de;font:16px/1.4 system-ui;white-space:pre-wrap;max-height:35vh;overflow:auto';
status.textContent = 'Local preview · drafts included · saves refresh automatically';
document.body.append(status);
let version = null;
const events = new EventSource('/__preview/events');
events.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.error) status.textContent = 'Build error — showing the last working preview.\\n' + data.error;
  else {
    status.textContent = 'Local preview · drafts included · saves refresh automatically';
    if (version !== null && data.version !== version) location.reload();
  }
  version = data.version;
};
`;

export async function startServer({ root, port = 4173, preview = false }) {
  root = path.resolve(root);
  await stat(path.join(root, "index.html"));
  const clients = new Set();
  let state = { version: 0, error: null };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      if (preview && pathname === "/__preview/events") {
        response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
        response.write("data: " + JSON.stringify(state) + "\n\n");
        clients.add(response);
        request.on("close", () => clients.delete(response));
        return;
      }
      if (preview && pathname === "/__preview/client.js") {
        response.writeHead(200, { "Content-Type": mime[".js"], "Cache-Control": "no-cache" }).end(previewScript);
        return;
      }
      let filename = path.resolve(root, "." + pathname);
      if (filename !== root && !filename.startsWith(root + path.sep)) {
        response.writeHead(403).end("Forbidden"); return;
      }
      if ((await stat(filename)).isDirectory()) {
        if (!pathname.endsWith("/")) { response.writeHead(301, { Location: pathname + "/" }).end(); return; }
        filename = path.join(filename, "index.html");
      }
      let body = await readFile(filename);
      if (preview && filename.endsWith(".html")) body = body.toString().replace("</body>", '<script src="/__preview/client.js"></script></body>');
      response.writeHead(200, { "Content-Type": mime[path.extname(filename)] || "application/octet-stream", "Cache-Control": "no-cache" }).end(body);
    } catch {
      response.writeHead(404, { "Content-Type": mime[".html"] });
      response.end(await readFile(path.join(root, "404.html")).catch(() => "Not found"));
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  console.log("Local: http://127.0.0.1:" + server.address().port);
  return {
    server,
    changed(error = null) {
      state = { version: error ? state.version : state.version + 1, error };
      for (const client of clients) client.write("data: " + JSON.stringify(state) + "\n\n");
    },
    close() { for (const client of clients) client.end(); server.close(); },
  };
}
