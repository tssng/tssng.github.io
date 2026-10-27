import test from "node:test";
import assert from "node:assert/strict";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../", import.meta.url));
async function fixture(fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), "eclipse-test-"));
  try {
    for (const directory of ["public", "content", "scripts"])
      await cp(path.join(source, directory), path.join(root, directory), {
        recursive: true,
      });
    await symlink(
      path.join(source, "node_modules"),
      path.join(root, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );
    const build = () =>
      execFileSync(process.execPath, ["scripts/build.mjs"], {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe",
      });
    const html = (route) =>
      readFile(path.join(root, "build", route, "index.html"), "utf8");
    await fn({ root, build, html });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
async function editProject(root, slug, edit) {
  const filename = path.join(root, "content/projects", slug + ".json");
  const data = JSON.parse(await readFile(filename, "utf8"));
  await writeFile(filename, JSON.stringify(edit(data)));
}
test("only the opted-in RL project has reports; the original projects remain previews", async () =>
  fixture(async ({ root, build, html }) => {
    build();
    const home = await html("");
    assert.match(home, /class="instrument" data-state="sun"/);
    for (const sigil of ["sun", "fiber", "eye"]) {
      assert.match(home, new RegExp('data-state-button="' + sigil + '"'));
    }
    for (const slug of ["myelin-segmentation", "aletheias-quest"]) {
      const preview = await html("research/" + slug);
      assert.doesNotMatch(
        preview,
        /report-disclosure|reports-section|Research notebook/,
      );
      assert.match(preview, /class="abstract"/);
      assert.match(
        preview,
        new RegExp(
          'data-sigil="' +
            (slug === "myelin-segmentation" ? "fiber" : "eye") +
            '"',
        ),
      );
    }
    const rl = await html("research/world-model-adaptation");
    assert.match(rl, /data-sigil="sun"/);
    assert.match(rl, /<details class="report-disclosure">/);
    assert.doesNotMatch(rl, /<details[^>]*\bopen\b/);
    assert.match(rl, /reports\/opening-observation\//);
    assert.match(rl, /Placeholder \/ no results reported/);
    const report = await html(
      "research/world-model-adaptation/reports/opening-observation",
    );
    assert.match(report, /data-reading="true"/);
    assert.match(report, /data-theme="dark"/);
    assert.doesNotMatch(report, /data-reading-toggle|theme\.js/);
    assert.match(report, /No experiment/);
    assert.match(report, /<h1>Opening observation<\/h1>/);
    await assert.rejects(readFile(path.join(root, "build/content/site.json")));
  }));
test("turning reports off removes both notebook UI and previously built report routes", async () =>
  fixture(async ({ root, build, html }) => {
    build();
    await editProject(root, "world-model-adaptation", (project) => ({
      ...project,
      reports: false,
    }));
    // Even an invalid leftover report is ignored when reports are disabled.
    await writeFile(
      path.join(root, "content/reports/world-model-adaptation/unpublished.md"),
      "not valid front matter",
    );
    build();
    assert.doesNotMatch(
      await html("research/world-model-adaptation"),
      /reports-section|report-disclosure|opening-observation/,
    );
    await assert.rejects(
      html("research/world-model-adaptation/reports/opening-observation"),
    );
  }));
test("adding a project and an opted-in report needs content files only", async () =>
  fixture(async ({ root, build, html }) => {
    const project = JSON.parse(
      await readFile(
        path.join(root, "content/projects/_template.json"),
        "utf8",
      ),
    );
    await writeFile(
      path.join(root, "content/projects/new-research.json"),
      JSON.stringify({
        ...project,
        title: "A new research question",
        reports: true,
      }),
    );
    await mkdir(path.join(root, "content/reports/new-research"));
    await writeFile(
      path.join(root, "content/reports/new-research/first-check.md"),
      "---\ntitle: First check\ndate: 2026-10-27\nsummary: A test entry.\nkind: progress\ndraft: false\n---\n\n## Observation\n\nSome **evidence**.\n",
    );
    build();
    assert.match(await html(""), /A new research question/);
    assert.match(await html("research"), /4 projects/);
    assert.match(await html("research/new-research"), /reports\/first-check\//);
    assert.match(
      await html("research/new-research/reports/first-check"),
      /<strong>evidence<\/strong>/,
    );
  }));
test("blog publication escapes metadata, renders Markdown, and excludes drafts", async () =>
  fixture(async ({ root, build, html }) => {
    const directory = path.join(root, "content/posts");
    await writeFile(
      path.join(directory, "a-published-note.md"),
      "---\ntitle: A <signal> & its limits\ndate: 2026-10-27\nsummary: A concise note.\ndraft: false\n---\n\n## Question\n\nA **body** with [research](/research/).\n",
    );
    await writeFile(
      path.join(directory, "a-private-draft.md"),
      "---\ntitle: Private draft\ndate: 2026-10-26\nsummary: Unpublished.\ndraft: true\n---\nDraft text.",
    );
    build();
    const post = await html("notes/a-published-note");
    assert.match(post, /data-theme="dark"/);
    assert.match(post, /A &lt;signal&gt; &amp; its limits/);
    assert.match(post, /<strong>body<\/strong>/);
    assert.match(await html("notes"), /notes\/a-published-note/);
    assert.doesNotMatch(await html(""), /Private draft/);
    await assert.rejects(html("notes/a-private-draft"));
  }));
test("invalid configuration and broken article links preserve the last good build", async () =>
  fixture(async ({ root, build, html }) => {
    build();
    const home = await html("");
    await editProject(root, "world-model-adaptation", (project) => ({
      ...project,
      reports: "true",
    }));
    assert.throws(build, /reports must be boolean/);
    assert.equal(await html(""), home);
    await editProject(root, "world-model-adaptation", (project) => ({
      ...project,
      reports: true,
    }));
    const filename = path.join(root, "content/posts/broken-note.md");
    const metadata =
      "---\ntitle: A broken note\ndate: 2026-02-30\nsummary: A test.\ndraft: false\n---\n";
    await writeFile(filename, metadata);
    assert.throws(build, /real YYYY-MM-DD/);
    assert.equal(await html(""), home);
    await writeFile(
      filename,
      metadata.replace("2026-02-30", "2026-10-27") +
        "[missing](/missing-page/)",
    );
    assert.throws(build, /Broken local link/);
    assert.equal(await html(""), home);
  }));
