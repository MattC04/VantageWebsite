import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

const TIER_ICONS = ['🏅', '🥈', '🥇', '👑'];

export default function SquadPage() {
  const router = useRouter();
  const { share_code, pending, verified } = router.query;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [copied, setCopied]   = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [showResend, setShowResend] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${share_code}`
    : '';

  const fetchSquad = useCallback(async () => {
    if (!share_code) return;
    try {
      const res = await fetch(`/api/squad/${share_code}`);
      if (!res.ok) throw new Error('Squad not found');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [share_code]);

  useEffect(() => {
    fetchSquad();
    // Poll every 15s for real-time-ish updates
    const interval = setInterval(fetchSquad, 15_000);
    return () => clearInterval(interval);
  }, [fetchSquad]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendStatus('sending');
    try {
      const res = await fetch('/api/waitlist/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResendStatus('error');
        setTimeout(() => setResendStatus(null), 4000);
      } else {
        setResendStatus('sent');
      }
    } catch {
      setResendStatus('error');
      setTimeout(() => setResendStatus(null), 4000);
    }
  };

  const isVerified  = data?.owner_status === 'VERIFIED';
  const isPending   = !isVerified;
  const justVerified = verified === '1';

  return (
    <>
      <Head>
        <title>Your Squad — Vantage</title>
        <meta name="description" content="Your Vantage squad room. Share your link and unlock rewards." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="squad-page">
        {/* NAV */}
        <nav className="squad-nav">
          <a href="/" className="squad-nav-logo">
            <img src="/Logo.png" alt="Vantage" onError={(e) => e.target.style.display = 'none'} />
            <span>VANTAGE</span>
          </a>
        </nav>

        <main className="squad-main">

          {/* ── Verify banner (shown while PENDING) ── */}
          {isPending && !loading && !error && (
            <div className="squad-verify-banner">
              <div className="verify-banner-inner">
                <span className="verify-icon">✉️</span>
                <div className="verify-text">
                  <strong>Confirm your email to start earning rewards</strong>
                  <p>We sent a verification link to your inbox. Check spam if you don&apos;t see it.</p>
                </div>
                <button
                  className="verify-resend-toggle"
                  onClick={() => setShowResend((v) => !v)}
                >
                  {showResend ? 'Hide' : 'Resend / change email'}
                </button>
              </div>

              {showResend && (
                <form className="resend-form" onSubmit={handleResend}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                  />
                  <button
                    type="submit"
                    disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                  >
                    {resendStatus === 'sending' ? 'Sending…'
                     : resendStatus === 'sent'    ? '✓ Sent!'
                     : resendStatus === 'error'   ? 'Try again'
                     : 'Send link'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Verified success flash ── */}
          {justVerified && isVerified && (
            <div className="squad-verified-flash">
              <span>🎉</span>
              <strong>Email verified! Your squad is live.</strong>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="squad-loading">
              <div className="squad-spinner"></div>
              <p>Loading your squad…</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="squad-error">
              <p>Squad not found or link is invalid.</p>
              <a href="/" className="btn-back">← Back to waitlist</a>
            </div>
          )}

          {/* ── Main squad content ── */}
          {data && !loading && (
            <div className="squad-content">

              {/* Header */}
              <div className="squad-header">
                <div className="squad-header-eyebrow">
                  <span className="squad-status-dot" data-verified={isVerified}></span>
                  <span>{isVerified ? 'Squad Active' : 'Pending Verification'}</span>
                </div>
                <h1 className="squad-title">Your Squad Room</h1>
                <p className="squad-subtitle">
                  Share your link. Every verified friend unlocks a new tier.
                </p>
              </div>

              {/* Progress bar */}
              <div className="squad-progress-wrap">
                <div className="squad-progress-labels">
                  <span>Verified invites</span>
                  <span className="squad-progress-count">
                    <strong>{data.verified_count}</strong> / 8
                  </span>
                </div>
                <div className="squad-progress-track">
                  <div
                    className="squad-progress-fill"
                    style={{ width: `${Math.min((data.verified_count / 8) * 100, 100)}%` }}
                  ></div>
                  {[2, 4, 6, 8].map((n) => (
                    <div
                      key={n}
                      className="squad-progress-marker"
                      style={{ left: `${(n / 8) * 100}%` }}
                      data-reached={data.verified_count >= n}
                    ></div>
                  ))}
                </div>
                {data.activated_count > 0 && (
                  <p className="squad-activated-note">
                    {data.activated_count} / 8 activated after launch — required for reward payout
                  </p>
                )}
              </div>

              {/* Share link */}
              <div className="squad-share-wrap">
                <p className="squad-share-label">Your share link</p>
                <div className="squad-share-row">
                  <div className="squad-share-url">{shareUrl}</div>
                  <button
                    className={`squad-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? '✓ Copied!' : 'Copy link'}
                  </button>
                </div>
                <p className="squad-share-note">
                  Invites only count after the invitee verifies their email.
                  Rewards paid out once invited friends create an app account after launch.
                  Fraudulent or duplicate referrals may be disqualified.
                </p>
              </div>

              {/* Tier cards */}
              <div className="squad-tiers">
                <h2 className="squad-tiers-heading">Reward Tiers</h2>
                <div className="squad-tiers-grid">
                  {(data.tiers || []).map((tier) => {
                    const reached   = data.verified_count >= tier.required_verified;
                    const unlocked  = tier.status === 'UNLOCKED' || tier.status === 'PAYABLE' || tier.status === 'PAID';
                    const payable   = tier.status === 'PAYABLE' || tier.status === 'PAID';
                    const locked    = !unlocked || isPending;

                    return (
                      <div
                        key={tier.tier_number}
                        className={`squad-tier-card ${unlocked && isVerified ? 'unlocked' : 'locked'} ${payable ? 'payable' : ''}`}
                      >
                        <div className="tier-card-header">
                          <span className="tier-icon">{TIER_ICONS[tier.tier_number - 1]}</span>
                          <span className="tier-number">Tier {tier.tier_number}</span>
                          <span className="tier-req">{tier.required_verified} verified invites</span>
                        </div>
                        <div className="tier-card-body">
                          <h3 className="tier-title">{tier.reward_title}</h3>
                          <p className="tier-desc">{tier.reward_description}</p>
                        </div>
                        <div className="tier-card-status">
                          {locked ? (
                            <span className="tier-locked">
                              🔒 {isPending ? 'Verify email first' : `Need ${tier.required_verified - data.verified_count} more`}
                            </span>
                          ) : payable ? (
                            <span className="tier-payable">✅ Ready to claim at launch</span>
                          ) : (
                            <span className="tier-unlocked">🔓 Unlocked — activate at launch</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fine print */}
              <div className="squad-fine-print">
                <p>
                  Rewards are paid after launch once invited friends create an account in the app.
                  Fraudulent, self-referral, or duplicate referrals will be disqualified.
                </p>
              </div>

            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .squad-page {
          min-height: 100vh;
          background: #070707;
          color: #f0ebe1;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }

        /* NAV */
        .squad-nav {
          display: flex;
          align-items: center;
          padding: 0 2.5rem;
          height: 64px;
          border-bottom: 1px solid #191919;
          position: sticky;
          top: 0;
          background: rgba(7,7,7,0.92);
          backdrop-filter: blur(20px);
          z-index: 100;
        }
        .squad-nav-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          color: #f0ebe1;
        }
        .squad-nav-logo img {
          height: 36px;
          width: auto;
        }
        .squad-nav-logo span {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.2rem;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        /* VERIFY BANNER */
        .squad-verify-banner {
          background: rgba(201,171,110,0.06);
          border: 1px solid rgba(201,171,110,0.2);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
        }
        .verify-banner-inner {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .verify-icon { font-size: 1.4rem; flex-shrink: 0; margin-top: 2px; }
        .verify-text { flex: 1; min-width: 200px; }
        .verify-text strong { color: #c9ab6e; display: block; margin-bottom: 0.25rem; }
        .verify-text p { font-size: 0.85rem; color: #8a8278; margin: 0; }
        .verify-resend-toggle {
          background: transparent;
          border: 1px solid rgba(201,171,110,0.3);
          border-radius: 6px;
          color: #c9ab6e;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.4rem 0.9rem;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.2s, background 0.2s;
        }
        .verify-resend-toggle:hover { background: rgba(201,171,110,0.08); border-color: rgba(201,171,110,0.5); }
        .resend-form {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        .resend-form input {
          flex: 1;
          min-width: 200px;
          background: #111;
          border: 1px solid #232323;
          border-radius: 6px;
          padding: 0.65rem 1rem;
          font-family: inherit;
          font-size: 0.9rem;
          color: #f0ebe1;
          outline: none;
        }
        .resend-form input:focus { border-color: #c9ab6e; }
        .resend-form button {
          background: #c9ab6e;
          color: #070707;
          border: none;
          border-radius: 6px;
          padding: 0.65rem 1.25rem;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .resend-form button:disabled { opacity: 0.6; cursor: not-allowed; }

        /* VERIFIED FLASH */
        .squad-verified-flash {
          background: rgba(62,207,142,0.08);
          border: 1px solid rgba(62,207,142,0.25);
          border-radius: 10px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }
        .squad-verified-flash strong { color: #3ecf8e; }

        /* LOADING */
        .squad-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 4rem 0;
          color: #8a8278;
        }
        .squad-spinner {
          width: 36px;
          height: 36px;
          border: 2px solid #191919;
          border-top-color: #c9ab6e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ERROR */
        .squad-error {
          text-align: center;
          padding: 4rem 0;
          color: #8a8278;
        }
        .btn-back {
          display: inline-block;
          margin-top: 1rem;
          color: #c9ab6e;
          text-decoration: none;
          font-size: 0.9rem;
        }

        /* MAIN */
        .squad-main {
          max-width: 720px;
          margin: 0 auto;
          padding: 3rem 2rem 5rem;
        }

        /* HEADER */
        .squad-header {
          margin-bottom: 2.5rem;
          text-align: center;
        }
        .squad-header-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a8278;
          margin-bottom: 0.75rem;
        }
        .squad-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3a3632;
        }
        .squad-status-dot[data-verified='true'] {
          background: #3ecf8e;
          box-shadow: 0 0 8px rgba(62,207,142,0.6);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.6); }
        }
        .squad-title {
          font-size: clamp(2.2rem, 6vw, 3.8rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1;
          background: linear-gradient(135deg, #f0ebe1 0%, #c9ab6e 45%, #ff6b35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
        }
        .squad-subtitle {
          font-size: 0.95rem;
          color: #8a8278;
        }

        /* PROGRESS BAR */
        .squad-progress-wrap {
          background: #0e0e0e;
          border: 1px solid #191919;
          border-radius: 14px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .squad-progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: #8a8278;
          margin-bottom: 0.75rem;
        }
        .squad-progress-count { color: #f0ebe1; }
        .squad-progress-count strong { color: #c9ab6e; font-size: 1.1rem; }
        .squad-progress-track {
          position: relative;
          height: 6px;
          background: #1a1a1a;
          border-radius: 999px;
          overflow: visible;
        }
        .squad-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #c9ab6e, #ff6b35);
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
          min-width: 0;
        }
        .squad-progress-marker {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #2c2c2c;
          transition: border-color 0.3s, background 0.3s;
        }
        .squad-progress-marker[data-reached='true'] {
          background: #c9ab6e;
          border-color: #c9ab6e;
          box-shadow: 0 0 8px rgba(201,171,110,0.6);
        }
        .squad-activated-note {
          font-size: 0.75rem;
          color: #3a3632;
          margin-top: 0.75rem;
          text-align: center;
        }

        /* SHARE LINK */
        .squad-share-wrap {
          background: #0e0e0e;
          border: 1px solid #191919;
          border-radius: 14px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .squad-share-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8a8278;
          margin-bottom: 0.75rem;
        }
        .squad-share-row {
          display: flex;
          gap: 0.75rem;
          align-items: stretch;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .squad-share-url {
          flex: 1;
          min-width: 0;
          background: #111;
          border: 1px solid #232323;
          border-radius: 8px;
          padding: 0.7rem 1rem;
          font-size: 0.82rem;
          color: #c9ab6e;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'Courier New', monospace;
        }
        .squad-copy-btn {
          background: #c9ab6e;
          color: #070707;
          border: none;
          border-radius: 8px;
          padding: 0.7rem 1.25rem;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s;
          flex-shrink: 0;
        }
        .squad-copy-btn:hover { background: #d4bc82; }
        .squad-copy-btn:active { transform: scale(0.97); }
        .squad-copy-btn.copied { background: #3ecf8e; color: #070707; }
        .squad-share-note {
          font-size: 0.72rem;
          color: #3a3632;
          line-height: 1.6;
          margin: 0;
        }

        /* TIERS */
        .squad-tiers { margin-bottom: 2rem; }
        .squad-tiers-heading {
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #8a8278;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .squad-tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        .squad-tier-card {
          background: #0e0e0e;
          border: 1px solid #191919;
          border-radius: 14px;
          padding: 1.25rem;
          transition: border-color 0.3s;
          position: relative;
          overflow: hidden;
        }
        .squad-tier-card.unlocked {
          border-color: rgba(201,171,110,0.35);
          background: linear-gradient(145deg, #111008, #0e0e0e);
        }
        .squad-tier-card.unlocked::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(201,171,110,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .squad-tier-card.payable {
          border-color: rgba(62,207,142,0.4);
        }
        .squad-tier-card.locked {
          opacity: 0.55;
        }
        .tier-card-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.75rem;
        }
        .tier-icon { font-size: 1.2rem; }
        .tier-number {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c9ab6e;
        }
        .tier-req {
          font-size: 0.68rem;
          color: #3a3632;
          margin-left: auto;
        }
        .tier-title {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f0ebe1;
          margin-bottom: 0.35rem;
        }
        .tier-desc {
          font-size: 0.82rem;
          color: #8a8278;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        .tier-card-status { font-size: 0.78rem; }
        .tier-locked  { color: #3a3632; }
        .tier-unlocked { color: #c9ab6e; }
        .tier-payable  { color: #3ecf8e; }

        /* FINE PRINT */
        .squad-fine-print {
          font-size: 0.72rem;
          color: #2c2c24;
          line-height: 1.7;
          text-align: center;
          padding: 1.5rem 0 0;
          border-top: 1px solid #0e0e0e;
        }

        /* RESPONSIVE */
        @media (max-width: 600px) {
          .squad-main { padding: 2rem 1.2rem 4rem; }
          .squad-tiers-grid { grid-template-columns: 1fr; }
          .squad-share-row { flex-direction: column; }
          .squad-copy-btn { width: 100%; }
        }
      `}</style>
    </>
  );
}
