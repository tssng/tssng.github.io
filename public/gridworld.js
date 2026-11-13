import { COLS, ROWS, createWorld, initialState, advance, relocate, drawWorld } from './world-model.js';
const root = document.querySelector('[data-world]');
if (root) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const layers = Object.fromEntries([...root.querySelectorAll('[data-world-layer]')].map(el => [el.dataset.worldLayer, el]));
  const agent = root.querySelector('.world-agent');
  const controls = document.querySelector('.world-controls');
  const pauseButton = controls.querySelector('[data-world-action="pause"]');
  const policyButton = controls.querySelector('[data-world-action="policy"]');
  const status = document.querySelector('[data-world-status]');
  const worlds = [createWorld(0), createWorld(1)];
  let world = worlds[0], state = initialState(world), showPolicy = false;
  let paused = motion.matches, visible = false, timer = null, arrivals = 0, hold = 0;
  function paint(snap = false) {
    const art = drawWorld(world, state, showPolicy);
    for (const [name, el] of Object.entries(layers)) if (el.textContent !== art[name]) el.textContent = art[name];
    if (snap) agent.classList.add('snap');
    agent.style.left = `${state.x / COLS * 100}%`;
    agent.style.top = `${state.y / ROWS * 100}%`;
    if (snap) { agent.getBoundingClientRect(); agent.classList.remove('snap'); }
    root.classList.toggle('has-arrived', state.arrived);
  }
  function moveWalls() {
    world = worlds[1 - world.layout]; relocate(world, state); hold = 0;
    paint(true);
    status.textContent = 'Walls moved. The route has been recalculated.';
  }
  function tick() {
    if (state.arrived) {
      if (++hold < 7) return;
      arrivals++;
      if (arrivals % 2 === 0) world = worlds[1 - world.layout];
      state = initialState(world, arrivals); hold = 0; paint(true);
    } else { advance(world, state); paint(); }
  }
  function sync() {
    clearInterval(timer); timer = null;
    pauseButton.textContent = paused ? 'Play' : 'Pause';
    pauseButton.setAttribute('aria-pressed', String(paused));
    if (!paused && visible && !document.hidden) timer = setInterval(tick, 180);
  }
  controls.hidden = false;
  controls.querySelector('[data-world-action="walls"]').addEventListener('click', moveWalls);
  policyButton.addEventListener('click', () => {
    showPolicy = !showPolicy;
    policyButton.setAttribute('aria-pressed', String(showPolicy));
    policyButton.textContent = showPolicy ? 'Hide policy' : 'Show policy';
    paint();
  });
  pauseButton.addEventListener('click', () => { paused = !paused; sync(); });
  motion.addEventListener('change', () => { paused = motion.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold: .1}).observe(root);
  paint(true); sync();
}
