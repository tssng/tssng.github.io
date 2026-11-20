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
const preview = process.argv.includes("--preview");
const staging = path.join(root, preview ? ".preview-staging" : ".build-staging");
const output = path.join(root, preview ? ".preview-build" : "build");
const content = await loadContent(root, { includeDrafts: preview });
const pages = renderSite({ ...content, preview });
await rm(staging, { recursive: true, force: true });
await cp(path.join(root, "public"), staging, { recursive: true });
// Copy only media belonging to included posts. Draft Markdown and its media
// never enter the public build; local preview has a separate output directory.
const media = /\.(?:png|jpe?g|gif|webp|avif|svg|pdf|mp4|webm)$/i;
async function copyMedia(source, target) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const from = path.join(source, entry.name), to = path.join(target, entry.name);
    if (entry.isDirectory()) await copyMedia(from, to);
    else if (entry.isFile() && media.test(entry.name)) {
      await mkdir(path.dirname(to), { recursive: true });
      await cp(from, to);
    }
  }
}
for (const post of content.posts)
  if (post.assetDirectory) await copyMedia(post.assetDirectory, path.join(staging, "notes", post.slug));
for (const project of content.projects)
  for (const post of project.entries)
    if (post.assetDirectory) await copyMedia(post.assetDirectory, path.join(staging, "research", project.slug, "reports", post.slug));

for (const [route, html] of pages) {
  const filename = path.join(staging, route);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, html);
}
await writeFile(path.join(staging, ".nojekyll"), "");

async function verifyTarget(url, filename) {
  url = url.replace(/&(amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, (_, entity) => {
    const named = { amp: "&", quot: '\"', apos: "'", lt: "<", gt: ">" };
    const key = entity.toLowerCase();
    return named[key] ?? String.fromCodePoint(key.startsWith("#x") ? parseInt(key.slice(2), 16) : Number(key.slice(1)));
  });
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
