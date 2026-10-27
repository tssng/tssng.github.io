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
import { marked } from "marked";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "build");
const staging = path.join(root, ".build-staging");
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
const prettyDate = (date) =>
  new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
function parsePost(source, filename) {
  const match = source
    .replace(/\r\n/g, "\n")
    .match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(filename + ": expected --- front matter.");
  const metadata = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const field = line.match(/^([a-z]+):\s*(.*)$/);
    if (!field)
      throw new Error(filename + ": metadata must use key: value on one line.");
    const [, key, raw] = field;
    if (
      !["title", "date", "summary", "draft"].includes(key) ||
      key in metadata
    ) {
      throw new Error(filename + ": unknown or duplicate metadata key: " + key);
    }
    metadata[key] = raw.startsWith('"') ? JSON.parse(raw) : raw;
  }
  if (
    metadata.draft !== undefined &&
    !["true", "false"].includes(metadata.draft)
  ) {
    throw new Error(filename + ": draft must be true or false.");
  }
  if (metadata.draft === "true") return null;
  for (const key of ["title", "date", "summary"]) {
    if (typeof metadata[key] !== "string" || !metadata[key].trim()) {
      throw new Error(filename + ": missing " + key + ".");
    }
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(metadata.date) ||
    !Number.isFinite(Date.parse(metadata.date)) ||
    new Date(metadata.date).toISOString().slice(0, 10) !== metadata.date
  ) {
    throw new Error(filename + ": date must be a real YYYY-MM-DD date.");
  }
  const slug = filename.replace(/\.md$/, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(filename + ": use a lowercase, hyphen-separated filename.");
  }
  // Markdown is trusted author content committed to this repository, like HTML source.
  return { ...metadata, slug, html: marked.parse(match[2]) };
}
function article(post) {
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="description" content="' +
    escape(post.summary) +
    '">' +
    '<meta name="theme-color" content="#f6f5f1">' +
    "<title>" +
    escape(post.title) +
    " / Tejas</title>" +
    '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">' +
    '<link rel="stylesheet" href="/styles.css"></head><body>' +
    '<a class="skip-link" href="#main">Skip to content</a><div class="article-shell">' +
    '<header class="site-header"><a class="wordmark" href="/"><span class="prompt">&gt;_</span> tejas<span class="muted">.research</span></a>' +
    '<nav aria-label="Article navigation"><a href="/#notes">← all notes</a></nav></header>' +
    '<main id="main"><header class="article-header"><p class="eyebrow">field notes / ' +
    escape(post.slug) +
    "</p>" +
    "<h1>" +
    escape(post.title) +
    '</h1><p class="article-meta">Tejas / <time datetime="' +
    post.date +
    '">' +
    prettyDate(post.date) +
    '</time></p><p class="article-summary">' +
    escape(post.summary) +
    "</p></header>" +
    '<article class="article-content">' +
    post.html +
    "</article></main>" +
    '<footer class="site-footer"><a href="/#notes">← back to notes</a><a href="/">tejas.research</a></footer></div></body></html>'
  );
}
const posts = [];
for (const filename of await readdir(path.join(root, "content/posts"))) {
  if (!filename.endsWith(".md") || filename.startsWith("_")) continue;
  const post = parsePost(
    await readFile(path.join(root, "content/posts", filename), "utf8"),
    filename,
  );
  if (post) posts.push(post);
}
posts.sort(
  (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
);
await rm(staging, { recursive: true, force: true });
await cp(path.join(root, "public"), staging, { recursive: true });
let home = await readFile(path.join(staging, "index.html"), "utf8");
const empty =
  '<div class="empty-notes"><pre class="empty-icon" aria-hidden="true">.-----.' +
  "\n|     |\n|  _  |\n'-----'</pre><div><p>No entries yet. The notebook is open.</p>" +
  '<p class="muted">Research notes will appear here as they’re published.</p></div><span class="empty-path">[ 0 entries ]</span></div>';
const listing = posts.length
  ? '<ol class="post-list">' +
    posts
      .map(
        (post) =>
          '<li><a class="post-link" href="/notes/' +
          post.slug +
          '/"><time datetime="' +
          post.date +
          '">' +
          prettyDate(post.date) +
          "</time><div><h3>" +
          escape(post.title) +
          "</h3><p>" +
          escape(post.summary) +
          '</p></div><span aria-hidden="true">↗</span></a></li>',
      )
      .join("") +
    "</ol>"
  : empty;
if (!home.includes("<!-- BLOG_POSTS -->"))
  throw new Error("Missing blog insertion marker.");
home = home.replace("<!-- BLOG_POSTS -->", listing);
await writeFile(path.join(staging, "index.html"), home);
await writeFile(path.join(staging, ".nojekyll"), "");
for (const post of posts) {
  const directory = path.join(staging, "notes", post.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), article(post));
}
await writeFile(
  path.join(staging, "404.html"),
  '<!doctype html><html lang="en"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>404 / Tejas</title>' +
    '<link rel="stylesheet" href="/styles.css"><main class="article-shell article-header">' +
    '<p class="eyebrow">404 / signal not found</p><h1>This path leads nowhere.</h1>' +
    '<p>The page may have moved. <a class="text-link" href="/">Return to the homepage →</a></p></main></html>',
);

// Catch broken local asset and article links before deployment.
async function checkLinks(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, item.name);
    if (item.isDirectory()) await checkLinks(filename);
    else if (item.name.endsWith(".html")) {
      const html = await readFile(filename, "utf8");
      for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (/^(?:[a-z]+:|#|\/\/)/i.test(url)) continue;
        const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
        if (!pathname) continue;
        const local = pathname.startsWith("/")
          ? path.join(staging, pathname)
          : path.resolve(directory, pathname);
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
    }
  }
}
await checkLinks(staging);
await rm(output, { recursive: true, force: true });
await rename(staging, output);
console.log(
  "Built portfolio + " +
    posts.length +
    " published note(s). Local links verified.",
);
