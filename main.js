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

        introEl.style.transition = "opacity 0.32s ease";
        introEl.style.opacity = "0";
        introEl.style.pointerEvents = "none";

        // Reveal site
        siteEl.style.visibility = "visible";
        siteEl.style.opacity = "1";

        // Trigger sweep
        requestAnimationFrame(() => {
          sweep.style.transform = "translateX(145%) rotate(-10deg)";
        });

        setTimeout(() => {
          introEl.remove();
          sweep.remove();
          // Kick off main animations
          startMainAnimations();
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
  gsap.registerPlugin(SplitText, ScrollTrigger);

  /* ── Lenis smooth scroll ── */
  const lenis = new Lenis({
    duration: 1.35,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── Scroll progress bar ── */
  const bar = document.getElementById("scroll-progress");
  lenis.on("scroll", ({ progress }) => {
    if (bar) bar.style.width = progress * 100 + "%";
  });

  /* ── Sticky nav ── */
  const nav = document.getElementById("nav");
  ScrollTrigger.create({
    start: "top -60px",
    onUpdate: (s) => nav.classList.toggle("scrolled", s.progress > 0),
  });

  /* Cursor effects */
  const shouldEnableCustomCursor =
    window.matchMedia("(pointer: fine)").matches ||
    window.matchMedia("(hover: hover)").matches;
  let cursorBooted = false;
  const initCustomCursor = () => {
    if (cursorBooted || document.getElementById("cursor-crosshair")) return;
    cursorBooted = true;

    document.body.classList.add("has-custom-cursor");
    const cursor = document.createElement("div");
    cursor.id = "cursor-crosshair";
    cursor.className = "cursor-system";
    cursor.innerHTML = '<div class="cursor-core"></div>';
    document.body.appendChild(cursor);

    const orbs = Array.from({ length: 3 }, () => {
      const el = document.createElement("div");
      el.className = "cursor-orb";
      document.body.appendChild(el);
      return { el, a: Math.random() * Math.PI * 2 };
    });

    const shards = Array.from({ length: 20 }, () => {
      const el = document.createElement("div");
      el.className = "cursor-shard";
      document.body.appendChild(el);
      return { el, x: window.innerWidth / 2, y: window.innerHeight / 2 };
    });

    const waves = Array.from({ length: 6 }, () => {
      const el = document.createElement("div");
      el.className = "cursor-wave";
      document.body.appendChild(el);
      return { el, life: 0, x: 0, y: 0 };
    });

    let waveIndex = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let lx = x;
    let ly = y;
    let vx = 0;
    let vy = 0;
    let hover = false;
    let t = 0;

    document.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    document.querySelectorAll("a, button, .btn, .ou-btn").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        hover = true;
      });
      el.addEventListener("mouseleave", () => {
        hover = false;
      });
    });

    document.addEventListener("click", (e) => {
      const w = waves[waveIndex];
      waveIndex = (waveIndex + 1) % waves.length;
      w.life = 1;
      w.x = e.clientX;
      w.y = e.clientY;
      w.el.style.left = w.x + "px";
      w.el.style.top = w.y + "px";
      w.el.style.opacity = "0.9";
      w.el.style.width = "10px";
      w.el.style.height = "10px";
    });

    (function animateTracker() {
      t += 0.02;
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      vx = x - lx;
      vy = y - ly;
      lx = x;
      ly = y;
      const speed = Math.hypot(vx, vy);

      cursor.style.left = x + "px";
      cursor.style.top = y + "px";
      cursor.style.transform = `translate(-50%,-50%) scale(${hover ? 1.8 : 1 + Math.min(speed * 0.05, 0.35)}) rotate(${Math.atan2(vy, vx || 0.001)}rad)`;

      orbs.forEach((o, i) => {
        o.a += 0.03 + i * 0.008 + speed * 0.0015;
        const r = 18 + i * 10 + Math.sin(t + i) * 4 + Math.min(speed, 24) * 0.4;
        const ox = x + Math.cos(o.a) * r;
        const oy = y + Math.sin(o.a * 1.2) * (r * 0.65);
        o.el.style.left = ox + "px";
        o.el.style.top = oy + "px";
        o.el.style.opacity = `${0.45 + i * 0.15}`;
      });

      let px = x;
      let py = y;
      shards.forEach((s, i) => {
        s.x += (px - s.x) * (0.32 - i * 0.008);
        s.y += (py - s.y) * (0.32 - i * 0.008);
        const ang = Math.atan2(py - s.y, px - s.x);
        s.el.style.left = s.x + "px";
        s.el.style.top = s.y + "px";
        s.el.style.opacity = `${Math.max(0.08, 0.85 - i * 0.04)}`;
        s.el.style.transform = `translate(-50%,-50%) rotate(${ang}rad) scale(${1.1 - i * 0.02})`;
        px = s.x;
        py = s.y;
      });

      waves.forEach((w) => {
        if (w.life <= 0) return;
        w.life -= 0.05;
        const grow = 1 - w.life;
        w.el.style.left = w.x + "px";
        w.el.style.top = w.y + "px";
        w.el.style.width = `${10 + grow * 120}px`;
        w.el.style.height = `${10 + grow * 120}px`;
        w.el.style.opacity = `${Math.max(0, w.life * 0.8)}`;
      });

      requestAnimationFrame(animateTracker);
    })();
  };

  if (shouldEnableCustomCursor) initCustomCursor();
  window.addEventListener("mousemove", initCustomCursor, { once: true });
  const scrollBg = document.getElementById("scroll-bg");
  const heroScene = document.querySelector(".hero-scene");
  const heroPhone = document.querySelector(".hero-phone");
  const heroProps = document.querySelectorAll(".hero-prop");
  if (scrollBg) {
    // Keep a static, unified background across the entire page.
    scrollBg.style.opacity = "1";
    scrollBg.style.filter = "none";
  }

  if (heroPhone && heroScene) {
    gsap.to(heroScene, {
      y: -14,
      rotateZ: -0.8,
      duration: 4.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    gsap.to(heroPhone, {
      y: -10,
      rotateY: -29,
      rotateX: 18,
      duration: 3.9,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    heroProps.forEach((prop, i) => {
      gsap.to(prop, {
        y: i === 0 ? -20 : -14,
        rotateZ: i === 0 ? -13.2 : 14.1,
        duration: 3 + i * 0.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    });

    const heroEl = document.getElementById("hero");
    heroEl.addEventListener("mousemove", (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      gsap.to(heroPhone, {
        rotateY: -26 + dx * 9,
        rotateX: 16 - dy * 6,
        rotateZ: -7 + dx * 2.2,
        x: dx * 18,
        y: dy * 12,
        duration: 0.8,
        ease: "power2.out",
      });
      heroProps.forEach((prop, i) => {
        const dir = i === 0 ? 1 : -1;
        gsap.to(prop, {
          x: dx * (58 + i * 20) * dir,
          y: dy * (26 + i * 15),
          rotateY: (i === 0 ? 48 : 40) + dx * 30 * dir,
          rotateX: (i === 0 ? 19 : 18) - dy * 20,
          rotateZ: (i === 0 ? -14 : 14) + dx * 11 * dir,
          duration: 0.75,
          ease: "power2.out",
        });
      });
      gsap.to(heroScene, {
        rotateX: dy * 2.4,
        rotateY: dx * -2.8,
        x: dx * -12,
        duration: 0.9,
        ease: "power2.out",
      });
    });

    heroEl.addEventListener("mouseleave", () => {
      gsap.to(heroPhone, {
        rotateY: -26,
        rotateX: 16,
        rotateZ: -7,
        x: 0,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
      });
      heroProps.forEach((prop, i) => {
        gsap.to(prop, {
          x: i === 1 ? 40 : 0,
          y: 0,
          rotateY: i === 0 ? 48 : 40,
          rotateX: i === 0 ? 19 : 18,
          rotateZ: i === 0 ? -14 : 14,
          duration: 1,
          ease: "power3.out",
        });
      });
      gsap.to(heroScene, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        duration: 1,
        ease: "power3.out",
      });
    });
  }

  /* ── Always-on ambient motion ── */
  gsap.to(".hero-center", {
    y: -8,
    duration: 3.8,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
  gsap.to(".btn-primary", {
    boxShadow: "0 0 90px rgba(201,171,110,0.55)",
    duration: 1.7,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
  gsap.to(".avatar", {
    y: -4,
    duration: 1.8,
    stagger: 0.08,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  /* ── Hero entrance (waits for fonts) ── */
  document.fonts.ready.then(() => {
    // Eyebrow
    gsap.from("#eyebrow", {
      clipPath: "inset(0 100% 0 0)",
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.1,
    });

    // Headline — char 3D flip
    const split = new SplitText("#hero-headline", {
      type: "chars,words",
      charsClass: "split-char",
    });
    gsap.from(split.chars, {
      opacity: 0,
      y: 80,
      rotateX: -90,
      transformOrigin: "50% 50% -20px",
      stagger: { amount: 0.7, from: "start" },
      duration: 1.1,
      ease: "back.out(1.8)",
      delay: 0.15,
    });

    // Sub
    const subSplit = new SplitText("#hero-sub", { type: "words" });
    gsap.from(subSplit.words, {
      opacity: 0,
      y: 18,
      stagger: 0.04,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.9,
    });

    // Actions
    gsap.from("#hero-actions", {
      opacity: 0,
      y: 20,
      duration: 0.7,
      ease: "power3.out",
      delay: 1.15,
    });

    if (heroScene && heroPhone) {
      gsap.from(heroScene, {
        opacity: 0,
        scale: 0.9,
        rotateY: -14,
        y: 36,
        duration: 1.25,
        ease: "expo.out",
        delay: 0.28,
        transformPerspective: 1200,
      });
      gsap.from(heroProps, {
        opacity: 0,
        x: -80,
        y: 40,
        rotateZ: -16,
        stagger: 0.12,
        duration: 1.1,
        ease: "expo.out",
        delay: 0.35,
      });
      gsap.from(heroPhone, {
        opacity: 0,
        x: 120,
        y: 36,
        rotateY: -40,
        rotateX: 24,
        duration: 1.3,
        ease: "expo.out",
        delay: 0.42,
      });
    }

    // Scattered cards entrance — each flies in from off-screen
    const fcards = document.querySelectorAll(".fcard");
    fcards.forEach((card, i) => {
      const fromX = i % 2 === 0 ? -120 : 120;
      const fromY = 60 + i * 20;
      gsap.from(card, {
        x: fromX,
        y: fromY,
        opacity: 0,
        rotate: (Math.random() - 0.5) * 30,
        scale: 0.7,
        duration: 1.2 + i * 0.1,
        ease: "expo.out",
        delay: 0.3 + i * 0.12,
        transformPerspective: 800,
      });
    });

    // Waitlist heading
    const wlSplit = new SplitText("#wl-heading", {
      type: "chars",
      charsClass: "wl-char",
    });
    gsap.from(wlSplit.chars, {
      scrollTrigger: { trigger: "#wl-heading", start: "top 80%" },
      opacity: 0,
      y: 50,
      rotateX: -80,
      transformOrigin: "50% 50% -10px",
      stagger: { amount: 0.45, from: "start" },
      duration: 0.8,
      ease: "back.out(1.7)",
    });
  });

  /* ── Cards: gentle perpetual float + mouse parallax ── */
  const fcards = document.querySelectorAll(".fcard");
  const floatDurations = [3.2, 3.7, 4.1, 3.5];
  const floatAmounts = [4, 6, 5, 4];
  fcards.forEach((card, i) => {
    gsap.to(card, {
      y: `-=${floatAmounts[i]}`,
      duration: floatDurations[i],
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: i * 0.5,
    });
  });

  // Phone cards micro parallax
  const heroEl = document.getElementById("hero");
  const cardParallaxFactors = [-1, 1, 0.7, -0.8];
  heroEl.addEventListener("mousemove", (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    fcards.forEach((card, i) => {
      const f = cardParallaxFactors[i];
      gsap.to(card, {
        x: dx * f * 0.01,
        y: dy * f * 0.012,
        rotateY: dx * f * 0.01,
        rotateX: -dy * f * 0.007,
        transformPerspective: 900,
        duration: 0.5,
        ease: "power2.out",
        overwrite: false,
      });
    });
  });
  heroEl.addEventListener("mouseleave", () => {
    fcards.forEach((card) => {
      gsap.to(card, {
        x: 0,
        y: 0,
        rotateY: 0,
        rotateX: 0,
        duration: 0.9,
        ease: "power2.out",
      });
    });
  });

  // Card hover
  fcards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        scale: 1.035,
        duration: 0.28,
        ease: "power2.out",
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    });
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: x * 7,
        rotateX: -y * 5,
        transformPerspective: 700,
        duration: 0.24,
        ease: "power2.out",
        overwrite: true,
      });
    });
  });

  /* ── Hero scroll fade ── */
  gsap.to(".hero-center", {
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
    y: -50,
    opacity: 0,
    ease: "none",
  });
  gsap.to("#cards-field", {
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
    y: -80,
    ease: "none",
  });

  gsap.to(".hero-scene", {
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
    rotateY: -8,
    rotateX: 5,
    scale: 0.86,
    filter: "blur(3px)",
    ease: "none",
  });

  /* ── Showcase section animations ── */
  const showcasePanels = gsap.utils.toArray(".showcase-panel");
  if (showcasePanels.length) {
    gsap.from(".showcase-head", {
      scrollTrigger: { trigger: "#showcase", start: "top 82%" },
      y: 50,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
    });

    gsap.to(".showcase-bg", {
      scrollTrigger: {
        trigger: "#showcase",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
      y: -90,
      rotate: -3,
      ease: "none",
    });

    showcasePanels.forEach((panel, i) => {
      gsap.from(panel, {
        scrollTrigger: {
          trigger: panel,
          start: "top 88%",
          end: "top 50%",
          scrub: true,
        },
        opacity: 0,
        y: 80 + i * 18,
        rotateX: 80 - i * 12,
        rotateY: i % 2 ? -24 : 24,
        filter: "blur(8px)",
        transformPerspective: 1400,
        ease: "power2.out",
      });
      gsap.to(panel, {
        scrollTrigger: {
          trigger: "#showcase",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        y: -(i + 1) * 28,
        rotateZ: i % 2 ? -1.4 : 1.4,
        ease: "none",
      });
    });
  }

  /* ── Waitlist section animations ── */
  const wl = document.getElementById("waitlist");
  new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) wl.classList.add("line-drawn");
    },
    { threshold: 0.05 },
  ).observe(wl);

  gsap.from(".wl-sub", {
    scrollTrigger: { trigger: ".wl-sub", start: "top 85%" },
    opacity: 0,
    x: -30,
    duration: 0.8,
    ease: "power2.out",
  });
  gsap.from(".perk-item", {
    scrollTrigger: { trigger: ".wl-perks", start: "top 85%" },
    opacity: 0,
    x: -20,
    stagger: 0.1,
    duration: 0.6,
    ease: "power2.out",
  });
  gsap.from("#wl-form-wrap", {
    scrollTrigger: { trigger: "#wl-form-wrap", start: "top 85%" },
    opacity: 0,
    y: 50,
    rotateX: 6,
    transformOrigin: "top center",
    duration: 1,
    ease: "expo.out",
  });
  gsap.fromTo(
    ".waitlist-inner",
    { y: 80, opacity: 0.3, filter: "blur(8px)" },
    {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#waitlist",
        start: "top 90%",
        end: "top 55%",
        scrub: true,
      },
    },
  );
  gsap.to(".orb-1", {
    x: 120,
    y: 30,
    scrollTrigger: {
      trigger: "#waitlist",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
    ease: "none",
  });
  gsap.to(".orb-2", {
    x: -110,
    y: -24,
    scrollTrigger: {
      trigger: "#waitlist",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
    ease: "none",
  });
  gsap.from("#footer .footer-inner > *", {
    scrollTrigger: { trigger: "#footer", start: "top 90%" },
    opacity: 0,
    y: 18,
    stagger: 0.1,
    duration: 0.6,
    ease: "power2.out",
  });

  /* ── Counter ── */
  const counterEl = document.getElementById("counter-el");
  if (counterEl) {
    let counted = false;
    new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !counted) {
          counted = true;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / 1400, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            counterEl.textContent =
              Math.floor(eased * 1200).toLocaleString() + "+";
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    ).observe(counterEl);
  }

  /* ── Card 3D tilt on hover ── */
  const mainCard = document.getElementById("main-prop-card");
  if (mainCard) {
    mainCard.addEventListener("mousemove", (e) => {
      const r = mainCard.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(mainCard, {
        rotateY: x * 14,
        rotateX: -y * 10,
        transformPerspective: 900,
        duration: 0.35,
        ease: "power2.out",
      });
    });
    mainCard.addEventListener("mouseleave", () => {
      gsap.to(mainCard, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)",
      });
    });
  }

  /* ── O/U button toggle ── */
  const btnOver = document.getElementById("btn-over");
  const btnUnder = document.getElementById("btn-under");
  if (btnOver && btnUnder) {
    [btnOver, btnUnder].forEach((btn) => {
      btn.addEventListener("click", () => {
        btnOver.classList.remove("selected");
        btnUnder.classList.remove("selected");
        btn.classList.add("selected");
        gsap.from(btn, { scale: 0.94, duration: 0.3, ease: "back.out(2)" });
      });
    });
  }

  /* ── Magnetic buttons ── */
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.28;
      const y = (e.clientY - r.top - r.height / 2) * 0.28;
      gsap.to(btn, { x, y, duration: 0.3, ease: "power2.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
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
