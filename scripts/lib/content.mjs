import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { SIGILS } from "./glyphs.mjs";

export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
export const prettyDate = (date) =>
  new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value, label) => {
  if (typeof value !== "string" || !value.trim())
    throw new Error(label + " must be a nonempty string.");
  return value;
};
export function parsePost(source, filename) {
  const match = source
    .replace(/\r\n/g, "\n")
    .match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(filename + ": expected --- front matter.");
  const meta = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const field = line.match(/^([a-z]+):\s*(.*)$/);
    if (!field)
      throw new Error(filename + ": use single-line key: value metadata.");
    const [, key, raw] = field;
    if (
      !["title", "date", "summary", "draft", "kind"].includes(key) ||
      key in meta
    )
      throw new Error(filename + ": unknown or duplicate field " + key);
    meta[key] = raw.startsWith('"') ? JSON.parse(raw) : raw;
  }
  if (meta.draft !== undefined && !["true", "false"].includes(meta.draft))
    throw new Error(filename + ": draft must be true or false.");
  if (meta.draft === "true") return null;
  for (const key of ["title", "date", "summary"])
    text(meta[key], filename + ": " + key);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(meta.date) ||
    !Number.isFinite(Date.parse(meta.date)) ||
    new Date(meta.date).toISOString().slice(0, 10) !== meta.date
  )
    throw new Error(filename + ": date must be a real YYYY-MM-DD date.");
  const slug = filename.replace(/\.md$/, "");
  if (!slugPattern.test(slug))
    throw new Error(filename + ": use a lowercase, hyphen-separated filename.");
  if (
    meta.kind &&
    !["note", "report", "progress", "placeholder"].includes(meta.kind)
  )
    throw new Error(filename + ": invalid kind.");
  return {
    ...meta,
    slug,
    kind: meta.kind || "note",
    html: marked.parse(match[2]),
  };
}
async function markdownFiles(directory) {
  let filenames;
  try {
    filenames = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const posts = [];
  for (const filename of filenames.sort()) {
    if (!filename.endsWith(".md") || filename.startsWith("_")) continue;
    const post = parsePost(
      await readFile(path.join(directory, filename), "utf8"),
      filename,
    );
    if (post) posts.push(post);
  }
  return posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );
}
export async function loadContent(root) {
  const site = JSON.parse(
    await readFile(path.join(root, "content/site.json"), "utf8"),
  );
  for (const key of ["name", "identity", "tagline", "description", "github"])
    text(site[key], "site." + key);
  if (!/^https:\/\//.test(site.github))
    throw new Error("site.github must be an HTTPS URL.");
  for (const key of ["bio", "interests"]) {
    if (!Array.isArray(site[key]) || !site[key].length)
      throw new Error("site." + key + " must be a nonempty array.");
    site[key].forEach((item) => text(item, "site." + key));
  }
  if (site.background !== undefined) {
    if (!Array.isArray(site.background))
      throw new Error("site.background must be an array.");
    for (const fact of site.background) {
      text(fact.label, "site.background label");
      text(fact.text, "site.background text");
    }
  }
  if (site.socials !== undefined) {
    if (!Array.isArray(site.socials))
      throw new Error("site.socials must be an array.");
    for (const link of site.socials) {
      text(link.label, "site.socials label");
      let url;
      try {
        url = new URL(link.url);
      } catch {
        throw new Error("site.socials links must be valid HTTPS URLs.");
      }
      if (url.protocol !== "https:")
        throw new Error("site.socials links must use HTTPS.");
    }
  }
  if (site.resume != null) {
    text(site.resume, "site.resume");
    if (!site.resume.startsWith("/") || site.resume.startsWith("//")) {
      let url;
      try {
        url = new URL(site.resume);
      } catch {
        throw new Error(
          "site.resume must be an HTTPS URL or a local path such as /assets/resume.pdf.",
        );
      }
      if (url.protocol !== "https:")
        throw new Error("site.resume must use HTTPS or a local site path.");
    }
  }
  const directory = path.join(root, "content/projects");
  const projects = [];
  for (const filename of (await readdir(directory)).sort()) {
    if (!filename.endsWith(".json") || filename.startsWith("_")) continue;
    const project = JSON.parse(
      await readFile(path.join(directory, filename), "utf8"),
    );
    project.slug = filename.replace(/\.json$/, "");
    if (!slugPattern.test(project.slug))
      throw new Error(filename + ": invalid filename.");
    for (const key of ["title", "area", "category", "summary", "question"])
      text(project[key], filename + ": " + key);
    if (!slugPattern.test(project.category))
      throw new Error(filename + ": category must be a slug.");
    if (!Number.isFinite(project.order) || project.order < 1)
      throw new Error(filename + ": order must be a positive number.");
    if (!Object.hasOwn(SIGILS, project.glyph))
      throw new Error(filename + ": invalid glyph.");
    for (const key of ["abstract", "tags"]) {
      if (!Array.isArray(project[key]) || !project[key].length)
        throw new Error(filename + ": " + key + " must be a nonempty array.");
      project[key].forEach((value) => text(value, filename + ": " + key));
    }
    if (project.reports !== undefined && typeof project.reports !== "boolean")
      throw new Error(filename + ": reports must be boolean.");
    for (const link of project.links || []) {
      text(link.label, filename + ": link label");
      if (typeof link.url !== "string" || !/^https:\/\//.test(link.url))
        throw new Error(filename + ": links must use HTTPS.");
    }
    // Disabled report folders are not read or emitted, even if files exist.
    project.entries =
      project.reports === true
        ? await markdownFiles(path.join(root, "content/reports", project.slug))
        : [];
    projects.push(project);
  }
  projects.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  if (
    new Set(projects.map((project) => project.order)).size !== projects.length
  )
    throw new Error("Project order values must be unique.");
  return {
    site,
    projects,
    posts: await markdownFiles(path.join(root, "content/posts")),
  };
}
