# Writing and editing

A post is a Markdown file with a small header. Put images in the same folder and place them anywhere in the text. Blog posts and project reports use the same format.

## Start a post

Use Node 22 or newer (see `.nvmrc`). Run `npm ci` once after cloning the repository, then:

```sh
npm run new:post -- "My first post"
npm run dev
```

Open `content/posts/my-first-post/index.md` in your editor. The preview is at http://127.0.0.1:4173; click **Notes** to find your draft. Every save rebuilds the preview and refreshes your browser. Ctrl+C stops the server.

There is a complete, unpublished example at `content/posts/writing-example/index.md`. With the preview running, visit http://127.0.0.1:4173/notes/writing-example/ to see it.

```text
content/posts/my-first-post/
  index.md
  result.png
  another-image.jpg
```

You can also create this folder yourself and copy `content/posts/_template.md` into it as `index.md`. Existing standalone files such as `content/posts/my-note.md` still work; their images go in `public/assets/` and use `/assets/image.png` links.

## Write in Markdown

The header goes at the very top:

```yaml
---
title: My first post
date: 2026-11-20
summary: One sentence for the list of posts.
draft: true
---
```

Use one line per header field. Dates use `YYYY-MM-DD`. Plain text values do not need quotes; if you use double quotes, escape inner double quotes as `\"`. Everything below the closing `---` is your post. Use `##` for section headings; the site displays the title automatically.

```markdown
A paragraph with **bold**, *italics*, and [a hyperlink](https://example.com).

## A section

- One point
- Another point

![Describe what the image shows](./result.png "An optional caption")

> [!NOTE] A title for this text box
>
> Put **text**, [links](https://example.com), or lists here.
>
> This is a second paragraph inside the same box.
```

Move the image or text-box block above or below a paragraph to place it there. Images fit the reading column automatically. Keep a standalone image on its own line, with blank lines around it. The quoted text becomes a caption; omit it for an image without a caption. For filenames with spaces, use `![Description](<./my image.png>)`.

Text boxes support `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]`. A custom title is optional. Keep `>` at the start of every line inside the box, including blank lines. A normal `>` blockquote also works.

Links use `[visible text](destination)`: external websites use full HTTPS URLs; your own pages can use `/research/` or `/notes/my-first-post/`. Code blocks, tables, numbered lists, and normal Markdown formatting work too.

Supported adjacent files: PNG, JPEG, GIF, WebP, AVIF, SVG, PDF, MP4, and WebM. Subfolders such as `images/plot.png` work. Use Markdown image syntax for images, normal links for downloadable files, and HTML `<video controls src="./clip.mp4"></video>` for videos.

## Publish

In the repository’s **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Deploying directly from the source branch renders the README instead of the built website.

1. Change `draft: true` to `draft: false`.
2. Run `npm run build`. It checks local links and images and tells you if something is missing.
3. Commit the post folder, including its images, and push to `main`. GitHub Pages publishes it automatically.

For example:

```sh
git add content/posts/my-first-post
git commit -m "Publish My first post"
git push origin main
```

`draft: true` excludes a post and its adjacent files from the published site. Local preview includes drafts in a separate ignored directory, so previewing cannot overwrite the production build. Draft source committed to this public GitHub repository is still visible on GitHub.

If a save introduces a broken image or invalid header, the preview shows the error and keeps the last working page. Fix the file and save again. Publishing builds also preserve the last good output on failure.

## Write a project report

```sh
npm run new:report -- world-model-adaptation "First progress check"
```

This creates `content/reports/world-model-adaptation/first-progress-check/index.md`. Write and add images exactly as for a blog post. The project must have `"reports": true` in its JSON. Reports appear in that project's expandable **Reports & progress** section.

## Edit other content

- `content/site.json`: homepage `introduction`, name, biography, education/work/citizenship, social links, and optional `resume`. A résumé can be an HTTPS URL or `/assets/resume.pdf` with the file in `public/assets/`.
- `content/projects/*.json`: project titles, summaries, research questions, and paragraphs. Copy `_template.json` to add a project; give it a unique `order` and filename. `glyph` can be `sun`, `eye`, or `fiber`.
- `scripts/lib/render.mjs` and `public/styles.css`: layout and appearance. You do not need to edit these to write a post or add images.

## Animation files

The gridworld is a shortest-path illustration in `public/world-model.js`; playback is in `public/gridworld.js`. ASCII sigils are in `scripts/lib/glyphs.mjs`, `scripts/lib/ascii-sigil-frames.json`, and `public/site.js`. Their `large` frames are 49 × 25 characters and `small` frames are 25 × 13. Spaces are transparent. The sun has five held frames; eye and fiber have three. Hover/focus plays forward, leaving reverses, and project-page drawings support tap-to-hold and Escape. Reduced motion shows the endpoint immediately.
