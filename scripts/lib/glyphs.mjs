import patterns from "./ascii-sigil-frames.json" with { type: "json" };

// Character-for-character copies of the approved ASCII mockups.
// Small drawings are composed separately so thumbnails remain legible.
export const SIGILS = Object.freeze({
  sun: { revealed: "filled sun", frameDelay: 155 },
  fiber: { revealed: "oblique tube", frameDelay: 180 },
  eye: { revealed: "open eye", frameDelay: 180 },
});
const dimensions = { large: [49, 25], small: [25, 13] };
const escape = (value) => value.replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);

export function sigilFrames(kind, size = "large") {
  if (!Object.hasOwn(SIGILS, kind) || !Object.hasOwn(dimensions, size))
    throw new Error("Unknown ASCII sigil or size: " + kind + " / " + size);
  const [columns, rows] = dimensions[size];
  return patterns[size][kind].map((frame) => {
    const lines = frame.split("\n");
    if (lines.length !== rows || lines.some(line => line.length !== columns || /[^\x20-\x7e]/.test(line)))
      throw new Error("Invalid ASCII frame: " + kind + " / " + size);
    return lines;
  });
}

export function glyph(kind, size = "large") {
  const frames = sigilFrames(kind, size);
  return `<span class="sigil-motion" data-animated-sigil="${kind}" data-sigil="${kind}" data-sigil-size="${size}" data-frame-delay="${SIGILS[kind].frameDelay}" data-frame="0" aria-hidden="true">${frames.map((rows, index) => `<pre class="ascii-sigil" data-sigil-frame="${index}"${index ? " hidden" : ""}>${escape(rows.join("\n"))}</pre>`).join("")}</span>`;
}
