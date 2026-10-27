// Deterministic studies in one shared ASCII vocabulary. No simulated results.
const escape = (char) =>
  char === "<" ? "&lt;" : char === "&" ? "&amp;" : char;
export function glyph(kind = "totality", compact = false, signature = "") {
  const hash = [...signature].reduce(
    (sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );
  const phase = signature ? ((hash % 24) * Math.PI) / 12 : 0;
  const cols = compact ? 39 : 87;
  const rows = compact ? 17 : 35;
  const scale = compact ? 0.47 : 1;
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ char: " ", tone: "" })),
  );
  const put = (x, y, char, tone = "inactive") => {
    if (cells[y]?.[x]) cells[y][x] = { char, tone };
  };
  const point = (x, y) => [
    Math.round(cols / 2 + (x * scale) / 0.51),
    Math.round(rows / 2 + y * scale),
  ];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx = ((x - cols / 2) * 0.51) / scale;
      const dy = (y - rows / 2) / scale;
      const radius = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const edge = 10.2 + 0.24 * Math.sin(angle * 7 + phase);
      if (Math.abs(radius - edge) < 0.52) {
        const active = kind === "totality" && angle > -1.6 && angle < 0.4;
        put(x, y, active ? ":" : ".", active ? "active" : "inactive");
      }
      const tick = Math.abs(Math.sin((angle + phase) * 12));
      if (radius > 12 && radius < 13.6 && tick < 0.11)
        put(x, y, Math.abs(dy) > Math.abs(dx) ? "|" : "-", "inactive");
      if (
        kind === "totality" &&
        radius > 11.4 &&
        radius < 16 &&
        Math.abs(Math.sin((angle + phase) * 3.5)) < 0.065
      ) {
        put(
          x,
          y,
          Math.abs(dy) > Math.abs(dx) ? "|" : "-",
          radius < 13 ? "active" : "inactive",
        );
      }
    }
  }
  function line(a, b, tone) {
    const [x0, y0] = point(...a),
      [x1, y1] = point(...b);
    const length = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const char =
      y0 === y1
        ? "-"
        : x0 === x1
          ? "|"
          : (x1 - x0) * (y1 - y0) > 0
            ? "\\"
            : "/";
    for (let i = 1; i < length; i += 1)
      put(
        Math.round(x0 + ((x1 - x0) * i) / length),
        Math.round(y0 + ((y1 - y0) * i) / length),
        char,
        tone,
      );
  }
  if (kind === "policy") {
    const nodes = [
      [-7, 6],
      [-3, 2],
      [2, -2],
      [7, -6],
      [5, 5],
      [-4, -5],
    ];
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [2, 5],
    ].forEach(([a, b], i) =>
      line(nodes[a], nodes[b], i < 3 ? "active" : "inactive"),
    );
    nodes.forEach((p, i) =>
      put(...point(...p), i === 3 ? "*" : "o", i < 4 ? "active" : "inactive"),
    );
  }
  if (kind === "circuit") {
    const nodes = [
      [-8, -5],
      [-8, 1],
      [-8, 6],
      [0, -5],
      [0, 2],
      [8, -2],
      [8, 5],
    ];
    [
      [0, 3],
      [1, 4],
      [2, 4],
      [3, 5],
      [4, 5],
      [4, 6],
    ].forEach(([a, b], i) =>
      line(nodes[a], nodes[b], [1, 4].includes(i) ? "active" : "inactive"),
    );
    nodes.forEach((p, i) =>
      put(
        ...point(...p),
        i === 5 ? "*" : "o",
        [1, 4, 5].includes(i) ? "active" : "inactive",
      ),
    );
  }
  return cells
    .map((row) =>
      row
        .map((cell) =>
          cell.char === " "
            ? " "
            : '<span class="glyph-' +
              cell.tone +
              '">' +
              escape(cell.char) +
              "</span>",
        )
        .join(""),
    )
    .join("\n");
}
