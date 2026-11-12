(function () {
  var card = document.getElementById("card");
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var maxTilt = 9;
  var hoverScale = 1.03;
  var ease = 0.1;

  var targetRX = 0;
  var targetRY = 0;
  var targetScale = 1;
  var targetGX = 50;
  var targetGY = 36;
  var targetGlare = 0;

  var rx = 0;
  var ry = 0;
  var scale = 1;
  var gx = 50;
  var gy = 36;
  var glare = 0;

  var running = false;
  var active = false;
  var touchId = null;

  function reduced() {
    return motion.matches;
  }

  function apply() {
    card.style.transform =
      "rotateX(" + rx.toFixed(3) + "deg) rotateY(" + ry.toFixed(3) + "deg) scale(" + scale.toFixed(4) + ")";
    card.style.setProperty("--gx", gx.toFixed(2));
    card.style.setProperty("--gy", gy.toFixed(2));
    card.style.setProperty("--glare", glare.toFixed(3));
  }

  function settled() {
    return (
      Math.abs(targetRX - rx) < 0.04 &&
      Math.abs(targetRY - ry) < 0.04 &&
      Math.abs(targetScale - scale) < 0.001 &&
      Math.abs(targetGX - gx) < 0.15 &&
      Math.abs(targetGY - gy) < 0.15 &&
      Math.abs(targetGlare - glare) < 0.012
    );
  }

  function rest() {
    rx = 0;
    ry = 0;
    scale = 1;
    glare = 0;
    card.style.transform = "";
    card.style.setProperty("--glare", "0");
  }

  function frame() {
    if (reduced()) {
      running = false;
      rest();
      return;
    }

    rx += (targetRX - rx) * ease;
    ry += (targetRY - ry) * ease;
    scale += (targetScale - scale) * ease;
    gx += (targetGX - gx) * ease;
    gy += (targetGY - gy) * ease;
    glare += (targetGlare - glare) * ease;

    if (settled()) {
      rx = targetRX;
      ry = targetRY;
      scale = targetScale;
      gx = targetGX;
      gy = targetGY;
      glare = targetGlare;
      running = false;
      if (!active) {
        rest();
        return;
      }
      apply();
      return;
    }

    apply();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced()) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function aim(clientX, clientY) {
    var rect = card.getBoundingClientRect();
    var px = (clientX - rect.left) / rect.width;
    var py = (clientY - rect.top) / rect.height;
    px = Math.min(1, Math.max(0, px));
    py = Math.min(1, Math.max(0, py));
    var nx = px * 2 - 1;
    var ny = py * 2 - 1;
    targetRX = ny * maxTilt;
    targetRY = -nx * maxTilt;
    targetGX = px * 100;
    targetGY = py * 100;
    targetGlare = 1;
    targetScale = hoverScale;
    start();
  }

  function reset() {
    active = false;
    touchId = null;
    targetRX = 0;
    targetRY = 0;
    targetScale = 1;
    targetGX = 50;
    targetGY = 36;
    targetGlare = 0;
    start();
  }

  card.addEventListener("pointerenter", function (event) {
    if (reduced() || event.pointerType === "touch") return;
    active = true;
    aim(event.clientX, event.clientY);
  });

  card.addEventListener("pointerdown", function (event) {
    if (reduced() || event.pointerType !== "touch") return;
    touchId = event.pointerId;
    active = true;
    card.setPointerCapture(event.pointerId);
    aim(event.clientX, event.clientY);
  });

  card.addEventListener(
    "pointermove",
    function (event) {
      if (reduced()) return;
      if (event.pointerType === "touch") {
        if (touchId !== event.pointerId) return;
      } else if (!active) {
        return;
      }
      aim(event.clientX, event.clientY);
    },
    { passive: true }
  );

  card.addEventListener("pointerup", function (event) {
    if (event.pointerType !== "touch") return;
    if (touchId !== null && event.pointerId !== touchId) return;
    reset();
  });

  card.addEventListener("pointercancel", function (event) {
    if (event.pointerType !== "touch") return;
    reset();
  });

  card.addEventListener("pointerleave", function (event) {
    if (event.pointerType === "touch") return;
    reset();
  });

  function onMotionChange() {
    if (!reduced()) return;
    active = false;
    touchId = null;
    running = false;
    rest();
  }

  if (motion.addEventListener) {
    motion.addEventListener("change", onMotionChange);
  } else if (motion.addListener) {
    motion.addListener(onMotionChange);
  }
})();
