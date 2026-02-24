/* ============================================================
   VANTAGE — main.js
   ============================================================ */

const FORM_ENDPOINT = "";

/* ══════════════════════════════════════════════════════════════
   1. INTRO CANVAS — animated betting numbers rain + logo reveal
   ══════════════════════════════════════════════════════════════ */
(function initIntro() {
  const canvas  = document.getElementById("intro-canvas");
  const ctx     = canvas.getContext("2d");
  const logoEl  = document.getElementById("intro-logo");
  const tagEl   = document.getElementById("intro-tagline");
  const introEl = document.getElementById("intro");
  const siteEl  = document.getElementById("site");

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Betting symbols that rain down
  const symbols = [
    "OVER","UNDER","O/U","NBA","NFL","MLB","NHL",
    "+EV","-110","-115","+105","2x","3x","5x","8x",
    "PARLAY","PROP","PICKS","BET","LINE","PUSH",
    "284.5","74.5","89.5","22.5","3.5","7.5","1.5",
    "✓","✓","✓","$","$$","▲","▼","🔥","💰"
  ];

  const COL_W = 52; // wider spacing so text words are readable
  let cols, drops, speeds;

  function initDrops() {
    cols  = Math.ceil(canvas.width / COL_W);
    drops = Array.from({ length: cols }, () => Math.random() * -(canvas.height / 16));
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
      if (r < 0.12)       ctx.fillStyle = "#c9ab6e";           // gold
      else if (r < 0.2)   ctx.fillStyle = "#3ecf8e";           // green
      else if (r < 0.22)  ctx.fillStyle = "rgba(240,235,225,0.55)"; // bright white (lead char)
      else                ctx.fillStyle = "rgba(240,235,225,0.09)"; // dim

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
  function animateRain() { drawRain(); rainRaf = requestAnimationFrame(animateRain); }
  animateRain();

  // Odds ticker + pick dots progress indicator
  const oddsEl = document.getElementById("odds-number");
  const dots   = [1,2,3,4,5].map(i => document.getElementById(`dot-${i}`));

  // Final parlay odds value that it counts up to
  const FINAL_ODDS = 1247;
  // Milestones when each pick "locks in" (as % of duration)
  const dotMilestones = [0.15, 0.32, 0.50, 0.68, 0.84];
  const lockedDots = new Set();

  let oddsTickInterval = setInterval(() => {
    // Random scramble while loading
    oddsEl.textContent = Math.floor(100 + Math.random() * 1800);
  }, 60);

  let progress = 0;
  const duration = 4200;
  const startTime = performance.now();

  function updateProgress(now) {
    progress = Math.min((now - startTime) / duration, 1);

    // Logo fades in at 20%
    if (progress > 0.2) logoEl.style.opacity = Math.min((progress - 0.2) / 0.3, 1);

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
        oddsEl.textContent = Math.floor(countFrom + (FINAL_ODDS - countFrom) * eased);
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

        // White flash
        const flash = document.createElement("div");
        flash.style.cssText = "position:fixed;inset:0;background:#fff;z-index:10000;opacity:0;pointer-events:none;";
        document.body.appendChild(flash);

        // Curtain wipe: split intro into two halves
        introEl.style.transition = "none";
        const top = document.createElement("div");
        const bot = document.createElement("div");
        [top, bot].forEach(d => {
          d.style.cssText = `position:fixed;left:0;right:0;background:#070707;z-index:9998;transition:transform 0.9s cubic-bezier(0.76,0,0.24,1);`;
        });
        top.style.top = "0";
        top.style.height = "50vh";
        bot.style.bottom = "0";
        bot.style.height = "50vh";
        document.body.appendChild(top);
        document.body.appendChild(bot);

        // Hide original intro
        introEl.style.opacity = "0";
        introEl.style.pointerEvents = "none";

        // Reveal site
        siteEl.style.visibility = "visible";
        siteEl.style.opacity = "1";

        // Trigger wipe
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            top.style.transform = "translateY(-100%)";
            bot.style.transform = "translateY(100%)";
          });
        });

        setTimeout(() => {
          introEl.remove();
          top.remove();
          bot.remove();
          flash.remove();
          // Kick off main animations
          startMainAnimations();
        }, 950);
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
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── Scroll progress bar ── */
  const bar = document.getElementById("scroll-progress");
  lenis.on("scroll", ({ progress }) => { bar.style.width = (progress * 100) + "%"; });

  /* ── Sticky nav ── */
  const nav = document.getElementById("nav");
  ScrollTrigger.create({
    start: "top -60px",
    onUpdate: s => nav.classList.toggle("scrolled", s.progress > 0),
  });

  /* ── Cursor glow ── */
  const glow = document.createElement("div");
  glow.id = "cursor-glow";
  document.body.appendChild(glow);
  document.addEventListener("mousemove", e => {
    gsap.to(glow, { left: e.clientX, top: e.clientY, duration: 0.5, ease: "power2.out" });
  });

  /* ── Hero entrance (waits for fonts) ── */
  document.fonts.ready.then(() => {

    // Eyebrow clip wipe
    gsap.from("#eyebrow", {
      clipPath: "inset(0 100% 0 0)", opacity: 0,
      duration: 0.8, ease: "power3.out", delay: 0.1,
    });

    // Headline — char by char 3D flip
    const split = new SplitText("#hero-headline", {
      type: "chars,words", charsClass: "split-char",
    });
    gsap.from(split.chars, {
      opacity: 0, y: 70, rotateX: -90,
      transformOrigin: "50% 50% -20px",
      stagger: { amount: 0.65, from: "start" },
      duration: 1, ease: "back.out(1.8)", delay: 0.2,
    });

    // Sub — words
    const subSplit = new SplitText("#hero-sub", { type: "words" });
    gsap.from(subSplit.words, {
      opacity: 0, y: 16,
      stagger: 0.03, duration: 0.55, ease: "power2.out", delay: 0.9,
    });

    // Actions + eyebrow counter
    gsap.from("#hero-actions", {
      opacity: 0, y: 20, duration: 0.7, ease: "power3.out", delay: 1.1,
    });

    // Card stack entrance
    gsap.from(".prop-card-bg-2", {
      opacity: 0, y: 40, rotate: 6, duration: 1.1, ease: "expo.out", delay: 0.5,
    });
    gsap.from(".prop-card-bg-1", {
      opacity: 0, y: 30, rotate: 3, duration: 1.1, ease: "expo.out", delay: 0.65,
    });
    gsap.from("#main-prop-card", {
      opacity: 0, y: 50, rotateY: 8,
      transformOrigin: "center center",
      transformPerspective: 900,
      duration: 1.2, ease: "expo.out", delay: 0.8,
    });
    gsap.from(".notif-1", {
      opacity: 0, scale: 0.7, y: -10,
      duration: 0.7, ease: "back.out(2)", delay: 1.4,
    });
    gsap.from(".notif-2", {
      opacity: 0, scale: 0.7, y: 10,
      duration: 0.7, ease: "back.out(2)", delay: 1.6,
    });

    // Waitlist heading split on scroll
    const wlSplit = new SplitText("#wl-heading", {
      type: "chars", charsClass: "wl-char",
    });
    gsap.from(wlSplit.chars, {
      scrollTrigger: { trigger: "#wl-heading", start: "top 80%" },
      opacity: 0, y: 50, rotateX: -80,
      transformOrigin: "50% 50% -10px",
      stagger: { amount: 0.45, from: "start" },
      duration: 0.8, ease: "back.out(1.7)",
    });
  });

  /* ── Hero scrub parallax ── */
  gsap.to(".hero-left", {
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
    y: -60, opacity: 0, ease: "none",
  });
  gsap.to(".card-stack", {
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
    y: -30, ease: "none",
  });

  /* ── Ticker fade-in ── */
  gsap.from("#ticker-wrap", {
    opacity: 0, y: -20, duration: 0.8, ease: "power2.out", delay: 0.6,
  });

  /* ── Floating notif chips perpetual movement ── */
  gsap.to(".notif-1", { y: -10, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(".notif-2", { y: -14, duration: 3.1, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.6 });

  /* ── Mock player rows stagger in ── */
  const rows = document.querySelectorAll(".mock-player-row");
  if (rows.length) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        rows.forEach((r, i) => setTimeout(() => r.classList.add("row-visible"), i * 120));
      }
    }, { threshold: 0.25 }).observe(document.querySelector(".prop-card-main"));
  }

  /* ── Waitlist section animations ── */
  const wl = document.getElementById("waitlist");
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) wl.classList.add("line-drawn");
  }, { threshold: 0.05 }).observe(wl);

  gsap.from(".wl-sub", {
    scrollTrigger: { trigger: ".wl-sub", start: "top 85%" },
    opacity: 0, x: -30, duration: 0.8, ease: "power2.out",
  });
  gsap.from(".perk-item", {
    scrollTrigger: { trigger: ".wl-perks", start: "top 85%" },
    opacity: 0, x: -20, stagger: 0.1, duration: 0.6, ease: "power2.out",
  });
  gsap.from("#wl-form-wrap", {
    scrollTrigger: { trigger: "#wl-form-wrap", start: "top 85%" },
    opacity: 0, y: 50, rotateX: 6,
    transformOrigin: "top center",
    duration: 1, ease: "expo.out",
  });
  gsap.from("#footer .footer-inner > *", {
    scrollTrigger: { trigger: "#footer", start: "top 90%" },
    opacity: 0, y: 18, stagger: 0.1, duration: 0.6, ease: "power2.out",
  });

  /* ── Counter ── */
  const counterEl = document.getElementById("counter-el");
  if (counterEl) {
    let counted = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        const start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / 1400, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          counterEl.textContent = Math.floor(eased * 1200).toLocaleString() + "+";
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 }).observe(counterEl);
  }

  /* ── Card 3D tilt on hover ── */
  const mainCard = document.getElementById("main-prop-card");
  if (mainCard) {
    mainCard.addEventListener("mousemove", e => {
      const r = mainCard.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(mainCard, {
        rotateY: x * 14, rotateX: -y * 10,
        transformPerspective: 900, duration: 0.35, ease: "power2.out",
      });
    });
    mainCard.addEventListener("mouseleave", () => {
      gsap.to(mainCard, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    });
  }

  /* ── O/U button toggle ── */
  const btnOver  = document.getElementById("btn-over");
  const btnUnder = document.getElementById("btn-under");
  if (btnOver && btnUnder) {
    [btnOver, btnUnder].forEach(btn => {
      btn.addEventListener("click", () => {
        btnOver.classList.remove("selected");
        btnUnder.classList.remove("selected");
        btn.classList.add("selected");
        gsap.from(btn, { scale: 0.94, duration: 0.3, ease: "back.out(2)" });
      });
    });
  }

  /* ── Magnetic buttons ── */
  document.querySelectorAll(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
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
  const form      = document.getElementById("waitlist-form");
  const successEl = document.getElementById("form-success");

  if (form) {
    form.addEventListener("submit", async e => {
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
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ email }),
          });
          res.ok ? showSuccess() : (showError("Something went wrong."), resetBtn(btn, orig));
        } catch {
          showError("Network error."); resetBtn(btn, orig);
        }
      } else {
        showSuccess();
      }
    });
  }

  function showSuccess() {
    gsap.to(form, {
      opacity: 0, y: -16, duration: 0.4, ease: "power2.in",
      onComplete: () => {
        form.hidden = true;
        successEl.hidden = false;
        gsap.from(successEl, { opacity: 0, y: 20, duration: 0.6, ease: "back.out(1.5)" });
      }
    });
  }
  function showError(msg) {
    let el = document.getElementById("form-error");
    if (!el) {
      el = document.createElement("p");
      el.id = "form-error";
      el.style.cssText = "color:#e05252;font-size:0.85rem;margin-top:0.5rem;text-align:center;";
      form.appendChild(el);
    }
    el.textContent = msg;
  }
  function resetBtn(btn, text) { btn.textContent = text; btn.disabled = false; }
}
