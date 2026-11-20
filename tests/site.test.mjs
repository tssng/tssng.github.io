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
import { sigilFrames } from "../scripts/lib/glyphs.mjs";
import { loadContent } from "../scripts/lib/content.mjs";

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
test("reports appear only when explicitly enabled in the project fixture", async () =>
  fixture(async ({ root, build, html }) => {
    await editProject(root, "world-model-adaptation", project => ({ ...project, reports: true }));
    await writeFile(
      path.join(
        root,
        "content/reports/world-model-adaptation/publication-check.md",
      ),
      "---\ntitle: Publication check\ndate: 2026-10-27\nsummary: A controlled report fixture.\nkind: report\ndraft: false\n---\n\nA controlled publication fixture.\n",
    );
    build();
    const home = await html("");
    assert.match(home, /data-world/);
    assert.match(home, /src="\/gridworld.js"/);
    assert.match(home, /class="ascii-sigil"/);
    assert.match(home, /data-sigil-size="small"/);
    assert.doesNotMatch(home, /class="grid-sigil"/);
    for (const sigil of ["sun", "fiber", "eye"]) {
      assert.match(home, new RegExp('data-animated-sigil="' + sigil + '"'));
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
    assert.match(rl, /data-sigil-size="large"/);
    assert.match(rl, /class="study-sigil sigil-toggle"/);
    assert.match(rl, /<details class="report-disclosure">/);
    assert.doesNotMatch(rl, /<details[^>]*\bopen\b/);
    assert.match(rl, /reports\/publication-check\//);
    const report = await html(
      "research/world-model-adaptation/reports/publication-check",
    );
    assert.match(report, /data-reading="true"/);
    assert.match(report, /data-theme="dark"/);
    assert.doesNotMatch(report, /data-reading-toggle|theme\.js/);
    assert.match(report, /A controlled publication fixture/);
    assert.match(report, /<h1>Publication check<\/h1>/);
    await assert.rejects(readFile(path.join(root, "build/content/site.json")));
  }));

test("ASCII animations retain fixed dimensions and the solar disc fills before rays appear", () => {
  for (const [size, columns, rows] of [["large", 49, 25], ["small", 25, 13]]) {
    for (const kind of ["sun", "eye", "fiber"]) {
      const frames = sigilFrames(kind, size);
      assert.equal(frames.length, kind === "sun" ? 5 : 3);
      for (const frame of frames) {
        assert.equal(frame.length, rows);
        assert.ok(frame.every(row => row.length === columns && /^[\x20-\x7e]+$/.test(row)));
      }
    }
    const frames = sigilFrames("sun", size);
    const lit = (frame) => frame.reduce((n, row) => n + [...row].filter(char => char !== " ").length, 0);
    for (let i = 1; i < frames.length; i++) assert.ok(lit(frames[i]) > lit(frames[i - 1]));
    const y = Math.floor(rows / 2), x = Math.floor(columns / 2);
    assert.equal(frames[0][y][x], " ");
    assert.notEqual(frames[2][y][x], " ");
    assert.notEqual(frames[3][y][x], " ");
    const rays = frame => frame.some((row, y) => [...row].some((char, x) => char !== " " && Math.hypot(x / (columns - 1) * 30 - 15, y / (rows - 1) * 30 - 15) > 10.5));
    assert.ok(frames.slice(0, 4).every(frame => !rays(frame)));
    assert.ok(rays(frames[4]));
  }
});
test("About preserves authored biography and supports optional social and resume links", async () =>
  fixture(async ({ root, build, html }) => {
    const filename = path.join(root, "content/site.json");
    const site = JSON.parse(await readFile(filename, "utf8"));
    site.bio = ["A biography that remains exactly as authored."];
    site.background = [
      { label: "Education", text: "A controlled education fixture." },
    ];
    site.socials = [{ label: "GitHub", url: "https://github.com/tssng" }];
    site.resume = null;
    await writeFile(filename, JSON.stringify(site));
    build();
    const about = await html("about");
    assert.match(about, /A biography that remains exactly as authored/);
    assert.match(about, /A controlled education fixture/);
    assert.match(about, /class="social-links"/);
    assert.doesNotMatch(about, /class="resume-link"/);
    await writeFile(
      path.join(root, "public/assets/resume-check.pdf"),
      "%PDF-1.4\nFixture only",
    );
    site.resume = "/assets/resume-check.pdf";
    await writeFile(filename, JSON.stringify(site));
    build();
    assert.match(
      await html("about"),
      /class="resume-link" href="\/assets\/resume-check.pdf"/,
    );
    site.resume = "javascript:alert(1)";
    await writeFile(filename, JSON.stringify(site));
    assert.throws(build, /site.resume must use HTTPS/);
  }));
test("turning reports off removes both notebook UI and previously built report routes", async () =>
  fixture(async ({ root, build, html }) => {
    await editProject(root, "world-model-adaptation", project => ({ ...project, reports: true }));
    await writeFile(
      path.join(
        root,
        "content/reports/world-model-adaptation/publication-check.md",
      ),
      "---\ntitle: Publication check\ndate: 2026-10-27\nsummary: A controlled report fixture.\nkind: report\ndraft: false\n---\n\nA controlled publication fixture.\n",
    );
    build();
    await html("research/world-model-adaptation/reports/publication-check");
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
      html("research/world-model-adaptation/reports/publication-check"),
    );
  }));
test("adding a project and an opted-in report needs content files only", async () =>
  fixture(async ({ root, build, html }) => {
    const existing = await loadContent(root);
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
        order:
          Math.max(...existing.projects.map((project) => project.order), 0) + 1,
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
    assert.equal((await html("research")).match(/class="research-item"/g).length, existing.projects.length + 1);
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

test("the gridworld reaches the goal from every reachable cell in both layouts", async () => {
  const { createWorld, advance, COLS } = await import('../public/world-model.js');
  for (let layout = 0; layout < 2; layout++) {
    const world = createWorld(layout);
    for (let start = 0; start < world.distance.length; start++) {
      if (world.distance[start] <= 1) continue;
      const state = { x: start % COLS, y: Math.floor(start / COLS), trail: [], arrived: false };
      for (let step = 0; !state.arrived && step <= world.distance[start]; step++) {
        const before = world.distance[state.y * COLS + state.x];
        advance(world, state);
        const k = state.y * COLS + state.x;
        assert.equal(world.walls[k], 0, 'the agent cannot enter a wall');
        if (!state.arrived) assert.equal(world.distance[k], before - 1);
      }
      assert.ok(state.arrived, `layout ${layout}, cell ${start} must reach the sun`);
    }
  }
});

test("moving walls relocates covered agents and the static sketch has complete layers", async () => {
  const { createWorld, initialState, relocate, drawWorld, COLS, ROWS } = await import('../public/world-model.js');
  const a = createWorld(0), b = createWorld(1);
  for (let k = 0; k < a.distance.length; k++) {
    if (a.distance[k] <= 1) continue;
    const state = { x: k % COLS, y: Math.floor(k / COLS), trail: [k], arrived: true };
    relocate(b, state);
    assert.ok(b.distance[state.y * COLS + state.x] > 1);
    assert.equal(state.arrived, false);
    assert.deepEqual(state.trail, []);
  }
  for (const policy of [false, true]) {
    const art = drawWorld(a, initialState(a), policy);
    for (const layer of Object.values(art)) {
      assert.equal(layer.split('\n').length, ROWS);
      assert.ok(layer.split('\n').every(row => row.length === COLS && /^[\x20-\x7e]+$/.test(row)));
    }
  }
});

test("folder posts publish adjacent media and Markdown boxes without publishing drafts or source files", async () =>
  fixture(async ({ root, build, html }) => {
    const directory = path.join(root, "content/posts/with-images");
    await mkdir(path.join(directory, "images"), { recursive: true });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';
    await writeFile(path.join(directory, "images/_a&b.svg"), svg);
    await writeFile(path.join(directory, "private.md"), "Source only");
    const filename = path.join(directory, "index.md");
    const source = '---\ntitle: Images and boxes\ndate: 2026-11-20\nsummary: An authoring fixture.\ndraft: true\n---\n\n![Alt text](./images/_a&b.svg "A caption & its meaning")\n\n> [!NOTE] A <title>\n>\n> Some **evidence** with [a link](/research/).\n>\n> - First point\n> - Second point\n\n```text\n> [!NOTE]\n> This is literal code.\n```\n';
    await writeFile(filename, source);
    build();
    const original = await html("");
    await assert.rejects(html("notes/with-images"));
    await assert.rejects(readFile(path.join(root, "build/notes/with-images/images/_a&b.svg")));
    execFileSync(process.execPath, ["scripts/build.mjs", "--preview"], { cwd: root });
    assert.equal(await html(""), original, "preview cannot replace public build");
    const preview = await readFile(path.join(root, ".preview-build/notes/with-images/index.html"), "utf8");
    assert.match(preview, /Draft · visible only in local preview/);
    assert.match(preview, /noindex, nofollow/);
    assert.equal(await readFile(path.join(root, ".preview-build/notes/with-images/images/_a&b.svg"), "utf8"), svg);
    await writeFile(filename, source.replace("draft: true", "draft: false"));
    build();
    const post = await html("notes/with-images");
    assert.match(post, /<figure class="article-figure">/);
    assert.match(post, /<figcaption>A caption &amp; its meaning<\/figcaption>/);
    assert.match(post, /class="text-box text-box-note"/);
    assert.match(post, /A &lt;title&gt;/);
    assert.match(post, /<strong>evidence<\/strong>/);
    assert.match(post, /<li>First point<\/li>/);
    assert.equal((post.match(/class="text-box text-box-note"/g) || []).length, 1, "code blocks are literal");
    assert.doesNotMatch(post, /noindex|draft-label|__preview/);
    await assert.rejects(readFile(path.join(root, "build/notes/with-images/private.md")));
    await assert.rejects(readFile(path.join(root, "build/notes/with-images/index.md")));
    await rm(path.join(directory, "images/_a&b.svg"));
    assert.throws(build, /Broken local link/);
    assert.equal(await html("notes/with-images"), post, "broken image keeps last good build");
    await writeFile(path.join(directory, "images/_a&b.svg"), svg);
    await writeFile(path.join(root, "content/posts/with-images.md"), source.replace("draft: true", "draft: false"));
    assert.throws(build, /Duplicate post slug/);
  }));

test("new-post commands create editable drafts and refuse to overwrite posts", async () =>
  fixture(async ({ root, build, html }) => {
    const create = args => execFileSync(process.execPath, ["scripts/new-post.mjs", ...args], { cwd: root, encoding: "utf8", stdio: "pipe" });
    create(['A "quoted" title']);
    const filename = path.join(root, "content/posts/a-quoted-title/index.md");
    const source = await readFile(filename, "utf8");
    assert.match(source, /draft: true/);
    assert.match(source, /^date: \d{4}-\d{2}-\d{2}$/m);
    assert.throws(() => create(['A "quoted" title']), /already uses/);
    assert.equal(await readFile(filename, "utf8"), source);
    assert.throws(() => create(["--report", "myelin-segmentation", "Hidden report"]), /Enable "reports": true/);
    await editProject(root, "world-model-adaptation", project => ({ ...project, reports: true }));
    create(["--report", "world-model-adaptation", "First progress check"]);
    const reportPath = path.join(root, "content/reports/world-model-adaptation/first-progress-check");
    let report = await readFile(path.join(reportPath, "index.md"), "utf8");
    report = report.replace("draft: true", "draft: false") + '\n![Report image](./plot.svg "Report caption")\n';
    await writeFile(path.join(reportPath, "index.md"), report);
    await writeFile(path.join(reportPath, "plot.svg"), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    build();
    assert.match(await html("research/world-model-adaptation/reports/first-progress-check"), /Report caption/);
    assert.match(await readFile(path.join(root, "build/research/world-model-adaptation/reports/first-progress-check/plot.svg"), "utf8"), /<svg/);
    await assert.rejects(html("notes/a-quoted-title"));
  }));
