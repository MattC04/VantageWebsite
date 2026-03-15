import Head from "next/head";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Load main.js animations after component mounts
    // We use a dynamic import approach since main.js uses browser globals
    if (typeof window === "undefined") return;

    // Patch the form submission to use our API instead of EmailJS directly
    window.__VANTAGE_JOIN_API__ = true;

    const script = document.createElement("script");
    script.src = "/main.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount (navigation away)
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Vantage</title>
      </Head>

      {/* INTRO OVERLAY */}
      <div id="intro">
        <canvas id="intro-canvas"></canvas>
        <div id="intro-logo">
          <img
            src="/Logo.png"
            alt="Vantage"
            id="intro-logo-img"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span id="intro-logo-text">VANTAGE</span>
        </div>
        <div id="intro-tagline">The next greatest sports betting app.</div>
        <div id="intro-odds">
          <span className="odds-label">PARLAY ODDS</span>
          <div className="odds-display">
            <span className="odds-prefix">+</span>
            <span id="odds-number">100</span>
          </div>
          <div className="odds-picks">
            <span className="pick-dot" id="dot-1"></span>
            <span className="pick-dot" id="dot-2"></span>
            <span className="pick-dot" id="dot-3"></span>
            <span className="pick-dot" id="dot-4"></span>
            <span className="pick-dot" id="dot-5"></span>
          </div>
        </div>
      </div>

      {/* MAIN SITE */}
      <div id="site" style={{ opacity: 0, visibility: "hidden" }}>
        <div id="cursor-spotlight" aria-hidden="true"></div>
        <div id="cursor-grid" aria-hidden="true"></div>

        <div id="scroll-bg" aria-hidden="true">
          <div className="bg-aurora"></div>
          <div className="bg-grid"></div>
          <div className="bg-rings"></div>
          <div className="bg-noise"></div>
          <div className="bg-particles" id="bg-particles"></div>
          <div className="bg-heat" id="bg-heat"></div>
        </div>

        <div id="scroll-progress" aria-hidden="true"></div>

        {/* NAV */}
        <nav id="nav">
          <a href="#" className="nav-logo">
            <img
              src="/Logo.png"
              alt="Vantage"
              onError={(e) => (e.target.style.display = "none")}
            />
            <span className="logo-text">VANTAGE</span>
          </a>
          <a href="mailto:vantagesportsbook@gmail.com" className="nav-contact blob-btn">
            Contact Us
            <span className="blob-btn__inner">
              <span className="blob-btn__blobs">
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
              </span>
            </span>
          </a>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            style={{ display: "none" }}
          >
            <defs>
              <filter id="goo">
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="10"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                  result="goo"
                />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>
        </nav>

        {/* HERO */}
        <section id="hero">
          <div id="ticker-wrap" aria-hidden="true">
            <div id="ticker">
              <span className="tick tick-green">
                🏈 J. Allen OVER 284.5 yds ✓
              </span>
              <span className="tick tick-gold">💰 +$47.50</span>
              <span className="tick">NBA · LeBron PTS OVER 22.5</span>
              <span className="tick tick-green">
                ⚾ Ohtani K&apos;s OVER 7.5 ✓
              </span>
              <span className="tick tick-red">❌ CMC Rush UNDER 74.5</span>
              <span className="tick tick-gold">
                🔥 5-pick parlay · 8.2x payout
              </span>
              <span className="tick">NHL · McDavid Points OVER 1.5</span>
              <span className="tick tick-green">🏀 Curry 3PM OVER 3.5 ✓</span>
              <span className="tick tick-gold">💰 +$122.00</span>
              <span className="tick">NFL · Kelce Rec Yds OVER 68.5</span>
              <span className="tick tick-green">
                🏈 J. Allen OVER 284.5 yds ✓
              </span>
              <span className="tick tick-gold">💰 +$47.50</span>
              <span className="tick">NBA · LeBron PTS OVER 22.5</span>
              <span className="tick tick-green">
                ⚾ Ohtani K&apos;s OVER 7.5 ✓
              </span>
              <span className="tick tick-red">❌ CMC Rush UNDER 74.5</span>
              <span className="tick tick-gold">
                🔥 5-pick parlay · 8.2x payout
              </span>
              <span className="tick">NHL · McDavid Points OVER 1.5</span>
              <span className="tick tick-green">🏀 Curry 3PM OVER 3.5 ✓</span>
              <span className="tick tick-gold">💰 +$122.00</span>
              <span className="tick">NFL · Kelce Rec Yds OVER 68.5</span>
            </div>
          </div>

          {/* HERO PHONE */}
          <div id="cards-field" aria-hidden="true">
            <div className="hero-scene">
              <div className="hero-props">
                <div className="hero-prop-wrap hero-prop-wrap--curry">
                  <div className="prop-shine"></div>
                  <div className="prop-bg">
                    <div className="prop-tiles">
                      <div className="prop-tile prop-tile-1"></div>
                      <div className="prop-tile prop-tile-2"></div>
                      <div className="prop-tile prop-tile-3"></div>
                      <div className="prop-tile prop-tile-4"></div>
                      <div className="prop-tile prop-tile-5"></div>
                      <div className="prop-tile prop-tile-6"></div>
                      <div className="prop-tile prop-tile-7"></div>
                      <div className="prop-tile prop-tile-8"></div>
                    </div>
                    <div className="prop-line prop-line-1"></div>
                    <div className="prop-line prop-line-2"></div>
                  </div>
                  <img
                    className="hero-prop-img"
                    src="/assets/curry prop.png"
                    alt="Curry prop"
                  />
                </div>
                <div className="hero-prop-wrap hero-prop-wrap--lebron">
                  <div className="prop-shine"></div>
                  <div className="prop-bg">
                    <div className="prop-tiles">
                      <div className="prop-tile prop-tile-1"></div>
                      <div className="prop-tile prop-tile-2"></div>
                      <div className="prop-tile prop-tile-3"></div>
                      <div className="prop-tile prop-tile-4"></div>
                      <div className="prop-tile prop-tile-5"></div>
                      <div className="prop-tile prop-tile-6"></div>
                      <div className="prop-tile prop-tile-7"></div>
                      <div className="prop-tile prop-tile-8"></div>
                    </div>
                    <div className="prop-line prop-line-1"></div>
                    <div className="prop-line prop-line-2"></div>
                  </div>
                  <img
                    className="hero-prop-img"
                    src="/assets/Lebron prop.png"
                    alt="LeBron prop"
                  />
                </div>
              </div>
              <div className="hero-phone-wrap">
                <div className="hero-phone-glow" aria-hidden="true"></div>
                <div className="hero-phone">
                  <div className="hero-phone-notch"></div>
                  <div className="hero-phone-screen">
                    <img
                      className="hero-phone-ui"
                      src="/assets/phonepicture.png"
                      alt="Vantage phone UI"
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HERO COPY */}
          <div className="hero-center">
            <div className="hero-eyebrow" id="eyebrow">
              <span className="eyebrow-dot"></span>
              <span>Now in private beta</span>
            </div>
            <h1 className="hero-headline" id="hero-headline">
              Never Sweat
              <br />A Parlay Alone.
            </h1>
            <p className="hero-sub" id="hero-sub">
              Making Betting Even Better.
            </p>
            <div className="hero-actions" id="hero-actions">
              <a href="#waitlist" className="blob-btn blob-btn--cta">
                Join the Waitlist
                <span className="blob-btn__inner">
                  <span className="blob-btn__blobs">
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                  </span>
                </span>
              </a>
              <span className="hero-count">
                <strong>100+</strong> on the list
              </span>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features">
          <div className="features-sticky">
            {/* Slide 1: Sweat Screen */}
            <div className="feature-slide" id="slide-squad">
              <div className="slide-inner">
                <div className="slide-text">
                  <div className="slide-meta">
                    <span className="slide-count">01 / 02</span>
                    <span className="slide-tag">The Sweat Screen</span>
                  </div>
                  <h2 className="slide-heading">
                    Every play.
                    <br />
                    Word for word.
                    <br />
                    In real time.
                  </h2>
                  <p className="slide-body">
                    Watch your parlay players go off or bust, live.
                    Every bucket, every rush, every strikeout
                    lands the second it happens.
                  </p>
                  <ul className="wl-perks">
                    <li className="perk-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Play by play updates, word for word
                    </li>
                    <li className="perk-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Live prop lines tick by tick
                    </li>
                    <li className="perk-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Squad reacts with you in real time
                    </li>
                  </ul>
                </div>
                <div className="slide-visual">
                  <div className="slide-phone-frame">
                    <div className="slide-phone-notch"></div>
                    <img
                      src="/sweatscreen.png"
                      alt="Sweat screen live play-by-play"
                      className="slide-phone-img"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2: Player Cards */}
            <div className="feature-slide" id="slide-cards">
              <div className="slide-inner">
                <div className="slide-text">
                  <div className="slide-meta">
                    <span className="slide-count">02 / 02</span>
                    <span className="slide-tag">Player Cards</span>
                  </div>
                  <h2 className="slide-heading">
                    Collect every
                    <br />
                    legend.
                  </h2>
                  <p className="slide-body">
                    Place slips to unlock player cards and earn capped XP. Cards are cosmetics only.
                  </p>
                  <ul className="wl-perks">
                    <li className="perk-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Bet on players to unlock their card and earn XP
                    </li>
                    <li className="perk-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Leveling milestones unlock promos: boosts and protected pick rewards
                    </li>
                    <li className="perk-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Progress tracked per season. Card borders reset every season.
                    </li>
                  </ul>
                </div>
                <div className="slide-visual slide-visual--cards">
                  <div className="slide-cards-stack">

                    {/* Diamond — Ant Edwards */}
                    <div className="pc pc--diamond pc--pos-l">
                      <div className="pc-border">
                        <div className="pc-inner">
                          <div className="pc-cf" aria-hidden="true"></div>
                          <div className="pc-bg-logo" aria-hidden="true">V</div>
                          <div className="pc-refract" aria-hidden="true"></div>
                          <div className="pc-img-wrap">
                            <img className="pc-img" src="https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png" alt="Anthony Edwards" />
                          </div>
                          <div className="pc-name">Ant Edwards</div>
                          <div className="pc-tier-lbl">DIAMOND</div>
                          <div className="pc-progress-wrap">
                            <div className="pc-progress-hdr">
                              <span className="pc-next">→ PRISMATIC</span>
                              <span className="pc-pct">58%</span>
                            </div>
                            <div className="pc-bar-bg">
                              <div className="pc-bar-fill" style={{ width: '58%' }}></div>
                            </div>
                          </div>
                          <div className="pc-watermark">VANTAGE COLLECTIBLES</div>
                          <div className="pc-shimmer" aria-hidden="true"></div>
                        </div>
                      </div>
                    </div>

                    {/* Prismatic — Stephen Curry */}
                    <div className="pc pc--prismatic pc--pos-r">
                      <div className="pc-border">
                        <div className="pc-inner">
                          <div className="pc-cf" aria-hidden="true"></div>
                          <div className="pc-bg-logo" aria-hidden="true">V</div>
                          <div className="pc-refract" aria-hidden="true"></div>
                          <div className="pc-img-wrap">
                            <img className="pc-img" src="https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png" alt="Stephen Curry" />
                          </div>
                          <div className="pc-name">Stephen Curry</div>
                          <div className="pc-tier-lbl">PRISMATIC</div>
                          <div className="pc-progress-wrap">
                            <div className="pc-progress-hdr">
                              <span className="pc-next">MAX</span>
                              <span className="pc-pct">42%</span>
                            </div>
                            <div className="pc-bar-bg">
                              <div className="pc-bar-fill" style={{ width: '42%' }}></div>
                            </div>
                          </div>
                          <div className="pc-watermark">VANTAGE COLLECTIBLES</div>
                          <div className="pc-shimmer" aria-hidden="true"></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WAITLIST */}
        <section id="waitlist">
          <div className="orb orb-1" aria-hidden="true"></div>
          <div className="orb orb-2" aria-hidden="true"></div>
          <div className="ed-divider" aria-hidden="true">
            <span className="ed-divider-line" id="ed-line-3"></span>
            <span className="ed-divider-label">Early Access</span>
          </div>
          <div className="waitlist-inner">
            <div className="waitlist-text">
              <h2 className="wl-heading" id="wl-heading">
                Get in before
                <br />
                everyone else.
              </h2>
              <p className="wl-sub">
                Join the waitlist for early beta access and lock in exclusive
                perks before we go live.
              </p>
              <ul className="wl-perks">
                <li className="perk-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Free credits to bet with on launch
                </li>
                <li className="perk-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Squad rooms &amp; exclusive player cards
                </li>
                <li className="perk-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Massive promos &amp; drops every day
                </li>
              </ul>
            </div>
            <div className="waitlist-form-wrap" id="wl-form-wrap">
              <form id="waitlist-form" className="waitlist-form">
                <label className="form-label" htmlFor="email-input">
                  Your email
                </label>
                <div className="form-row">
                  <input
                    type="email"
                    name="email"
                    id="email-input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <button type="submit" className="blob-btn blob-btn--full">
                  Join the Waitlist →
                  <span className="blob-btn__inner">
                    <span className="blob-btn__blobs">
                      <span className="blob-btn__blob"></span>
                      <span className="blob-btn__blob"></span>
                      <span className="blob-btn__blob"></span>
                      <span className="blob-btn__blob"></span>
                    </span>
                  </span>
                </button>
                <p className="form-note">No spam. Unsubscribe anytime.</p>
              </form>
              <div id="form-success" className="form-success" hidden>
                <div className="success-check">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>You&apos;re in.</h3>
                <p>You&apos;re on the list. View your squad room below.</p>
                <a
                  id="view-squad-btn"
                  href="#"
                  className="btn btn-primary"
                  style={{ marginTop: "1rem", display: "inline-block" }}
                >
                  View My Squad →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="footer">
          <div className="footer-inner">
            <p className="footer-copy">
              &copy; 2026 Vantage. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* Basketball hoop animation */}
      <div id="bball-stage" aria-hidden="true">
        <div id="bball-hoop">
          <svg
            id="bball-hoop-svg"
            viewBox="0 0 160 90"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="60"
              y="0"
              width="40"
              height="26"
              rx="3"
              fill="#1a1a1a"
              stroke="#333"
              strokeWidth="1.5"
            />
            <rect
              x="68"
              y="6"
              width="24"
              height="14"
              rx="2"
              fill="none"
              stroke="#c9ab6e"
              strokeWidth="1.2"
              opacity="0.7"
            />
            <line
              x1="80"
              y1="26"
              x2="80"
              y2="34"
              stroke="#555"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <ellipse
              cx="80"
              cy="36"
              rx="28"
              ry="5"
              fill="none"
              stroke="#e05252"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M52,36 Q50,55 58,68 Q64,76 80,78 Q96,76 102,68 Q110,55 108,36"
              fill="none"
              stroke="rgba(240,235,225,0.25)"
              strokeWidth="1"
            />
            <path
              d="M80,36 L75,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M80,36 L85,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M68,37 L65,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M92,37 L95,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M59,38 L62,70"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M101,38 L98,70"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M55,47 Q80,52 105,47"
              fill="none"
              stroke="rgba(240,235,225,0.15)"
              strokeWidth="0.8"
            />
            <path
              d="M57,58 Q80,64 103,58"
              fill="none"
              stroke="rgba(240,235,225,0.15)"
              strokeWidth="0.8"
            />
            <path
              d="M60,68 Q80,73 100,68"
              fill="none"
              stroke="rgba(240,235,225,0.12)"
              strokeWidth="0.8"
            />
          </svg>
        </div>
        <div id="bball-ball">🏀</div>
        <div id="bball-cash-burst"></div>
        <div id="bball-score-text"></div>
      </div>
    </>
  );
}
