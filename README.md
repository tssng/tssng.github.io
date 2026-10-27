# Tejas / research & notes

A static research portfolio with a clean ASCII aesthetic, an interactive
value-iteration gridworld, project notes, and a Markdown blog. No client framework
or external font service is required.

## Local development

Use Node.js 22 or newer.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4173. Rebuild after edits, then refresh.

## Publish a blog post

1. Copy `content/posts/_template.md` to `content/posts/your-post-slug.md`.
2. Set `title`, `date` (YYYY-MM-DD), and a one-line `summary`.
3. Write the body in Markdown. Set `draft: false` to publish.
4. Run `npm run build`. Published posts appear automatically in the homepage’s
   notes section and at `/notes/your-post-slug/`, sorted newest first.

Files starting with `_` and posts with `draft: true` are never published.
The title becomes the page’s H1; start body sections with `##`.
Put images in `public/assets/` and use paths such as `/assets/figure.png`.
Front matter uses simple single-line fields, not full YAML. For text that needs
quoting, double quotes follow JSON string rules. Markdown may contain HTML;
posts are trusted repository source, so review outside contributions.

## Edit the portfolio

- `public/index.html`: name, introduction, bio, project summaries, and links.
- `public/script.js`: project detail text and the toy gridworld.
- `public/styles.css`: colors, type, responsive layout, and article styling.
- `public/assets/fonts/`: self-hosted IBM Plex Mono with its OFL license.
- `content/posts/`: blog posts.

Project figures are illustrative ASCII diagrams, not experimental images.
The gridworld is an interactive demonstration, not a claim of RL research:
5×5 deterministic states, four cardinal actions, fixed walls, terminal goal,
reward +1 at the goal and −0.04 otherwise, discount 0.95. Value iteration solves
the Bellman optimality equation; the agent follows its greedy policy. “Return”
is the discounted sum of rewards since reset. Goal value is zero because it is
terminal. Controls never start animation automatically.

The Aletheia link points to the organizer’s repository; it is labeled accordingly.
No publication record, affiliation, CV, or contact information has been invented.

## GitHub Pages

`.github/workflows/pages.yml` builds on pushes to `main` and manual runs, then
deploys `build/` through GitHub Actions.

In GitHub → repository **Settings → Pages → Build and deployment**, select
**GitHub Actions** as the source. This is needed once if the repository previously
published from `gh-pages`. Merge the redesign branch into `main` to trigger it.
The generated output includes `.nojekyll` and a custom 404 page.

Build artifacts and dependency folders are ignored. The build validates post
metadata and local HTML links before replacing the output directory.
