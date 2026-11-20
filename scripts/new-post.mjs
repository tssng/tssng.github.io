import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const report = args[0] === "--report";
if (report) args.shift();
const project = report ? args.shift() : null;
let title = args.join(" ").trim();
try {
  if (report) {
    if (!project || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project))
      throw new Error('Use npm run new:report -- project-slug "Report title".');
    const config = JSON.parse(await readFile(path.join(root, "content/projects", project + ".json"), "utf8"));
    if (config.reports !== true) throw new Error('Enable "reports": true for this project first.');
  }
  if (!title && process.stdin.isTTY) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    try { title = (await prompt.question("Post title: ")).trim(); } finally { prompt.close(); }
  }
  if (!title || /[\r\n]/.test(title)) throw new Error('Provide a one-line title, e.g. npm run new:post -- "My first post".');
  const slug = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("The title must contain at least one English letter or number.");
  const parent = path.join(root, report ? "content/reports/" + project : "content/posts");
  await mkdir(parent, { recursive: true });
  const existing = await readdir(parent);
  if (existing.includes(slug) || existing.includes(slug + ".md")) throw new Error("A post already uses " + slug + ". Choose a different title.");
  const folder = path.join(parent, slug);
  await mkdir(folder); // Fails rather than overwriting an existing post.
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const template = await readFile(path.join(root, report ? "content/reports/_template.md" : "content/posts/_template.md"), "utf8");
  const source = template.replace(/^title:.*$/m, "title: " + JSON.stringify(title)).replace(/^date:.*$/m, "date: " + date);
  await writeFile(path.join(folder, "index.md"), source, { flag: "wx" });
  console.log("Created " + path.relative(root, path.join(folder, "index.md")));
  console.log("Put images in the same folder and link them with ![Description](./image.png).");
  console.log("Run npm run dev to preview. Set draft: false when ready to publish.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
