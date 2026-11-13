// A deterministic shortest-path sketch, shared by the static build and browser.
// Adapted from the supplied HTML reference; this does not simulate model training.
export const COLS = 72, ROWS = 24;
const SIZE = COLS * ROWS, GX = 54, GY = 12;
const DIRECTIONS = [[1, 0, '›'], [0, 1, 'v'], [0, -1, '^'], [-1, 0, '‹']];
const LAYOUTS = [
  [[12, 0, 13, 13], [12, 18, 13, 23], [24, 6, 25, 23], [36, 0, 37, 8], [36, 16, 37, 23], [17, 9, 20, 9], [29, 14, 32, 14]],
  [[12, 5, 13, 23], [24, 0, 25, 16], [36, 0, 37, 3], [36, 9, 37, 23], [17, 9, 20, 9], [29, 14, 32, 14]],
];
const blank = () => Array(SIZE).fill(' ');
const lines = cells => Array.from({length: ROWS}, (_, y) => cells.slice(y * COLS, (y + 1) * COLS).join('')).join('\n');

export function createWorld(layout) {
  const walls = new Uint8Array(SIZE), wallChars = blank(), sun = blank();
  for (const [x0, y0, x1, y1] of LAYOUTS[layout])
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      walls[y * COLS + x] = 1;
      wallChars[y * COLS + x] = '#';
    }
  const put = (x, y, ch) => { if (x >= 0 && x < COLS && y >= 0 && y < ROWS) sun[y * COLS + x] = ch; };
  for (let n = 6; n <= 8; n++) { put(GX, GY - n, '|'); put(GX, GY + n, '|'); }
  for (let n = 11; n <= 14; n++) { put(GX - n, GY, '—'); put(GX + n, GY, '—'); }
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (const n of [4, 5])
    put(GX + dx * n * 2, GY + dy * n, dx === dy ? '\\' : '/');
  const distance = new Int16Array(SIZE).fill(-1), queue = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const dx = (x - GX) * .5, dy = y - GY;
    if (dx * dx + dy * dy <= 18.5) {
      const k = y * COLS + x;
      distance[k] = 0; queue.push(k); sun[k] = dx + dy > 2.2 ? '+' : '%';
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const k = queue[head], x = k % COLS, y = Math.floor(k / COLS);
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx, ny = y + dy, nk = ny * COLS + nx;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || walls[nk] || distance[nk] >= 0) continue;
      distance[nk] = distance[k] + 1; queue.push(nk);
    }
  }
  const policy = new Int8Array(SIZE).fill(-1), field = blank(), arrows = blank();
  for (let k = 0; k < SIZE; k++) {
    if (walls[k] || distance[k] <= 0) continue;
    const x = k % COLS, y = Math.floor(k / COLS);
    let bestScore = -Infinity;
    DIRECTIONS.forEach(([dx, dy, ch], i) => {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || distance[ny * COLS + nx] !== distance[k] - 1) return;
      const score = dx * (GX - x) * .5 + dy * (GY - y);
      if (score > bestScore) { bestScore = score; policy[k] = i; if (sun[k] === ' ') arrows[k] = ch; }
    });
    if (sun[k] !== ' ') continue;
    const d = distance[k];
    field[k] = d <= 2 ? ' ' : d <= 6 ? '+' : d <= 13 ? '=' : d <= 24 ? '-' : d <= 40 ? ':' : '.';
  }
  return {layout, walls, distance, policy, field, arrows, wallChars: lines(wallChars), sun: lines(sun)};
}
export function initialState(world, seed = 0) {
  const state = {x: 4, y: [11, 3, 20, 7][seed % 4], trail: [], arrived: false};
  // The static page shows a short existing trail, including without JavaScript.
  for (let i = 0; i < 7; i++) advance(world, state);
  return state;
}
export function advance(world, state) {
  const k = state.y * COLS + state.x;
  if (world.distance[k] <= 1) { state.arrived = true; return; }
  const direction = DIRECTIONS[world.policy[k]];
  if (!direction) return;
  state.trail.unshift(k); state.trail.length = Math.min(12, state.trail.length);
  state.x += direction[0]; state.y += direction[1];
}
export function relocate(world, state) {
  const k = state.y * COLS + state.x;
  if (world.distance[k] > 1) { state.trail = []; state.arrived = false; return; }
  // A moved wall may cover the agent. Choose the nearest reachable cell.
  let nearest = -1, best = Infinity;
  for (let i = 0; i < SIZE; i++) if (world.distance[i] > 1) {
    const distance = Math.abs(i % COLS - state.x) + Math.abs(Math.floor(i / COLS) - state.y);
    if (distance < best) { best = distance; nearest = i; }
  }
  state.x = nearest % COLS; state.y = Math.floor(nearest / COLS);
  state.trail = []; state.arrived = false;
}
export function drawWorld(world, state, showPolicy = false) {
  const field = (showPolicy ? world.arrows : world.field).slice(), trail = blank();
  state.trail.forEach((k, i) => { trail[k] = i < 4 ? '·' : '.'; field[k] = ' '; });
  const k = state.y * COLS + state.x;
  field[k] = ' '; trail[k] = ' ';
  return {field: lines(field), walls: world.wallChars, sun: world.sun, trail: lines(trail)};
}
