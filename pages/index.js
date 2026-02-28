import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const ROOM_CAPACITY = 8;
  const MAX_REFERRALS = ROOM_CAPACITY - 1;

  const router = useRouter();
  const refCode = typeof router.query.ref === "string" ? router.query.ref : "";

  const [inviteData, setInviteData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState("idle"); // idle | joining | joined | error
  const [inviteJoinError, setInviteJoinError] = useState("");

  const fetchInviteData = useCallback(async () => {
    if (!refCode) return;
    setInviteLoading(true);
    setInviteError("");
    try {
      const res = await fetch(`/api/squad/${refCode}`);
      const json = await res.json();
      if (!res.ok) {
        setInviteError(json.error || "Squad not found.");
        setInviteData(null);
        return;
      }
      setInviteData(json);
    } catch {
      setInviteError("Could not load squad room.");
      setInviteData(null);
    } finally {
      setInviteLoading(false);
    }
  }, [refCode]);

  useEffect(() => {
    if (!router.isReady || !refCode) return;
    fetchInviteData();
    const interval = setInterval(fetchInviteData, 4_000);
    return () => clearInterval(interval);
  }, [router.isReady, refCode, fetchInviteData]);

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

  const inviteMembers = inviteData?.members || [];
  const invitePeopleCount = Math.min(ROOM_CAPACITY, 1 + inviteMembers.length);
  const inviteRoomFull = inviteMembers.length >= MAX_REFERRALS;
  const rewardTiers = [2, 4, 6, 8];

  const handleInviteJoin = async (e) => {
    e.preventDefault();
    if (!inviteEmail || inviteStatus === "joining" || !refCode) return;
    if (inviteRoomFull) {
      setInviteJoinError("This squad room is full.");
      setInviteStatus("error");
      return;
    }

    setInviteStatus("joining");
    setInviteJoinError("");

    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, share_code: refCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInviteJoinError(json.error || "Something went wrong.");
        setInviteStatus("error");
        return;
      }

      setInviteStatus("joined");
      fetchInviteData();
    } catch {
      setInviteJoinError("Network error. Please try again.");
      setInviteStatus("error");
    }
  };

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
          <a href="mailto:contact@vantage.com" className="nav-contact blob-btn">
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

        {refCode && (
          <section id="invite-entry">
            <div className="invite-entry-inner">
              <div className="invite-entry-copy">
                <p className="invite-entry-eyebrow">You&apos;re invited</p>
                <h2 className="invite-entry-title">Join this squad room.</h2>
                <p className="invite-entry-sub">
                  Enter your email to claim your spot.
                </p>
                <ul className="invite-entry-perks">
                  <li>Live play-by-play updates</li>
                  <li>Chat reactions and badges</li>
                  <li>XP trivia and instant alerts</li>
                </ul>
              </div>

              <div className="invite-entry-room">
                <div className="invite-room-head">
                  <p className="invite-room-label">Squad</p>
                  <p className="invite-room-count">
                    {invitePeopleCount}/8 people
                  </p>
                </div>
                <div className="invite-reward-row">
                  <span className="invite-reward-left">
                    Rewards at each tier
                  </span>
                  <div className="invite-reward-markers">
                    {rewardTiers.map((tier) => (
                      <span
                        key={tier}
                        className={`invite-reward-marker${invitePeopleCount >= tier ? " unlocked" : ""}`}
                      >
                        {tier}/8
                      </span>
                    ))}
                  </div>
                </div>
                {inviteStatus === "joined" ? (
                  <div className="invite-entry-success">
                    You&apos;re in. Your spot was added to this room.
                  </div>
                ) : (
                  <form
                    className="invite-entry-form"
                    onSubmit={handleInviteJoin}
                  >
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={inviteStatus === "joining" || inviteRoomFull}
                    />
                    <button
                      type="submit"
                      className="blob-btn"
                      disabled={inviteStatus === "joining" || inviteRoomFull}
                    >
                      {inviteStatus === "joining"
                        ? "Joining..."
                        : inviteRoomFull
                          ? "Room Full"
                          : "Join This Squad"}
                      <span className="blob-btn__inner">
                        <span className="blob-btn__blobs">
                          <span className="blob-btn__blob"></span>
                          <span className="blob-btn__blob"></span>
                          <span className="blob-btn__blob"></span>
                          <span className="blob-btn__blob"></span>
                        </span>
                      </span>
                    </button>
                  </form>
                )}
                {inviteJoinError && (
                  <p className="invite-entry-error">{inviteJoinError}</p>
                )}
                {inviteError && (
                  <p className="invite-entry-error">{inviteError}</p>
                )}
                <p className="invite-room-code">Room: {refCode}</p>
              </div>
            </div>
          </section>
        )}

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
            {/* Slide 1: Squad Rooms */}
            <div className="feature-slide" id="slide-squad">
              <div className="slide-inner">
                <div className="slide-text">
                  <div className="slide-meta">
                    <span className="slide-count">01 / 02</span>
                    <span className="slide-tag">Squad Rooms</span>
                  </div>
                  <h2 className="slide-heading">
                    Bet with your
                    <br />
                    crew, not alone.
                  </h2>
                  <p className="slide-body">
                    Place a slip and start a Squad Room. Friends who place the
                    same slip join instantly.
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
                      Live play-by-play updates
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
                      Chat reactions and badges
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
                      XP trivia and instant alerts
                    </li>
                  </ul>
                </div>
                <div className="slide-visual">
                  <div className="slide-phone-frame">
                    <div className="slide-phone-notch"></div>
                    <img
                      src="/assets/phonepicture.png"
                      alt="Squad Room UI"
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
                    Bet on players to unlock their card.
                  </p>
                </div>
                <div className="slide-visual slide-visual--cards">
                  <div className="slide-cards-stack">
                    <img
                      className="slide-card--curry"
                      src="/assets/curry prop.png"
                      alt="Curry card"
                    />
                    <img
                      className="slide-card--lebron"
                      src="/assets/Lebron prop.png"
                      alt="LeBron card"
                    />
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
