// The approved mockup's shared 31 × 31 matrix, rendered as square SVG cells.
// These are project identities, not experimental figures or model activations.
export const GRID_SIZE = 31;
export const SIGILS = Object.freeze({
  sun: {
    label: "Sun",
    signal: "RL interpretability",
    description:
      "Grid sun: an illuminated circular boundary with eight radial rays.",
  },
  fiber: {
    label: "Fiber",
    signal: "Computational imaging",
    description:
      "Grid fiber: a circular cross-section beside a longitudinal fiber.",
  },
  eye: {
    label: "Eye",
    signal: "Model interpretability",
    description:
      "Grid eye: an almond-shaped outline surrounding an iris and dark pupil.",
  },
});

function toneAt(kind, x, y) {
  const dx = x - 15;
  const dy = y - 15;
  const radius = Math.hypot(dx, dy);
  let tone = "off";
  if (kind === "sun") {
    if (radius >= 6.4 && radius <= 8.2) tone = dx + dy < 5 ? "active" : "soft";
    const angle = Math.atan2(dy, dx);
    // JS remainder is signed; normalize it to match the mockup's angle modulus.
    const period = Math.PI / 4;
    const delta = Math.abs(
      ((((angle + Math.PI / 8) % period) + period) % period) - Math.PI / 8,
    );
    if (radius >= 10.7 && radius <= 14.1 && delta < 0.052) tone = "active";
    if (x === 20 && y === 9) tone = "selected";
  } else if (kind === "fiber") {
    const sectionRadius = Math.hypot(x - 7, y - 15);
    if (sectionRadius >= 4.7 && sectionRadius <= 6.1) tone = "active";
    if (sectionRadius >= 2.7 && sectionRadius <= 3.5) tone = "soft";
    if (y >= 3 && y <= 27) {
      const center = 23 + Math.round(Math.sin(((y - 3) / 24) * Math.PI * 2));
      if (Math.abs(Math.abs(x - center) - 3) <= 0.5)
        tone = x < center ? "active" : "soft";
    }
    if (x === 3 && y === 11) tone = "selected";
  } else if (kind === "eye") {
    if (Math.abs(dx) <= 13) {
      const edge = 6.5 * (1 - (dx / 13) ** 2);
      if (Math.abs(Math.abs(dy) - edge) < 0.65)
        tone = dy < 0 ? "active" : "soft";
    }
    if (radius >= 4.2 && radius <= 5.7) tone = "active";
    if (x === 17 && y === 12) tone = "selected";
  }
  return tone;
}

export function glyph(kind) {
  if (!Object.hasOwn(SIGILS, kind))
    throw new Error("Unknown grid sigil: " + kind);
  const paths = { off: "", soft: "", active: "", selected: "" };
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      // Draw the unlit matrix once, with the selected cells layered over it.
      const square = "M" + x * 11 + " " + y * 11 + "h9v9h-9z";
      paths.off += square;
      const tone = toneAt(kind, x, y);
      if (tone !== "off") paths[tone] += square;
    }
  }
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" class="grid-sigil" data-sigil="' +
    kind +
    '" data-grid-size="' +
    GRID_SIZE +
    '" viewBox="0 0 339 339" aria-hidden="true" focusable="false">' +
    Object.entries(paths)
      .map(([tone, d]) => '<path class="cell-' + tone + '" d="' + d + '"/>')
      .join("") +
    "</svg>"
  );
}
