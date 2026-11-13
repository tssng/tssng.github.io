# Editing the website

Use Node 22 or newer. Run `npm run build`, then `npm start` to preview at http://127.0.0.1:4173. Run `npm test` before publishing. Pushing to `main` runs the GitHub Pages build and deployment.

- `content/site.json`: name, homepage `introduction`, biography, background, GitHub link, and optional `resume`. A résumé can be an HTTPS URL or a local path such as `/assets/resume.pdf` with the file in `public/assets/`.
- `content/projects/*.json`: project titles, summaries, questions, and paragraphs. Copy `_template.json` to add a project; choose a unique `order` and filename. The `glyph` can be `sun`, `eye`, or `fiber`. Area/category/tags remain available as content fields but aren't displayed as labels.
- `content/reports/<project-slug>/*.md`: reports appear only when the project's JSON has `"reports": true`. Other projects stay simple summaries.
- `content/posts/*.md`: blog posts. Copy `_template.md`, give it a new filename, and set `draft: false` to publish. Notes appear on the homepage when there are published posts.

The homepage gridworld is a shortest-path illustration, not a trained agent. Its geometry and route calculations live in `public/world-model.js`; playback, visibility, and reduced-motion handling live in `public/gridworld.js`. It has a static rendering when JavaScript is unavailable. The existing sigil frames and hover animations live in `scripts/lib/glyphs.mjs`, `scripts/lib/sigil-patterns.json`, and `public/site.js`.

Page layouts are in `scripts/lib/render.mjs`; appearance is in `public/styles.css`. Typography follows the supplied HTML references with system Times fonts; only the ASCII artwork uses the self-hosted Plex font.
