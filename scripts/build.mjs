import {
  cp,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./lib/content.mjs";
import { renderSite } from "./lib/render.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const staging = path.join(root, ".build-staging");
const output = path.join(root, "build");
const content = await loadContent(root);
const pages = renderSite(content);
await rm(staging, { recursive: true, force: true });
await cp(path.join(root, "public"), staging, { recursive: true });
for (const [route, html] of pages) {
  const filename = path.join(staging, route);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, html);
}
await writeFile(path.join(staging, ".nojekyll"), "");

async function verifyTarget(url, filename) {
  if (/^(?:[a-z]+:|#|\/\/)/i.test(url)) return;
  const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
  if (!pathname) return;
  const local = pathname.startsWith("/")
    ? path.join(staging, pathname)
    : path.resolve(path.dirname(filename), pathname);
  if (!local.startsWith(staging + path.sep) && local !== staging)
    throw new Error("Link escapes site: " + url);
  let target;
  try {
    target = await stat(local);
  } catch {
    throw new Error("Broken local link in " + filename + ": " + url);
  }
  if (target.isDirectory()) await stat(path.join(local, "index.html"));
}
async function checkLinks(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, item.name);
    if (item.isDirectory()) await checkLinks(filename);
    else if (item.name.endsWith(".html")) {
      const html = await readFile(filename, "utf8");
      for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g))
        await verifyTarget(url, filename);
    } else if (item.name.endsWith(".css")) {
      const css = await readFile(filename, "utf8");
      for (const [, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g))
        await verifyTarget(url, filename);
    }
  }
}
await checkLinks(staging);
await rm(output, { recursive: true, force: true });
await rename(staging, output);
const reports = content.projects.reduce(
  (count, project) => count + project.entries.length,
  0,
);
console.log(
  "Built " +
    pages.size +
    " pages / " +
    content.projects.length +
    " projects / " +
    reports +
    " reports / " +
    content.posts.length +
    " notes. Local links verified.",
);
