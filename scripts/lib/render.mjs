import { escape as e, prettyDate } from "./content.mjs";
import { glyph, SIGILS } from "./glyphs.mjs";
import { createWorld, initialState, drawWorld } from "../../public/world-model.js";

const projectUrl = (project) => "/research/" + project.slug + "/";
const reportUrl = (project, post) =>
  projectUrl(project) + "reports/" + post.slug + "/";

export function renderSite({ site, projects, posts }) {
  const fullName = `${site.name} ${site.identity}`;
  function header(section, home = false) {
    return `<header class="site-header${home ? " home-header" : ""}">${home ? `<h1 class="identity">${e(fullName)}</h1>` : `<a class="identity" href="/">${e(fullName)}</a>`}
      <nav aria-label="Main navigation">${[["research", "Research"], ["notes", "Notes"], ["about", "About"]].map(([key, label]) => `<a href="/${key}/"${section === key ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav></header>`;
  }
  function footer() {
    return `<footer class="site-footer"><a href="/">${e(fullName)}</a><a href="${e(site.github)}">GitHub</a></footer>`;
  }
  function page(
    body,
    {
      title,
      description = site.description,
      section = "",
      reading = false,
      home = false,
    } = {},
  ) {
    return `<!doctype html><html lang="en" data-theme="dark"${reading ? ' data-reading="true"' : ""}><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${e(title ? title + " / " + site.name : fullName)}</title>
      <meta name="description" content="${e(description)}"><meta name="theme-color" content="#131313">
      <meta property="og:title" content="${e(title || fullName)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="${reading ? "article" : "website"}">
      <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><script src="/site.js" defer></script>${home ? '<script type="module" src="/gridworld.js"></script>' : ""}
      </head><body class="no-js${home ? " home-page" : ""}"><a class="skip-link" href="#main">Skip to content</a><div class="site-shell">${header(section, home)}<main id="main">${body}</main>${footer()}</div></body></html>`;
  }
  function row(project, heading = "h3") {
    return `<article class="research-item"><a class="research-row" href="${projectUrl(project)}" data-sigil-trigger>
      <div class="row-copy"><${heading}>${e(project.title)}</${heading}><p class="row-summary">${e(project.summary)}</p></div>
      <div class="row-glyph" aria-hidden="true">${glyph(project.glyph)}</div></a></article>`;
  }
  function postList(entries, href) {
    return `<ol class="post-list">${entries.map((post) => `<li><a class="post-row" href="${href(post)}"><div><h3>${e(post.title)}</h3><p>${e(post.summary)}</p></div><time datetime="${post.date}">${prettyDate(post.date)}</time></a></li>`).join("")}</ol>`;
  }
  const emptyNotes = '<p class="empty-notes">Nothing here yet.</p>';
  function worldSketch() {
    const world = createWorld(0);
    const state = initialState(world);
    const art = drawWorld(world, state);
    return `<figure class="world-sketch"><div class="world-art" role="img" aria-label="An ASCII maze. An at-sign follows a path through walls toward a sun." data-world>
      ${["field", "walls", "sun", "trail"].map(layer => `<pre class="world-${layer}" data-world-layer="${layer}" aria-hidden="true">${e(art[layer])}</pre>`).join("")}
      <span class="world-agent" aria-hidden="true" style="left:${state.x / 72 * 100}%;top:${state.y / 24 * 100}%">@</span></div>
      <div class="world-controls" hidden><button type="button" data-world-action="walls">Move the walls</button><button type="button" data-world-action="policy" aria-pressed="false">Show policy</button><button type="button" data-world-action="pause" aria-pressed="false">Pause</button></div>
      <span class="sr-only" role="status" data-world-status></span></figure>`;
  }
  const pages = new Map();
  pages.set("index.html", page(
    `<section class="home-intro" aria-label="Introduction"><p>${e(site.introduction || site.bio[0])}</p></section>
    ${worldSketch()}
    <section class="home-section" aria-labelledby="research-title"><div class="section-heading"><h2 id="research-title">Research</h2></div><div class="research-list">${projects.map(project => row(project)).join("")}</div></section>
    ${posts.length ? `<section class="home-section" aria-labelledby="notes-title"><div class="section-heading"><h2 id="notes-title">Notes</h2><a href="/notes/">All notes</a></div>${postList(posts.slice(0, 3), post => "/notes/" + post.slug + "/")}</section>` : ""}
    <section class="home-section home-about" aria-labelledby="about-title"><h2 id="about-title">About</h2><div>${(site.background || []).slice(0, 2).map(fact => `<p>${e(fact.text)}</p>`).join("")}<a href="/about/">More about me</a></div></section>`, {home: true}));
  pages.set("research/index.html", page(
    `<header class="page-heading"><h1>Research</h1></header><div class="research-list research-index">${projects.map(project => row(project, "h2")).join("")}</div>`,
    {title: "Research", section: "research"}));
  for (const project of projects) {
    const reports =
      project.reports === true
        ? `<section class="reports-section" aria-labelledby="reports-title"><div class="section-heading"><h2 id="reports-title">Reports & progress</h2></div>
      <details class="report-disclosure"><summary><span>Read the entries</span><span class="report-count">${project.entries.length} ${project.entries.length === 1 ? "entry" : "entries"}</span></summary>
      <div class="report-entries">${project.entries.length ? postList(project.entries, (post) => reportUrl(project, post)) : '<p class="muted">No entries yet.</p>'}</div></details></section>`
        : "";
    pages.set(
      "research/" + project.slug + "/index.html",
      page(
        `<div class="breadcrumb"><a href="/research/">← All research</a></div>
      <header class="project-heading"><h1>${e(project.title)}</h1><button class="study-sigil sigil-toggle" type="button" data-sigil-trigger aria-label="Hold the ${e(SIGILS[project.glyph].revealed)} sigil revealed" aria-pressed="false" disabled>${glyph(project.glyph)}</button></header>
      <section class="project-overview" aria-labelledby="question-title"><div class="abstract"><h2 id="question-title">${e(project.question)}</h2><div class="abstract-body">${project.abstract.map(paragraph => `<p>${e(paragraph)}</p>`).join("")}</div>${project.links?.length ? `<div class="project-links">${project.links.map(link => `<a href="${e(link.url)}">${e(link.label)}</a>`).join("")}</div>` : ""}</div></section>
      ${reports}<div class="page-return"><a href="/research/">← All research</a></div>`,
        {
          title: project.title,
          description: project.summary,
          section: "research",
        },
      ),
    );
    for (const post of project.entries)
      pages.set(
        "research/" + project.slug + "/reports/" + post.slug + "/index.html",
        article(post, project),
      );
  }
  pages.set(
    "notes/index.html",
    page(
      `<header class="page-heading"><h1>Notes</h1></header>${posts.length ? postList(posts, post => "/notes/" + post.slug + "/") : emptyNotes}`,
      { title: "Notes", section: "notes" },
    ),
  );
  for (const post of posts)
    pages.set("notes/" + post.slug + "/index.html", article(post));
  function article(post, project) {
    const back = project ? projectUrl(project) : "/notes/";
    const backLabel = project ? project.title : "Notes";
    return page(
      `<div class="reading-toolbar"><a href="${back}">← ${e(backLabel)}</a></div>
      <header class="article-heading"><h1>${e(post.title)}</h1><p class="article-deck">${e(post.summary)}</p><div class="article-byline"><span>${e(fullName)}</span><time datetime="${post.date}">${prettyDate(post.date)}</time></div></header>
      <article class="article-content">${post.html}</article><div class="page-return"><a href="${back}">← ${e(backLabel)}</a></div>`,
      {
        title: post.title,
        description: post.summary,
        section: project ? "research" : "notes",
        reading: true,
      },
    );
  }
  const socialLinks = site.socials ?? [{ label: "GitHub", url: site.github }];
  const background = site.background?.length
    ? `<section class="about-background" aria-labelledby="background-title"><h2 id="background-title">Background</h2><dl>${site.background.map((fact) => `<div><dt>${e(fact.label)}</dt><dd>${e(fact.text)}</dd></div>`).join("")}</dl></section>`
    : "";
  const links =
    socialLinks.length || site.resume
      ? `<section class="about-links" aria-labelledby="links-title"><h2 id="links-title">Links</h2><ul class="social-links">${socialLinks.map((link) => `<li><a href="${e(link.url)}">${e(link.label)} ↗</a></li>`).join("")}${site.resume ? `<li><a class="resume-link" href="${e(site.resume)}">Résumé ↗</a></li>` : ""}</ul></section>`
      : "";
  pages.set(
    "about/index.html",
    page(
      `<header class="page-heading"><h1>A little bit<br>about me.</h1></header><div class="about-layout"><div class="about-prose">${site.bio.map((paragraph) => `<p>${e(paragraph)}</p>`).join("")}</div><aside class="interest-index"><h2>Interests</h2><ul>${site.interests.map((interest) => `<li>${e(interest)}</li>`).join("")}</ul></aside></div><div class="about-details">${background}${links}</div>`,
      { title: "About", section: "about" },
    ),
  );
  pages.set(
    "404.html",
    page(
      '<header class="page-heading"><h1>Page not found.</h1><p><a href="/">Back to home</a></p></header>',
      { title: "Not found" },
    ),
  );
  return pages;
}
