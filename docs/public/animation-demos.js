import { animate } from "https://cdn.jsdelivr.net/npm/motion@12.23.12/+esm";
import autoAnimate from "https://cdn.jsdelivr.net/npm/@formkit/auto-animate@0.8.2/+esm";
import React, { useState, useEffect } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import {
  useSpring,
  animated,
} from "https://esm.sh/@react-spring/web@9.7.5?deps=react@18.3.1,react-dom@18.3.1";

function showErr(where, err) {
  console.error(`[demo:${where}]`, err);
}

// ——— Motion ———
try {
  const motionBox = document.getElementById("motion-box");
  let motionRight = false;
  const runMotion = () => {
    animate(
      motionBox,
      {
        x: motionRight ? 120 : -120,
        rotate: motionRight ? 180 : 0,
        borderRadius: motionRight ? "50%" : "16px",
      },
      { type: "spring", stiffness: 220, damping: 16 },
    );
    motionRight = !motionRight;
  };
  runMotion();
  document.getElementById("motion-toggle").onclick = runMotion;
} catch (e) {
  showErr("motion", e);
}

// ——— React Spring ———
try {
  let springJump = () => {};

  function SpringDemo() {
    const [flipped, setFlipped] = useState(false);
    const styles = useSpring({
      transform: flipped
        ? "translateY(-36px) scale(1.15)"
        : "translateY(0px) scale(1)",
      config: { tension: 280, friction: 12 },
    });

    useEffect(() => {
      springJump = () => setFlipped((v) => !v);
    }, []);

    return React.createElement(animated.div, {
      className: "spring-ball",
      style: styles,
      onClick: () => setFlipped((v) => !v),
      title: "点击也能弹",
    });
  }

  createRoot(document.getElementById("spring-root")).render(
    React.createElement(SpringDemo),
  );
  document.getElementById("spring-jump").onclick = () => springJump();
} catch (e) {
  showErr("react-spring", e);
}

// ——— AutoAnimate ———
try {
  const list = document.getElementById("auto-list");
  autoAnimate(list);
  let n = 0;
  const addItem = (label) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = label;
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "删";
    del.onclick = () => li.remove();
    li.append(span, del);
    list.appendChild(li);
  };
  ["首页", "详情", "设置"].forEach(addItem);
  document.getElementById("auto-add").onclick = () => {
    n += 1;
    addItem("新项目 " + n);
  };
} catch (e) {
  showErr("auto-animate", e);
}

// ——— Theatre.js 时间轴心智模型 ———
try {
  const theatreEl = document.getElementById("theatre-box");
  const keyframes = [
    { t: 0, x: -100, y: 0, rotate: 0, opacity: 1, scale: 1 },
    { t: 0.35, x: 20, y: -28, rotate: 90, opacity: 1, scale: 1.25 },
    { t: 0.65, x: 110, y: 10, rotate: 200, opacity: 0.85, scale: 0.9 },
    { t: 1, x: -100, y: 0, rotate: 360, opacity: 1, scale: 1 },
  ];

  const lerp = (a, b, t) => a + (b - a) * t;
  const sample = (t) => {
    let i = 0;
    while (i < keyframes.length - 1 && keyframes[i + 1].t < t) i += 1;
    const a = keyframes[i];
    const b = keyframes[Math.min(i + 1, keyframes.length - 1)];
    const local = a.t === b.t ? 0 : (t - a.t) / (b.t - a.t);
    const e = local * local * (3 - 2 * local);
    return {
      x: lerp(a.x, b.x, e),
      y: lerp(a.y, b.y, e),
      rotate: lerp(a.rotate, b.rotate, e),
      opacity: lerp(a.opacity, b.opacity, e),
      scale: lerp(a.scale, b.scale, e),
    };
  };

  const applyTheatre = (v) => {
    theatreEl.style.transform = `translate(${v.x}px, ${v.y}px) rotate(${v.rotate}deg) scale(${v.scale})`;
    theatreEl.style.opacity = String(v.opacity);
  };

  let theatrePlaying = false;
  document.getElementById("theatre-play").onclick = () => {
    if (theatrePlaying) return;
    theatrePlaying = true;
    const duration = 2200;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      applyTheatre(sample(p));
      if (p < 1) requestAnimationFrame(tick);
      else theatrePlaying = false;
    };
    requestAnimationFrame(tick);
  };

  applyTheatre(sample(0));
} catch (e) {
  showErr("theatre", e);
}
