import { escape as e, prettyDate } from "./content.mjs";
import { glyph, apertureGlyph, SIGILS } from "./glyphs.mjs";

const aperture =
  '<svg class="aperture" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width=".8"/><path d="M20 2v4m18 14h-4M20 38v-4M2 20h4" stroke="currentColor" stroke-width=".7"/><circle cx="17" cy="18" r="13" fill="var(--bg)"/></svg>';
const pad = (number) => String(number).padStart(3, "0");
const projectUrl = (project) => "/research/" + project.slug + "/";
const reportUrl = (project, post) =>
  projectUrl(project) + "reports/" + post.slug + "/";

export function renderSite({ site, projects, posts }) {
  function header(section) {
    return `<header class="site-header"><a class="identity" href="/" aria-label="${e(site.name)}, home">${aperture}<span>${e(site.name)}<span class="identity-sub"> / ${e(site.identity)}</span></span></a>
      <nav aria-label="Main navigation">${[
        ["research", "Research"],
        ["notes", "Notes"],
        ["about", "About"],
      ]
        .map(
          ([key, label]) =>
            `<a href="/${key}/"${section === key ? ' aria-current="page"' : ""}>${label}</a>`,
        )
        .join("")}</nav></header>`;
  }
  function footer() {
    return `<footer class="site-footer"><a class="footer-identity" href="/">${e(site.name)} / ${e(site.identity)}</a><p>${e(site.tagline)}</p><a href="${e(site.github)}">GitHub ↗</a></footer>`;
  }
  function page(
    body,
    {
      title,
      description = site.description,
      section = "",
      reading = false,
    } = {},
  ) {
    return `<!doctype html><html lang="en" data-theme="dark"${reading ? ' data-reading="true"' : ""}><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${e(title ? title + " / " + site.name : site.name + " / " + site.identity)}</title>
      <meta name="description" content="${e(description)}"><meta name="theme-color" content="#0a0f0d">
      <meta property="og:title" content="${e(title || site.name + " / " + site.identity)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="${reading ? "article" : "website"}">
      <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><script src="/site.js" defer></script>
      </head><body class="no-js"><a class="skip-link" href="#main">Skip to content</a><div class="site-shell">${header(section)}<main id="main">${body}</main>${footer()}</div></body></html>`;
  }
  function row(project, detailed = false) {
    return `<article class="research-item" data-category="${e(project.category)}"><a class="research-row${detailed ? " research-row-detailed" : ""}" href="${projectUrl(project)}" data-observe="${project.glyph}" data-sigil-trigger>
      <span class="row-number">${pad(project.order)}</span><div class="row-glyph" aria-hidden="true">${glyph(project.glyph)}</div>
      <div class="row-copy"><p class="metadata">${e(project.area)}${project.reports ? ' <span class="entry-mark">/ notebook</span>' : ""}</p><h3>${e(project.title)}</h3><p class="row-summary">${e(project.summary)}</p>${detailed ? `<p class="index-question">${e(project.question)}</p><ul class="tags">${project.tags.map((tag) => `<li>${e(tag)}</li>`).join("")}</ul>` : ""}</div>
      <span class="row-arrow" aria-hidden="true">↗</span></a></article>`;
  }
  function postList(entries, href) {
    return `<ol class="post-list">${entries.map((post, i) => `<li><a class="post-row" href="${href(post)}"><span class="post-number">N/${pad(i + 1)}</span><div><h3>${e(post.title)}</h3><p>${e(post.summary)}</p>${post.kind === "placeholder" ? '<span class="placeholder-label">Placeholder / no results reported</span>' : ""}</div><time datetime="${post.date}">${prettyDate(post.date)}</time><span aria-hidden="true">↗</span></a></li>`).join("")}</ol>`;
  }
  const emptyNotes =
    '<div class="empty-notes"><span aria-hidden="true">[ : ]</span><p>No observations published yet.<br><span class="muted">The notebook is open.</span></p></div>';
  function instrument() {
    return `<section class="observatory" data-banner="centered" aria-labelledby="hero-title"><div class="banner-field">
      <div class="banner-meta"><span>Observatory / 001</span><span>Active signal / <b id="signal-label" aria-live="polite">Learned systems</b></span></div>
      <div class="banner-aperture" aria-hidden="true">${apertureGlyph()}</div>
      <div class="hero-copy"><p class="eyebrow">Exploring intelligence from within</p><h1 id="hero-title">The structure of<br>learned behavior.</h1><p class="hero-subtitle">Reinforcement learning <span>/</span> Mechanistic interpretability</p></div>
      <div class="banner-calibration left" aria-hidden="true">Field / 001<br><b>Observe</b></div><div class="banner-calibration right" aria-hidden="true">Signal / latent<br><b>Reveal</b></div>
      <div class="banner-axis left" aria-hidden="true"></div><div class="banner-axis right" aria-hidden="true"></div>
      <span class="banner-cross left" aria-hidden="true">+</span><span class="banner-cross right" aria-hidden="true">+</span>
      <p class="banner-caption">${e(site.tagline)}</p></div>
      <nav class="banner-dock" aria-label="Research project shortcuts">${projects.map((project) => `<a class="banner-project" href="${projectUrl(project)}" data-observe="${project.glyph}" data-sigil-trigger><span class="dock-glyph" aria-hidden="true">${glyph(project.glyph)}</span><span class="dock-copy"><span class="metadata">${pad(project.order)} / ${e(project.area)}</span><span class="dock-title">${e(project.title)}</span></span></a>`).join("")}</nav></section>`;
  }
  const pages = new Map();
  pages.set(
    "index.html",
    page(`${instrument()}
    <section class="home-section" aria-labelledby="research-title"><div class="section-heading"><h2 id="research-title"><span>01 /</span> Research</h2><a href="/research/">Index [${String(projects.length).padStart(2, "0")}] ↗</a></div><div class="research-list">${projects.map((project) => row(project)).join("")}</div></section>
    <section class="home-section notes-preview" aria-labelledby="notes-title"><div class="section-heading"><h2 id="notes-title"><span>02 /</span> Field notes</h2><a href="/notes/">All entries +</a></div>${posts.length ? postList(posts.slice(0, 3), (post) => "/notes/" + post.slug + "/") : emptyNotes}</section>`),
  );
  const categories = [...new Set(projects.map((project) => project.category))];
  pages.set(
    "research/index.html",
    page(
      `<header class="page-heading"><p class="eyebrow">01 / research index</p><h1>Questions in focus.</h1><p class="page-lead">Research at the boundary between what a system does<br class="desktop-break"> and what we can understand about it.</p></header>
    <div class="research-filter" role="group" aria-label="Filter research"><button type="button" data-filter="all" aria-pressed="true">[ All ]</button>${categories.map((category) => `<button type="button" data-filter="${e(category)}" aria-pressed="false">${e({ rl: "RL × interpretability", imaging: "Imaging", interpretability: "Model behavior" }[category] || category)}</button>`).join("")}<span id="project-count" role="status" aria-live="polite">${projects.length} projects</span></div>
    <div class="research-list research-index">${projects.map((project) => row(project, true)).join("")}</div>`,
      { title: "Research", section: "research" },
    ),
  );
  for (const project of projects) {
    const reports =
      project.reports === true
        ? `<section class="reports-section" aria-labelledby="reports-title"><div class="section-heading"><h2 id="reports-title"><span>02 /</span> Research notebook</h2><span class="metadata">Reports & progress checks</span></div>
      <details class="report-disclosure"><summary><span><span class="disclosure-indicator" aria-hidden="true">+</span> Research reports & progress</span><span class="report-count">${project.entries.length} ${project.entries.length === 1 ? "entry" : "entries"}</span></summary>
      <div class="report-entries">${project.entries.length ? postList(project.entries, (post) => reportUrl(project, post)) : '<p class="muted">No notebook entries published yet.</p>'}</div></details></section>`
        : "";
    pages.set(
      "research/" + project.slug + "/index.html",
      page(
        `<div class="breadcrumb"><a href="/research/">Research</a><span>/</span><span>${pad(project.order)}</span></div><header class="project-heading"><p class="eyebrow">${e(project.area)} / project ${pad(project.order)}</p><h1>${e(project.title)}</h1><p class="project-deck">${e(project.summary)}</p></header>
      <section class="project-overview" aria-labelledby="question-title"><div class="abstract"><p class="eyebrow">01 / the question</p><h2 id="question-title">${e(project.question)}</h2><div class="abstract-body">${project.abstract.map((paragraph) => `<p>${e(paragraph)}</p>`).join("")}</div><ul class="tags">${project.tags.map((tag) => `<li>${e(tag)}</li>`).join("")}</ul>${project.links?.length ? `<div class="project-links">${project.links.map((link) => `<a href="${e(link.url)}">${e(link.label)} ↗</a>`).join("")}</div>` : ""}</div>
      <figure class="project-study"><div class="study-label"><span>Study / ${pad(project.order)}</span><span>${e(SIGILS[project.glyph].label)}</span></div><button class="study-sigil sigil-toggle" type="button" data-sigil-trigger data-observe="${project.glyph}" aria-label="Hold the ${e(SIGILS[project.glyph].revealed)} sigil revealed" aria-pressed="false" disabled>${glyph(project.glyph)}</button><figcaption>Project sigil / abstract symbol<span class="sigil-hint">Hover, focus, or tap to reveal</span></figcaption></figure></section>
      ${reports}<div class="page-return"><a href="/research/">← Return to the research index</a></div>`,
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
      `<header class="page-heading"><p class="eyebrow">02 / field notes</p><h1>Observations, in writing.</h1><p class="page-lead">Research notes, open questions, and things still taking shape.</p></header>${posts.length ? postList(posts, (post) => "/notes/" + post.slug + "/") : emptyNotes}`,
      { title: "Field notes", section: "notes" },
    ),
  );
  for (const post of posts)
    pages.set("notes/" + post.slug + "/index.html", article(post));
  function article(post, project) {
    const back = project ? projectUrl(project) : "/notes/";
    const backLabel = project ? project.title : "Field notes";
    return page(
      `<div class="reading-toolbar"><a href="${back}">← ${e(backLabel)}</a></div>
      <header class="article-heading"><p class="eyebrow">${project ? "Research notebook / " + e(project.area) : "Field notes"}${post.kind === "placeholder" ? " / placeholder" : ""}</p><h1>${e(post.title)}</h1><p class="article-deck">${e(post.summary)}</p><div class="article-byline"><span>${e(site.name)}</span><time datetime="${post.date}">${prettyDate(post.date)}</time><span>${e(post.kind)}</span></div></header>
      <div class="article-layout"><aside class="article-margin"><span class="eyebrow">Observation</span><p>${project ? e(project.title) : "Field notes"}</p>${post.kind === "placeholder" ? '<p class="placeholder-label">Placeholder entry.<br>No results reported.</p>' : ""}<a href="${back}">Back to ${project ? "project" : "all notes"} ↗</a></aside><article class="article-content">${post.html}</article></div><div class="page-return"><a href="${back}">← ${e(backLabel)}</a></div>`,
      {
        title: post.title,
        description: post.summary,
        section: project ? "research" : "notes",
        reading: true,
      },
    );
  }
  pages.set(
    "about/index.html",
    page(
      `<header class="page-heading"><p class="eyebrow">03 / the observer</p><h1>Making hidden<br>structure visible.</h1></header><div class="about-layout"><div class="about-prose"><h2>I’m ${e(site.name)}.</h2>${site.bio.map((paragraph) => `<p>${e(paragraph)}</p>`).join("")}<a class="inline-link" href="${e(site.github)}">Find me on GitHub ↗</a></div><aside class="interest-index"><p class="eyebrow">Current interests</p><ol>${site.interests.map((interest) => `<li>${e(interest)}</li>`).join("")}</ol><p class="observer-note">A question is a place to begin.</p></aside></div>`,
      { title: "About", section: "about" },
    ),
  );
  pages.set(
    "404.html",
    page(
      '<header class="page-heading"><p class="eyebrow">404 / outside the field of view</p><h1>No signal here.</h1><p class="page-lead">This observation could not be found.</p><a class="inline-link" href="/">Return to the observatory →</a></header>',
      { title: "Not found" },
    ),
  );
  return pages;
}
