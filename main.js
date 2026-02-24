/* ============================================================
   VANTAGE — main.js
   ============================================================ */

const FORM_ENDPOINT = "";

/* ══════════════════════════════════════════════════════════════
   1. INTRO CANVAS — animated betting numbers rain + logo reveal
   ══════════════════════════════════════════════════════════════ */
(function initIntro() {
  const canvas = document.getElementById("intro-canvas");
  const ctx = canvas.getContext("2d");
  const logoEl = document.getElementById("intro-logo");
  const tagEl = document.getElementById("intro-tagline");
  const introEl = document.getElementById("intro");
  const siteEl = document.getElementById("site");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Betting symbols that rain down
  const symbols = [
    "OVER",
    "UNDER",
    "O/U",
    "NBA",
    "NFL",
    "MLB",
    "NHL",
    "+EV",
    "-110",
    "-115",
    "+105",
    "2x",
    "3x",
    "5x",
    "8x",
    "PARLAY",
    "PROP",
    "PICKS",
    "BET",
    "LINE",
    "PUSH",
    "284.5",
    "74.5",
    "89.5",
    "22.5",
    "3.5",
    "7.5",
    "1.5",
    "✓",
    "✓",
    "✓",
    "$",
    "$$",
    "▲",
    "▼",
    "🔥",
    "💰",
  ];

  const COL_W = 52; // wider spacing so text words are readable
  let cols, drops, speeds;

  function initDrops() {
    cols = Math.ceil(canvas.width / COL_W);
    drops = Array.from(
      { length: cols },
      () => Math.random() * -(canvas.height / 16),
    );
    speeds = Array.from({ length: cols }, () => 0.6 + Math.random() * 0.8);
  }
  initDrops();
  window.addEventListener("resize", initDrops);

  function drawRain() {
    // Slight fade trail
    ctx.fillStyle = "rgba(7, 7, 7, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < cols; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const x = i * COL_W + 4;
      const y = drops[i] * 18;

      const r = Math.random();
      if (r < 0.12)
        ctx.fillStyle = "#c9ab6e"; // gold
      else if (r < 0.2)
        ctx.fillStyle = "#3ecf8e"; // green
      else if (r < 0.22)
        ctx.fillStyle = "rgba(240,235,225,0.55)"; // bright white (lead char)
      else ctx.fillStyle = "rgba(240,235,225,0.09)"; // dim

      ctx.font = `700 13px 'Courier New', monospace`;
      ctx.fillText(sym, x, y);

      if (y > canvas.height + 60 || Math.random() > 0.98) {
        drops[i] = Math.random() * -20;
      } else {
        drops[i] += speeds[i];
      }
    }
  }

  let rainRaf;
  function animateRain() {
    drawRain();
    rainRaf = requestAnimationFrame(animateRain);
  }
  animateRain();

  // Odds ticker + pick dots progress indicator
  const oddsEl = document.getElementById("odds-number");
  const dots = [1, 2, 3, 4, 5].map((i) => document.getElementById(`dot-${i}`));

  // Final parlay odds value that it counts up to
  const FINAL_ODDS = 1247;
  // Milestones when each pick "locks in" (as % of duration)
  const dotMilestones = [0.15, 0.32, 0.5, 0.68, 0.84];
  const lockedDots = new Set();

  let oddsTickInterval = setInterval(() => {
    // Random scramble while loading
    oddsEl.textContent = Math.floor(100 + Math.random() * 1800);
  }, 60);

  let progress = 0;
  const duration = 2600;
  const startTime = performance.now();

  function updateProgress(now) {
    progress = Math.min((now - startTime) / duration, 1);

    // Logo fades in at 20%
    if (progress > 0.2)
      logoEl.style.opacity = Math.min((progress - 0.2) / 0.3, 1);

    // Tagline wipes in at 50%
    if (progress > 0.5) {
      const p = Math.min((progress - 0.5) / 0.35, 1);
      tagEl.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
      tagEl.style.opacity = "1";
    }

    // Lock in pick dots at milestones
    dotMilestones.forEach((milestone, i) => {
      if (progress >= milestone && !lockedDots.has(i)) {
        lockedDots.add(i);
        // Brief "active" flash before locking green
        dots[i].classList.add("active");
        setTimeout(() => {
          dots[i].classList.remove("active");
          dots[i].classList.add("locked");
        }, 220);
      }
    });

    // At 90% — stop scrambling, count up to final value
    if (progress >= 0.9 && oddsTickInterval) {
      clearInterval(oddsTickInterval);
      oddsTickInterval = null;
      const countStart = performance.now();
      const countFrom = parseInt(oddsEl.textContent) || 100;
      function countUp(t) {
        const p = Math.min((t - countStart) / 400, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        oddsEl.textContent = Math.floor(
          countFrom + (FINAL_ODDS - countFrom) * eased,
        );
        if (p < 1) requestAnimationFrame(countUp);
        else {
          oddsEl.textContent = FINAL_ODDS;
          oddsEl.classList.add("locked");
        }
      }
      requestAnimationFrame(countUp);
    }

    if (progress < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      // Outro — flash then wipe
      setTimeout(() => {
        cancelAnimationFrame(rainRaf);

        const sweep = document.createElement("div");
        sweep.style.cssText =
          "position:fixed;inset:-25% -35%;z-index:9998;pointer-events:none;background:linear-gradient(106deg,#070707 22%,rgba(7,7,7,0.95) 44%,rgba(7,7,7,0.15) 70%,transparent 100%);transform:translateX(-145%) rotate(-10deg);transition:transform 0.95s cubic-bezier(0.22,1,0.36,1);";
        document.body.appendChild(sweep);

        // Make site visible beneath intro before sweep starts
        siteEl.style.visibility = "visible";
        siteEl.style.opacity = "0";

        // Start intro fade slightly after sweep begins
        setTimeout(() => {
          introEl.style.transition = "opacity 0.45s ease";
          introEl.style.opacity = "0";
          introEl.style.pointerEvents = "none";
        }, 300);

        // Trigger sweep
        requestAnimationFrame(() => {
          sweep.style.transform = "translateX(145%) rotate(-10deg)";
        });

        setTimeout(() => {
          introEl.remove();
          sweep.remove();
          // Reveal site instantly — GSAP timeline handles all element entrances
          siteEl.style.transition = "none";
          siteEl.style.opacity = "1";
          siteEl.classList.add("entering");
          startMainAnimations();
          setTimeout(() => siteEl.classList.remove("entering"), 2200);
        }, 980);
      }, 200);
    }
  }
  requestAnimationFrame(updateProgress);
})();

/* ══════════════════════════════════════════════════════════════
   2. MAIN SITE ANIMATIONS (run after intro completes)
   ══════════════════════════════════════════════════════════════ */
function startMainAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis smooth scroll ── */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── Cursor grid + spotlight ── */
  const spotlight = document.getElementById("cursor-spotlight");
  const cursorGrid = document.getElementById("cursor-grid");
  let slx = window.innerWidth / 2, sly = window.innerHeight / 2;
  let stx = slx, sty = sly;
  let gx = -9999, gy = -9999;
  let cursorEntered = false;

  document.addEventListener("mousemove", (e) => {
    stx = e.clientX; sty = e.clientY;
    gx = e.clientX; gy = e.clientY;
    if (!cursorEntered) {
      cursorEntered = true;
      if (spotlight) spotlight.classList.add("active");
      if (cursorGrid) cursorGrid.classList.add("active");
    }
  });
  document.addEventListener("mouseleave", () => {
    cursorEntered = false;
    if (spotlight) spotlight.classList.remove("active");
    if (cursorGrid) cursorGrid.classList.remove("active");
  });

  (function tickCursor() {
    slx += (stx - slx) * 0.08;
    sly += (sty - sly) * 0.08;
    if (spotlight) {
      spotlight.style.setProperty("--cx", slx + "px");
      spotlight.style.setProperty("--cy", sly + "px");
    }
    if (cursorGrid) {
      cursorGrid.style.setProperty("--cx", gx + "px");
      cursorGrid.style.setProperty("--cy", gy + "px");
    }
    requestAnimationFrame(tickCursor);
  })();

  /* ── Custom cursor: instant dot + lagging ring ── */
  if (!document.getElementById("cursor-dot")) {
    document.body.classList.add("has-custom-cursor");
    const dot  = Object.assign(document.createElement("div"), { id: "cursor-dot" });
    const ring = Object.assign(document.createElement("div"), { id: "cursor-ring" });
    document.body.append(dot, ring);

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my, rvx = 0, rvy = 0;

    document.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });

    document.querySelectorAll("a, button, .btn").forEach((el) => {
      el.addEventListener("mouseenter", () => document.body.classList.add("cursor-on-link"));
      el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on-link"));
    });

    (function tickDot() {
      // Dot follows instantly
      dot.style.left = mx + "px";
      dot.style.top  = my + "px";
      // Ring lags with spring
      rvx += (mx - rx) * 0.14; rvy += (my - ry) * 0.14;
      rvx *= 0.75; rvy *= 0.75;
      rx += rvx; ry += rvy;
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";

      requestAnimationFrame(tickDot);
    })();
  }

  /* ── Hero elements ── */
  const heroScene = document.querySelector(".hero-scene");
  const heroPhoneWrap = document.querySelector(".hero-phone-wrap");
  const heroPhone = document.querySelector(".hero-phone");
  const heroProps = document.querySelector(".hero-props");

  /* ── Hero entrance — GSAP timeline ── */
  gsap.set("#nav", { autoAlpha: 0, y: -24 });
  gsap.set("#eyebrow", { autoAlpha: 0, y: 16, clipPath: "inset(0 100% 0 0)" });
  gsap.set("#hero-headline", { autoAlpha: 0, y: 72, filter: "blur(10px)" });
  gsap.set("#hero-sub", { autoAlpha: 0, y: 20 });
  gsap.set("#hero-actions", { autoAlpha: 0, y: 16 });
  if (heroPhoneWrap) gsap.set(heroPhoneWrap, { autoAlpha: 0, x: 100, filter: "blur(14px)" });
  if (heroProps) gsap.set(heroProps, { autoAlpha: 0, x: -80, filter: "blur(14px)" });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.05 });

  tl.to("#nav",                { autoAlpha: 1, y: 0, duration: 0.7 }, 0)
    .to(heroPhoneWrap || {},   { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 1.1 }, 0.1)
    .to(heroProps || {},       { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 1.0 }, 0.2)
    .to("#eyebrow",            { autoAlpha: 1, y: 0, clipPath: "inset(0 0% 0 0)", duration: 0.8 }, 0.3)
    .to("#hero-headline",      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.0 }, 0.42)
    .to("#hero-sub",           { autoAlpha: 1, y: 0, duration: 0.65 }, 0.78)
    .to("#hero-actions",       { autoAlpha: 1, y: 0, duration: 0.55, ease: "back.out(1.4)" }, 0.92);

  /* ── Phone idle float (starts after entrance completes) ── */
  if (heroPhoneWrap) {
    tl.call(() => {
      gsap.to(heroPhoneWrap, { y: "-=12", duration: 3.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }, null, 1.6);
  }

  /* ── Hero mouse parallax ── */
  if (heroPhone && heroScene) {
    const heroEl = document.getElementById("hero");
    heroEl.addEventListener("mousemove", (e) => {
      const dx = (e.clientX / innerWidth  - 0.5) * 2;
      const dy = (e.clientY / innerHeight - 0.5) * 2;
      gsap.to(heroPhone, { rotateY: -26 + dx * 18, rotateX: 16 - dy * 13, rotateZ: -7 + dx * 4, x: dx * 28, duration: 0.9, ease: "power2.out", overwrite: "auto" });
      gsap.to(heroScene, { rotateX: dy * 4, rotateY: dx * -4, x: dx * -12, duration: 1.0, ease: "power2.out", overwrite: "auto" });
    });
    heroEl.addEventListener("mouseleave", () => {
      gsap.to(heroPhone, { rotateY: -26, rotateX: 16, rotateZ: -7, x: 0, duration: 1.0, ease: "power3.out", overwrite: "auto" });
      gsap.to(heroScene, { rotateX: 0, rotateY: 0, x: 0, duration: 1.0, ease: "power3.out", overwrite: "auto" });
    });
  }

  /* ── Prop card 3D parallax + shine ── */
  const propCards = [
    { el: document.querySelector(".hero-prop-wrap--curry"),  baseY: 28,  baseX: 10, baseZ: -15, strength: { y: 30, x: 22 } },
    { el: document.querySelector(".hero-prop-wrap--lebron"), baseY: -26, baseX: -8, baseZ: 13,  strength: { y: 28, x: 20 } },
  ];
  let propMx = 0, propMy = 0;
  document.addEventListener("mousemove", (e) => {
    propMx = (e.clientX / innerWidth  - 0.5) * 2;
    propMy = (e.clientY / innerHeight - 0.5) * 2;
  });
  propCards.forEach(({ el, baseY, baseX, baseZ, strength }) => {
    if (!el) return;
    const shine = el.querySelector(".prop-shine");
    let curY = baseY, curX = baseX;
    el.addEventListener("mouseenter", () => el.classList.add("prop-active"));
    el.addEventListener("mouseleave", () => { el.classList.remove("prop-active"); if (shine) shine.style.background = ""; });
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const sx = ((e.clientX - r.left) / r.width)  * 100;
      const sy = ((e.clientY - r.top)  / r.height) * 100;
      if (shine) shine.style.background = `radial-gradient(circle at ${sx}% ${sy}%, rgba(201,171,110,0.5) 0%, rgba(201,171,110,0.15) 40%, transparent 65%)`;
    });
    (function tick() {
      curY += (baseY + propMx * strength.y - curY) * 0.09;
      curX += (baseX - propMy * strength.x - curX) * 0.09;
      el.style.transform = `perspective(900px) rotateY(${curY}deg) rotateX(${curX}deg) rotateZ(${baseZ}deg)`;
      requestAnimationFrame(tick);
    })();
  });

  /* ── Magnetic buttons ── */
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.3, ease: "power2.out" });
    });
    btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
  });

  /* ════════════════════════════════════════════
     SCROLL ANIMATIONS
     ════════════════════════════════════════════ */

  // Hero text drifts up as you scroll away
  gsap.to(".hero-center", {
    scrollTrigger: { trigger: "#hero", start: "top top", end: "50% top", scrub: 1 },
    y: -60, autoAlpha: 0, ease: "none",
  });

  // Waitlist section divider line draws
  const wl = document.getElementById("waitlist");
  if (wl) {
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) wl.classList.add("line-drawn");
    }, { threshold: 0.05 }).observe(wl);
  }

  // Waitlist heading
  const wlHeading = document.getElementById("wl-heading");
  if (wlHeading) {
    gsap.fromTo(wlHeading,
      { autoAlpha: 0, y: 50, filter: "blur(6px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "expo.out",
        scrollTrigger: { trigger: wlHeading, start: "top 88%", toggleActions: "play none none none" } }
    );
  }

  gsap.from(".wl-sub", {
    autoAlpha: 0, y: 30, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".wl-sub", start: "top 90%", toggleActions: "play none none none" },
  });
  gsap.from(".perk-item", {
    autoAlpha: 0, y: 22, stagger: 0.1, duration: 0.6, ease: "power3.out",
    scrollTrigger: { trigger: ".wl-perks", start: "top 88%", toggleActions: "play none none none" },
  });
  gsap.fromTo("#wl-form-wrap",
    { autoAlpha: 0, y: 60, scale: 0.96, filter: "blur(8px)" },
    { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.0, ease: "expo.out",
      scrollTrigger: { trigger: "#wl-form-wrap", start: "top 90%", toggleActions: "play none none none" } }
  );

  // Divider lines draw on scroll
  document.querySelectorAll(".ed-divider").forEach((divider) => {
    const line = divider.querySelector(".ed-divider-line");
    const label = divider.querySelector(".ed-divider-label");
    if (!line) return;
    ScrollTrigger.create({
      trigger: divider, start: "top 85%",
      onEnter: () => {
        line.classList.add("drawn");
        if (label) { label.style.transition = "opacity 0.5s ease 0.7s"; label.style.opacity = "1"; }
      },
    });
  });

  // Footer
  gsap.from("#footer .footer-inner > *", {
    scrollTrigger: { trigger: "#footer", start: "top 92%" },
    autoAlpha: 0, y: 18, stagger: 0.1, duration: 0.6, ease: "power2.out",
  });

  /* ── Form submission ── */
  const form = document.getElementById("waitlist-form");
  const successEl = document.getElementById("form-success");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email-input").value.trim();
      if (!email) return;
      const btn = form.querySelector('[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = "Joining...";
      btn.disabled = true;

      if (FORM_ENDPOINT) {
        try {
          const res = await fetch(FORM_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ email }),
          });
          res.ok
            ? showSuccess()
            : (showError("Something went wrong."), resetBtn(btn, orig));
        } catch {
          showError("Network error.");
          resetBtn(btn, orig);
        }
      } else {
        showSuccess();
      }
    });
  }

  function showSuccess() {
    // Fade out form first
    gsap.to(form, {
      opacity: 0,
      y: -16,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        form.hidden = true;
        successEl.hidden = false;
        gsap.from(successEl, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "back.out(1.5)",
        });
      },
    });

    // Basketball shot animation
    shootBasketball();
  }

  function shootBasketball() {
    const stage = document.getElementById("bball-stage");
    const ball = document.getElementById("bball-ball");
    const hoop = document.getElementById("bball-hoop");
    const cashBurst = document.getElementById("bball-cash-burst");
    const scoreText = document.getElementById("bball-score-text");
    if (!stage || !ball) return;

    // Get the submit button position as the ball's launch origin
    const submitBtn = form ? form.querySelector('[type="submit"]') : null;
    const btnRect = submitBtn
      ? submitBtn.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };

    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;

    // Hoop landing target — center of rim (bottom center of viewport)
    const hoopX = window.innerWidth / 2;
    const hoopY = window.innerHeight - 38; // rim is ~38px from bottom

    // Show stage
    stage.classList.add("active");

    // Position ball at button
    ball.style.left = startX + "px";
    ball.style.top = startY + "px";
    ball.style.opacity = "1";
    ball.style.fontSize = "2.4rem";
    ball.classList.add("spinning");

    // Animate ball along a parabolic arc using GSAP MotionPath-style keyframes
    const duration = 1.05;
    const startTime = performance.now();

    // Control point for the arc (above midpoint, shifted left slightly for realism)
    const cpX = (startX + hoopX) / 2 - 60;
    const cpY = Math.min(startY, hoopY) - window.innerHeight * 0.38;

    function animateBall(now) {
      const elapsed = (now - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);

      // Quadratic bezier
      const bx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * hoopX;
      const by = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * hoopY;

      // Scale: grows slightly at peak, shrinks toward hoop (depth effect)
      const scale = 1 + Math.sin(t * Math.PI) * 0.35 - t * 0.2;
      ball.style.left = bx + "px";
      ball.style.top = by + "px";
      ball.style.transform = `translate(-50%, -50%) rotate(${t * 720}deg) scale(${scale})`;

      if (t < 1) {
        requestAnimationFrame(animateBall);
      } else {
        // Ball reached hoop — score!
        onScore();
      }
    }
    requestAnimationFrame(animateBall);

    function onScore() {
      ball.classList.remove("spinning");

      // Hoop shake
      hoop.classList.add("shake");
      setTimeout(() => hoop.classList.remove("shake"), 500);

      // Ball drops through net
      gsap.to(ball, {
        top: hoopY + 72,
        scale: 0.55,
        opacity: 0,
        duration: 0.38,
        ease: "power2.in",
      });

      // Cash burst particles
      const emojis = ["💰", "💵", "🤑", "✨", "💸", "💰", "🔥", "💵"];
      cashBurst.innerHTML = "";
      cashBurst.style.left = hoopX + "px";
      cashBurst.style.top = (hoopY - 30) + "px";
      emojis.forEach((emoji, i) => {
        const el = document.createElement("div");
        el.className = "cash-particle";
        el.textContent = emoji;
        const angle = (i / emojis.length) * Math.PI * 2;
        const dist = 80 + Math.random() * 70;
        el.style.setProperty("--cx", Math.cos(angle) * dist + "px");
        el.style.setProperty("--cy", Math.sin(angle) * dist - 40 + "px");
        el.style.setProperty("--cr", (Math.random() * 120 - 60) + "deg");
        el.style.animationDelay = (i * 0.04) + "s";
        cashBurst.appendChild(el);
      });

      // Score text — positioned above the hoop
      scoreText.textContent = "Sent!";
      scoreText.style.top = (hoopY - 130) + "px";
      scoreText.classList.remove("pop");
      void scoreText.offsetWidth; // reflow to restart animation
      scoreText.classList.add("pop");

      // Clean up after animation
      setTimeout(() => {
        gsap.to(stage, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            stage.classList.remove("active");
            stage.style.opacity = "";
            ball.style.opacity = "1";
            cashBurst.innerHTML = "";
            scoreText.classList.remove("pop");
          },
        });
      }, 2200);
    }
  }

  function showError(msg) {
    let el = document.getElementById("form-error");
    if (!el) {
      el = document.createElement("p");
      el.id = "form-error";
      el.style.cssText =
        "color:#e05252;font-size:0.85rem;margin-top:0.5rem;text-align:center;";
      form.appendChild(el);
    }
    el.textContent = msg;
  }
  function resetBtn(btn, text) {
    btn.textContent = text;
    btn.disabled = false;
  }
}
