document.body.classList.remove("no-js");
const instrument = document.querySelector(".instrument");
if (instrument) {
  let selected = "totality";
  const descriptions = {
    totality: [
      "dormant",
      "ASCII eclipse: an opaque center surrounded by a thin corona",
    ],
    policy: [
      "exploring",
      "ASCII trajectories: branching paths through an environment",
    ],
    circuit: [
      "tracing",
      "ASCII circuit: a selected path through a sparse network",
    ],
  };
  const show = (state) => {
    instrument.dataset.state = state;
    instrument
      .querySelectorAll("[data-glyph]")
      .forEach((panel) =>
        panel.classList.toggle("is-active", panel.dataset.glyph === state),
      );
    instrument
      .querySelectorAll("[data-state-button]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.stateButton === state),
        ),
      );
    document.querySelector("#signal-label").textContent =
      descriptions[state][0];
    document
      .querySelector("#instrument-diagram")
      .setAttribute("aria-label", descriptions[state][1]);
  };
  instrument.querySelectorAll("[data-state-button]").forEach((button) =>
    button.addEventListener("click", () => {
      selected = button.dataset.stateButton;
      show(selected);
    }),
  );
  document.querySelectorAll("[data-observe]").forEach((link) => {
    link.addEventListener("pointerenter", () => show(link.dataset.observe));
    link.addEventListener("pointerleave", () => show(selected));
    link.addEventListener("focus", () => show(link.dataset.observe));
    link.addEventListener("blur", () => show(selected));
  });
}
document.querySelectorAll("[data-filter]").forEach((button) =>
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
  }),
);
