import patterns from "./sigil-patterns.json" with { type: "json" };

// Approved cell maps shared by the homepage, project previews, and summaries.
// A dot is transparent; the remaining characters indicate illuminated tones.
export const GRID_SIZE = 31;
export const SIGILS = Object.freeze({
  sun: {
    label: "Sun",
    signal: "RL interpretability",
    description: "Crescent moon to waxing gibbous to a filled sun with rays.",
    revealed: "filled sun",
    duration: 620,
    stepped: true,
  },
  fiber: {
    label: "Fiber",
    signal: "Computational imaging",
    description:
      "A circular cross-section and longitudinal fiber become an oblique hollow tube.",
    revealed: "oblique tube",
    duration: 380,
    stepped: false,
  },
  eye: {
    label: "Eye",
    signal: "Model interpretability",
    description: "A closed eye opens to reveal its iris.",
    revealed: "open eye",
    duration: 380,
    stepped: false,
  },
});
const tones = { s: "slate", d: "muted", w: "soft", a: "active", b: "selected" };

function paths(rows, size) {
  if (
    rows.length !== size ||
    rows.some((row) => row.length !== size || /[^.sdwab]/.test(row))
  ) {
    throw new Error("Invalid " + size + " × " + size + " sigil pattern.");
  }
  const groups = Object.fromEntries(
    Object.values(tones).map((tone) => [tone, ""]),
  );
  rows.forEach((row, y) =>
    [...row].forEach((cell, x) => {
      if (cell !== ".")
        groups[tones[cell]] += "M" + x * 10 + " " + y * 10 + "h7.7v7.7h-7.7z";
    }),
  );
  return Object.entries(groups)
    .filter(([, d]) => d)
    .map(([tone, d]) => '<path class="cell-' + tone + '" d="' + d + '"/>')
    .join("");
}
export function sigilFrames(kind) {
  if (!Object.hasOwn(SIGILS, kind))
    throw new Error("Unknown grid sigil: " + kind);
  return patterns.patterns[kind];
}
export function glyph(kind) {
  const frames = sigilFrames(kind);
  const sigil = SIGILS[kind];
  return (
    '<span class="sigil-motion" data-animated-sigil="' +
    kind +
    '" data-duration="' +
    sigil.duration +
    '" data-stepped="' +
    sigil.stepped +
    '" data-frame="0" data-progress="0" aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" class="grid-sigil" data-sigil="' +
    kind +
    '" data-grid-size="31" viewBox="0 0 307.7 307.7" aria-hidden="true" focusable="false">' +
    frames
      .map(
        (rows, index) =>
          '<g data-sigil-frame="' +
          index +
          '">' +
          paths(rows, GRID_SIZE) +
          "</g>",
      )
      .join("") +
    "</svg></span>"
  );
}
export function apertureGlyph() {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" class="aperture-grid" viewBox="0 0 907.7 907.7" aria-hidden="true" focusable="false">' +
    paths(patterns.aperture, 91) +
    "</svg>"
  );
}
