# ECLIPSE / Tejas

An observatory for learned systems. A static portfolio with an interactive square-grid
instrument, a research index, project summaries, optional project notebooks, and a
Markdown blog. Built with Node.js and Marked; no client framework or font service.

## Run locally

Use Node.js 22 or newer (`nvm use` reads `.nvmrc`).

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4173. Rebuild after content edits, then refresh.
Run `npm test` to verify content publication and report opt-in behavior.

## Where content lives

| Content                        | Source                                 |
| ------------------------------ | -------------------------------------- |
| Name, bio, interests, GitHub   | `content/site.json`                    |
| Project summaries              | `content/projects/<project-slug>.json` |
| Optional project reports       | `content/reports/<project-slug>/*.md`  |
| Blog posts                     | `content/posts/*.md`                   |
| Page layouts and navigation    | `scripts/lib/render.mjs`               |
| Generated grid sigils          | `scripts/lib/glyphs.mjs`               |
| Styling and reading layouts    | `public/styles.css`                    |
| Glyph interactions and filters | `public/site.js`                       |

The build generates `/`, `/research/`, `/research/<project-slug>/`,
`/notes/`, `/about/`, and any published article routes. Do not edit `build/`.

## Add a project

Copy `content/projects/_template.json` to a lowercase, hyphen-separated filename
such as `content/projects/causal-memory.json`. The filename becomes the URL slug.
Set a unique numeric `order`, then edit the title, area, summary, question,
abstract paragraphs, and tags.

Choose a sigil: `sun`, `fiber`, or `eye`. Every symbol uses the same 31 × 31
matrix of square cells. Shapes remain consistent across the homepage, research
index, and project summary pages. Categories are discovered from project
files and appear automatically in the research index filter.
Optional `links` use objects with `label` and an HTTPS `url`.

A new project appears on the homepage and research index and gets its own summary
page after a build. No template or navigation edits are required.

## Opt in to research reports

Reports are **off by default**. Omit `reports` or set it to `false` to keep a
project as a summary preview. The build emits no notebook section, expansion
control, report count, report links, or report pages for that project.
Files in a disabled project's report folder are not read or published.

To enable a notebook:

1. Add `"reports": true` to that project's JSON.
2. Create `content/reports/<project-slug>/`.
3. Copy `content/reports/_template.md` into that folder with a descriptive filename.
4. Write the report and change `draft: true` to `draft: false` when ready.

The project summary gets a native, keyboard-accessible expandable notebook.
Published reports appear newest first, each with its own reading page:
`/research/<project-slug>/reports/<report-slug>/`.
An opted-in notebook with no published reports shows a simple empty state.

The myelin segmentation and Aletheia’s Quest projects currently have reports off.
World-model adaptation has reports on, with one explicitly labeled placeholder.

## Add a blog post

Copy `content/posts/_template.md` to `content/posts/your-post-slug.md`.
Set `title`, `date` (YYYY-MM-DD), and a one-line `summary`; write Markdown below
the front matter and set `draft: false` to publish.
Blog posts appear at `/notes/your-post-slug/` and in the chronological notes index.

Front matter accepts single-line `title`, `date`, `summary`, `draft`, and optional
`kind` fields. This is a small subset, not full YAML. Double-quoted values follow
JSON string rules. Supported kinds: `note`, `progress`, `report`, `placeholder`.
Files beginning with `_` and entries with `draft: true` are never published.

Markdown is trusted repository source and may contain HTML. Use `##` for body
sections since the title supplies H1. Put images in `public/assets/` and link to
them with absolute paths such as `/assets/figure.png`.
Use HTML `<figure>` / `<figcaption>` for numbered figures and
`<aside class="margin-note">` for an annotation.

Every page uses the dark ECLIPSE palette, including long-form notes and reports.
There is no light theme or reading-mode toggle. Earlier saved reading preferences
have no effect. Content, report expansion, and navigation work without JavaScript.

## Design behavior

The homepage instrument switches between the three approved grid sigils: sun for
RL interpretability, circular cross-section plus longitudinal fiber for myelin,
and eye for Aletheia’s Quest. Selection, project hover, and keyboard focus reveal
the corresponding sigil with a restrained fade. The initial sigil is the sun.
Inactive cells are transparent, so sigils blend into the surrounding background.
Illuminated cells use amber, with a brighter selected cell. The same SVG matrix
scales to project thumbnails and summary-page studies.
Nothing animates continuously, and reduced-motion preferences remove transitions.
Sigils are abstract project identities, not experimental figures or reported results.
The long-form typefaces and IBM Plex Mono are self-hosted with their OFL licenses.

## Deployment

The GitHub Pages workflow builds on pushes to `main` and manual runs.
In repository **Settings → Pages → Build and deployment**, choose **GitHub
Actions** as the source. Merge the review branch into `main` to deploy.
The output includes a custom 404 page and `.nojekyll`.

Builds validate metadata, configuration, and local asset/article links before
replacing the last working `build/` directory. Disabled reports and drafts do not
exist in the output. This is a publication option, not authentication: source
committed to a public repository is still public even when omitted from the site.
