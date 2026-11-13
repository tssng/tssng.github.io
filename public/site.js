document.body.classList.remove("no-js");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const animations = [];

function animateSigil(element) {
  const layers = [...element.querySelectorAll("[data-sigil-frame]")];
  const delay = Number(element.dataset.frameDelay);
  let index = 0, target = 0, timer = null;
  function paint() {
    layers.forEach((layer, frame) => { layer.hidden = frame !== index; });
    element.dataset.frame = index;
  }
  function stop() {
    clearTimeout(timer);
    timer = null;
  }
  function settle() {
    stop();
    index = target;
    paint();
  }
  function step() {
    timer = null;
    if (index === target) return;
    index += Math.sign(target - index);
    paint();
    if (index !== target) timer = setTimeout(step, delay);
  }
  const controller = {
    reveal(revealed) {
      target = revealed ? layers.length - 1 : 0;
      stop();
      if (motionPreference.matches || document.hidden) settle();
      else if (index !== target) timer = setTimeout(step, delay);
    },
    settle,
  };
  paint();
  animations.push(controller);
  return controller;
}

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
});
motionPreference.addEventListener("change", () =>
  animations.forEach((animation) => animation.settle()),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) animations.forEach((animation) => animation.settle());
});
