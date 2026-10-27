document.body.classList.remove("no-js");
// A deterministic toy MDP, solved with value iteration. No research results implied.
const width = 5;
const goal = 24;
const walls = new Set([6, 7, 16, 18]);
const discount = 0.95;
const actions = [
  { dx: 1, dy: 0, symbol: "→" },
  { dx: 0, dy: 1, symbol: "↓" },
  { dx: -1, dy: 0, symbol: "←" },
  { dx: 0, dy: -1, symbol: "↑" },
];
const transitions = (state) =>
  actions.flatMap((action) => {
    const x = (state % width) + action.dx;
    const y = Math.floor(state / width) + action.dy;
    const next = y * width + x;
    return x < 0 || x >= width || y < 0 || y >= width || walls.has(next)
      ? []
      : [{ next, symbol: action.symbol }];
  });
const reward = (next) => (next === goal ? 1 : -0.04);
let values = Array(25).fill(0);
for (let iteration = 0; iteration < 300; iteration += 1) {
  const previous = values;
  values = previous.map((value, state) =>
    walls.has(state) || state === goal
      ? 0
      : Math.max(
          ...transitions(state).map(
            ({ next }) => reward(next) + discount * previous[next],
          ),
        ),
  );
  if (
    Math.max(...values.map((value, i) => Math.abs(value - previous[i]))) < 1e-10
  )
    break;
}
const policy = Array.from({ length: 25 }, (_, state) => {
  if (walls.has(state) || state === goal) return null;
  return transitions(state).reduce((best, choice) => {
    const score = (item) => reward(item.next) + discount * values[item.next];
    return score(choice) > score(best) + 1e-10 ? choice : best;
  });
});
let position = 0;
let steps = 0;
let totalReturn = 0;
let view = "policy";
let timer = null;
const grid = document.querySelector("#gridworld");
const stepButton = document.querySelector("#step-button");
const runButton = document.querySelector("#run-button");
const status = document.querySelector("#grid-status");
function renderGrid() {
  const border = "+" + "-----+".repeat(width);
  const rows = [border];
  for (let y = 0; y < width; y += 1) {
    const row = [];
    for (let x = 0; x < width; x += 1) {
      const state = y * width + x;
      if (state === position)
        row.push(
          '<span class="agent">' +
            (state === goal ? " @G  " : "  @  ") +
            "</span>",
        );
      else if (walls.has(state)) row.push('<span class="wall"> ### </span>');
      else if (state === goal) row.push('<span class="goal">  G  </span>');
      else if (view === "value") row.push(values[state].toFixed(2).padStart(5));
      else
        row.push(
          '<span class="policy">  ' + policy[state].symbol + "  </span>",
        );
    }
    rows.push("|" + row.join("|") + "|", border);
  }
  grid.innerHTML = rows.join("\n");
  document.querySelector("#step-count").textContent = String(steps).padStart(
    2,
    "0",
  );
  document.querySelector("#return-count").textContent = totalReturn.toFixed(2);
  stepButton.disabled = position === goal || timer !== null;
  runButton.disabled = position === goal;
  runButton.textContent = timer === null ? "run policy ▷" : "pause ‖";
  grid.setAttribute(
    "aria-label",
    "Gridworld " +
      view +
      " view. Agent at row " +
      (Math.floor(position / width) + 1) +
      ", column " +
      ((position % width) + 1) +
      ". Goal at row 5, column 5. Step " +
      steps +
      ".",
  );
}
function stopRun() {
  clearInterval(timer);
  timer = null;
}
function step() {
  if (position === goal) return;
  position = policy[position].next;
  totalReturn += discount ** steps * reward(position);
  steps += 1;
  if (position === goal) {
    stopRun();
    status.textContent =
      "$ goal reached in " + steps + " steps. reset to explore.";
  } else {
    status.textContent =
      "$ step " +
      steps +
      " → (" +
      (position % width) +
      ", " +
      Math.floor(position / width) +
      "). following π*.";
  }
  renderGrid();
}
stepButton.addEventListener("click", step);
runButton.addEventListener("click", () => {
  if (timer !== null) {
    stopRun();
    status.textContent = "$ paused. the next step is yours.";
  } else {
    timer = setInterval(step, 650);
    status.textContent = "$ following the greedy optimal policy...";
  }
  renderGrid();
});
document.querySelector("#reset-button").addEventListener("click", () => {
  stopRun();
  position = 0;
  steps = 0;
  totalReturn = 0;
  status.textContent = "$ policy ready. take a step.";
  renderGrid();
});
document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    view = button.dataset.view;
    document
      .querySelectorAll("[data-view]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    status.textContent =
      view === "value"
        ? "$ V*(s): discounted return under the optimal policy."
        : "$ π*(s): the best next action in each state.";
    renderGrid();
  });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && timer !== null) {
    stopRun();
    status.textContent = "$ paused while you were away.";
    renderGrid();
  }
});
renderGrid();

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-filter]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    let visible = 0;
    document.querySelectorAll("[data-category]").forEach((project) => {
      project.hidden =
        button.dataset.filter !== "all" &&
        project.dataset.category !== button.dataset.filter;
      if (!project.hidden) visible += 1;
    });
    document.querySelector("#project-count").textContent =
      visible + (visible === 1 ? " project" : " projects");
  });
});

const projectNotes = {
  myelin:
    '<h2 id="dialog-title">3D myelin reconstruction</h2><p>How much three-dimensional myelin structure can be recovered from optical focal stacks?</p><h3>THE PROBLEM</h3><p>Optical measurements mix information across depth. Predicting myelin material is different from filling an axon or assigning a single focus depth. The project explores learned reconstruction while keeping these distinctions explicit.</p><h3>THE APPROACH</h3><p>The work includes self-supervised representation learning, conservative weak labels, and learned focal-to-material reconstruction. Evaluation examines material recovery and the separation of individual fibers.</p><h3>THE OPEN QUESTION</h3><p>Image-supported structure, continuity, and depth remain central challenges. Synthetic evaluation and visual plausibility do not establish validated 3D anatomy on real tissue.</p>',
  aletheia:
    '<h2 id="dialog-title">Aletheia’s Quest</h2><p>Can signals inside a language model help identify deceptive responses?</p><h3>THE PROBLEM</h3><p>A deception detector needs to transfer across models and scenarios. A signal that separates examples in one setting may lose its ranking or calibration in another.</p><h3>THE APPROACH</h3><p>The competition work explores an ensemble of residual-stream probes, with an optional text classifier over the final assistant turn’s reasoning when that field is available. The method uses a shared scoring procedure across model organisms.</p><h3>THE OPEN QUESTION</h3><p>How do we distinguish a transferable behavioral signal from a dataset-specific cue? The work emphasizes calibration, held-out evaluation, and explicit treatment of missing reasoning signals.</p><a class="text-link" href="https://github.com/ndif-team/Aletheias-Quest-Competition">visit the organizer’s competition repository ↗</a>',
};
const dialog = document.querySelector("#project-dialog");
let dialogTrigger;
document.querySelectorAll("[data-project]").forEach((button) => {
  button.addEventListener("click", () => {
    dialogTrigger = button;
    document.querySelector("#dialog-content").innerHTML =
      projectNotes[button.dataset.project];
    dialog.showModal();
  });
});
document
  .querySelector("#close-dialog")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const box = dialog.getBoundingClientRect();
  if (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
    dialog.close();
});
dialog.addEventListener("close", () => dialogTrigger?.focus());
