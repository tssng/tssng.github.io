document.body.classList.remove("no-js");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const animations = [];

function animateSigil(element) {
  const layers = [...element.querySelectorAll("[data-sigil-frame]")];
  const duration = Number(element.dataset.duration);
  const stepped = element.dataset.stepped === "true";
  let progress = 0,
    target = 0,
    frameRequest = null,
    previousTime = null,
    visibleFrame = -1;
  function paint() {
    if (stepped) {
      const frame = Math.min(
        layers.length - 1,
        Math.floor(progress * (layers.length - 1) + 1e-6),
      );
      if (frame !== visibleFrame) {
        layers.forEach((layer, index) => {
          layer.style.opacity = index === frame ? 1 : 0;
        });
        element.dataset.frame = frame;
        visibleFrame = frame;
      }
    } else {
      const position = progress * (layers.length - 1);
      layers.forEach((layer, index) => {
        layer.style.opacity = Math.max(0, 1 - Math.abs(position - index));
      });
      element.dataset.frame = Math.round(position);
    }
    element.dataset.progress = progress.toFixed(3);
  }
  function settle() {
    if (frameRequest !== null) cancelAnimationFrame(frameRequest);
    frameRequest = null;
    previousTime = null;
    progress = target;
    paint();
  }
  function tick(now) {
    const elapsed =
      previousTime === null ? 0 : Math.min(50, now - previousTime);
    previousTime = now;
    const step = elapsed / duration;
    progress =
      target > progress
        ? Math.min(target, progress + step)
        : Math.max(target, progress - step);
    if (Math.abs(progress - target) < 0.005) progress = target;
    paint();
    if (progress !== target) frameRequest = requestAnimationFrame(tick);
    else {
      frameRequest = null;
      previousTime = null;
    }
  }
  const controller = {
    reveal(revealed) {
      target = revealed ? 1 : 0;
      if (motionPreference.matches || document.hidden) settle();
      else if (frameRequest === null && progress !== target)
        frameRequest = requestAnimationFrame(tick);
    },
    settle,
  };
  paint();
  animations.push(controller);
  return controller;
}

const signalLabel = document.querySelector("#signal-label");
document.querySelectorAll("[data-sigil-trigger]").forEach((trigger) => {
  const controllers = [
    ...trigger.querySelectorAll("[data-animated-sigil]"),
  ].map(animateSigil);
  const toggle = trigger.matches("button");
  if (toggle) trigger.disabled = false;
  let hovered = false,
    focused = false,
    pinned = false,
    suppressed = false;
  const update = () => {
    controllers.forEach((controller) =>
      controller.reveal(pinned || (!suppressed && (hovered || focused))),
    );
  };
  trigger.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hovered = true;
    suppressed = false;
    update();
  });
  trigger.addEventListener("pointerleave", () => {
    hovered = false;
    update();
  });
  trigger.addEventListener("focus", () => {
    focused = true;
    suppressed = false;
    update();
  });
  trigger.addEventListener("blur", () => {
    focused = false;
    update();
  });
  if (toggle) {
    trigger.addEventListener("click", () => {
      pinned = !pinned;
      suppressed = !pinned;
      trigger.setAttribute("aria-pressed", String(pinned));
      update();
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      pinned = false;
      suppressed = true;
      trigger.setAttribute("aria-pressed", "false");
      update();
    });
  }
  // The large aperture stays hollow so the heading remains readable.
  // Project interactions update its observation label and the local sigil.
  if (signalLabel) {
    const showObservation = () => {
      const project = trigger.querySelector(".dock-title, h3");
      if (project) signalLabel.textContent = project.textContent;
    };
    const restoreObservation = () => {
      if (!hovered && !focused) signalLabel.textContent = "Learned systems";
    };
    trigger.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") showObservation();
    });
    trigger.addEventListener("focus", showObservation);
    trigger.addEventListener("pointerleave", restoreObservation);
    trigger.addEventListener("blur", restoreObservation);
  }
});
motionPreference.addEventListener("change", () =>
  animations.forEach((animation) => animation.settle()),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) animations.forEach((animation) => animation.settle());
});

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
