import Head from 'next/head';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';

// How many avatar slots to show in the room panel
const SLOT_COUNT = 4;
// Tiers require [2, 4, 6, 8] verified invites — first 4 fill the visible avatar slots
const TIER_THRESHOLDS = [2, 4, 6, 8];

export default function SquadPage() {
  const router = useRouter();
  const { share_code, pending, verified } = router.query;

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [copied, setCopied]     = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');

  // Edit address state
  const [editOpen, setEditOpen]       = useState(false);
  const [editEmail, setEditEmail]     = useState('');
  const [editStatus, setEditStatus]   = useState(null); // null | 'saving' | 'sent' | 'error'
  const [editError, setEditError]     = useState('');
  const editInputRef = useRef(null);

  const shareUrl = typeof window !== 'undefined' && share_code
    ? `${window.location.origin}/?ref=${share_code}`
    : '';

  // Pull email from localStorage (set at join time)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('vantage_email');
    if (stored) setOwnerEmail(stored);
  }, []);

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
    const interval = setInterval(fetchSquad, 15_000);
    return () => clearInterval(interval);
  }, [fetchSquad]);

  useEffect(() => {
    if (editOpen && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editOpen]);

  const handleShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Vantage',
          text: 'I\'m on the Vantage waitlist — the best sports betting platform coming soon. Join through my link:',
          url: shareUrl,
        });
        return;
      } catch { /* user cancelled or not supported */ }
    }
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editEmail || editStatus === 'saving') return;
    setEditStatus('saving');
    setEditError('');
    try {
      const res = await fetch('/api/waitlist/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_code, new_email: editEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error || 'Something went wrong.');
        setEditStatus('error');
        return;
      }
      // Save new email locally, update UI
      localStorage.setItem('vantage_email', editEmail.toLowerCase().trim());
      setOwnerEmail(editEmail.toLowerCase().trim());
      setEditStatus('sent');
      // Close after a moment
      setTimeout(() => {
        setEditOpen(false);
        setEditStatus(null);
        setEditEmail('');
        // Redirect to new squad page if share code changed
        if (json.new_share_code && json.new_share_code !== share_code) {
          router.replace(`/squad/${json.new_share_code}?pending=1`);
        }
      }, 1500);
    } catch {
      setEditError('Network error. Please try again.');
      setEditStatus('error');
    }
  };

  const isVerified   = data?.owner_status === 'VERIFIED';
  const justVerified = verified === '1';
  const verifiedCount = data?.verified_count || 0;

  // Mask email: show first 2 chars + domain
  const maskedEmail = ownerEmail
    ? (() => {
        const [local, domain] = ownerEmail.split('@');
        if (!domain) return ownerEmail;
        const visible = local.slice(0, 2);
        const masked  = '*'.repeat(Math.max(0, local.length - 2));
        return `${visible}${masked}@${domain}`;
      })()
    : null;

  // Build the 4 avatar slots — fills based on how many people have joined
  // We show slots 1–4 as "filled" when verified_count reaches their tier thresholds
  // Slot fill is proportional: slot N is "full" when verifiedCount >= TIER_THRESHOLDS[N-1]
  const slots = TIER_THRESHOLDS.map((threshold, i) => {
    const fraction = Math.min(verifiedCount / threshold, 1);
    const full = verifiedCount >= threshold;
    return { index: i, threshold, fraction, full };
  });

  return (
    <>
      <Head>
        <title>Your Squad — Vantage</title>
        <meta name="description" content="Your Vantage squad room. Share your link and earn rewards." />
        <meta name="robots" content="noindex" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page">

        {/* NAV */}
        <nav className="nav">
          <a href="/" className="nav-logo">
            <img src="/Logo.png" alt="Vantage" onError={(e) => { e.target.style.display = 'none'; }} />
            <span>VANTAGE</span>
          </a>
        </nav>

        {/* LOADING */}
        {loading && (
          <div className="center-screen">
            <div className="spinner"></div>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="center-screen">
            <p className="error-msg">Squad not found or link is invalid.</p>
            <a href="/" className="back-link">← Back to waitlist</a>
          </div>
        )}

        {/* CONTENT */}
        {data && !loading && (
          <main className="main">

            {/* ── LEFT COLUMN ── */}
            <div className="col-left">

              {/* Eyebrow */}
              <p className="eyebrow">
                {isVerified ? (
                  <><span className="dot dot-green"></span>Squad Active</>
                ) : (
                  <><span className="dot dot-amber"></span>Check your email</>
                )}
              </p>

              {/* Headline */}
              <h1 className="headline">You&apos;re IN.</h1>

              {/* Sub */}
              <p className="sub">
                {isVerified
                  ? 'Your email is confirmed. Share your link to earn rewards.'
                  : 'Check your email to confirm your spot and unlock your squad link.'}
              </p>

              {/* Verified flash */}
              {justVerified && isVerified && (
                <div className="verified-flash">
                  Email verified — your squad is live.
                </div>
              )}

              {/* Blurb */}
              <p className="blurb">
                Refer friends to climb the tiers. Every 2 verified invites unlocks the next reward —
                free credits, exclusive player cards, squad bonuses, and more. The more you share,
                the bigger your edge on launch day.
              </p>

              {/* Perks list */}
              <ul className="perks">
                <li><span className="perk-check">✓</span> Free credits to bet with on launch</li>
                <li><span className="perk-check">✓</span> Exclusive player cards &amp; squad rooms</li>
                <li><span className="perk-check">✓</span> Massive daily promos &amp; drops</li>
              </ul>

              {/* Share button */}
              <button className="btn-share" onClick={handleShare}>
                {copied ? '✓ Link Copied!' : 'Share Invite'}
              </button>

              {/* Share URL display (desktop fallback) */}
              <div className="share-url-wrap">
                <span className="share-url-text">{shareUrl}</span>
              </div>

              {/* Fine print */}
              <p className="fine-print">
                Invites only count after the invitee verifies their email.
                Fraudulent or duplicate referrals may be disqualified.
              </p>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="col-right">
              <div className="room-panel">

                {/* Room header */}
                <div className="room-header">
                  <div className="room-title-wrap">
                    <p className="room-label">YOUR ROOM</p>
                    <h2 className="room-title">
                      {maskedEmail
                        ? <>{maskedEmail.split('@')[0]}<span className="room-at">@{maskedEmail.split('@')[1]}</span></>
                        : <span className="room-title-placeholder">your squad</span>
                      }
                    </h2>
                  </div>

                  {/* Edit address button */}
                  {!editOpen && (
                    <button className="btn-edit" onClick={() => { setEditOpen(true); setEditError(''); setEditStatus(null); }}>
                      Edit address
                    </button>
                  )}
                </div>

                {/* Edit address form */}
                {editOpen && (
                  <form className="edit-form" onSubmit={handleEditSave}>
                    <p className="edit-note">
                      Changing your email deletes the old entry and creates a new verification link.
                    </p>
                    <input
                      ref={editInputRef}
                      type="email"
                      className="edit-input"
                      placeholder="new@email.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      disabled={editStatus === 'saving' || editStatus === 'sent'}
                    />
                    <div className="edit-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => { setEditOpen(false); setEditEmail(''); setEditStatus(null); setEditError(''); }}
                        disabled={editStatus === 'saving'}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-save"
                        disabled={editStatus === 'saving' || editStatus === 'sent'}
                      >
                        {editStatus === 'saving' ? 'Saving…'
                          : editStatus === 'sent' ? '✓ Check email!'
                          : 'Save & resend link'}
                      </button>
                    </div>
                    {editError && <p className="edit-error">{editError}</p>}
                  </form>
                )}

                {/* Avatar circles */}
                <div className="avatars-grid">
                  {slots.map((slot) => (
                    <div key={slot.index} className="avatar-wrap">
                      <div
                        className={`avatar ${slot.full ? 'avatar-full' : slot.fraction > 0 ? 'avatar-partial' : ''}`}
                        style={{ '--fill': `${Math.round(slot.fraction * 100)}%` }}
                      >
                        <svg className="avatar-ring" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Background track */}
                          <circle
                            cx="30" cy="30" r="26"
                            stroke="#1e1a10"
                            strokeWidth="3"
                            fill="none"
                          />
                          {/* Filled arc — using stroke-dasharray trick */}
                          <circle
                            cx="30" cy="30" r="26"
                            stroke={slot.full ? '#f0d080' : '#c9a84c'}
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${Math.round(slot.fraction * 163.4)} 163.4`}
                            transform="rotate(-90 30 30)"
                            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                            opacity={slot.fraction > 0 ? 1 : 0}
                          />
                        </svg>
                        {/* Person icon inside */}
                        <div className={`avatar-inner ${slot.full ? 'avatar-inner-full' : ''}`}>
                          {slot.full ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="7" r="4" fill={slot.full ? '#f0d080' : '#5a5040'}/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={slot.full ? '#f0d080' : '#5a5040'} strokeWidth="2" strokeLinecap="round" fill="none"/>
                            </svg>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity="0.3">
                              <circle cx="12" cy="7" r="4" fill="#5a5040"/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#5a5040" strokeWidth="2" strokeLinecap="round" fill="none"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="avatar-label">
                        {slot.full ? (
                          <span className="label-unlocked">Tier {slot.index + 1} ✓</span>
                        ) : (
                          <span className="label-need">{slot.threshold} invites</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Progress count */}
                <div className="progress-row">
                  <span className="progress-label">Verified invites</span>
                  <span className="progress-count">
                    <strong>{verifiedCount}</strong>
                    <span> / 8</span>
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min((verifiedCount / 8) * 100, 100)}%` }}
                  ></div>
                </div>

              </div>
            </div>

          </main>
        )}

      </div>

      <style jsx>{`
        /* ── BASE ── */
        .page {
          min-height: 100vh;
          background: #070707;
          color: #f0ebe1;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }

        /* ── NAV ── */
        .nav {
          display: flex;
          align-items: center;
          padding: 0 2.5rem;
          height: 64px;
          border-bottom: 1px solid #141414;
          position: sticky;
          top: 0;
          background: rgba(7,7,7,0.92);
          backdrop-filter: blur(20px);
          z-index: 100;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          color: #f0ebe1;
        }
        .nav-logo img { height: 34px; width: auto; }
        .nav-logo span {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.2rem;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        /* ── CENTER SCREEN (loading/error) ── */
        .center-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 64px);
          gap: 1rem;
          color: #5a5040;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 2px solid #1a1a1a;
          border-top-color: #c9a84c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-msg { font-size: 0.95rem; color: #5a5040; }
        .back-link { color: #c9a84c; font-size: 0.85rem; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }

        /* ── MAIN TWO-COLUMN LAYOUT ── */
        .main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          max-width: 1080px;
          margin: 0 auto;
          padding: 5rem 2.5rem 6rem;
          align-items: start;
        }

        /* ── LEFT COLUMN ── */
        .col-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5a5040;
          margin-bottom: 1.2rem;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dot-green {
          background: #3ecf8e;
          box-shadow: 0 0 8px rgba(62,207,142,0.6);
          animation: pulse 2s ease-in-out infinite;
        }
        .dot-amber {
          background: #c9a84c;
          box-shadow: 0 0 8px rgba(201,168,76,0.5);
          animation: pulse 2.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.65); }
        }

        .headline {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(3.5rem, 8vw, 6.5rem);
          font-weight: 900;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          line-height: 0.92;
          color: #f5f0e8;
          margin: 0 0 1.2rem;
        }

        .sub {
          font-size: 1rem;
          color: #8a8278;
          line-height: 1.6;
          margin: 0 0 1.25rem;
          max-width: 380px;
        }

        .verified-flash {
          display: inline-block;
          background: rgba(62,207,142,0.1);
          border: 1px solid rgba(62,207,142,0.25);
          border-radius: 8px;
          padding: 0.55rem 1rem;
          font-size: 0.82rem;
          color: #3ecf8e;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }

        .blurb {
          font-size: 0.88rem;
          color: #6a6258;
          line-height: 1.75;
          margin: 0 0 1.25rem;
          max-width: 400px;
        }

        .perks {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .perks li {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.88rem;
          color: #c8c0ac;
          font-weight: 500;
        }
        .perk-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.3);
          font-size: 10px;
          color: #c9a84c;
          flex-shrink: 0;
        }

        .btn-share {
          background: #c9a84c;
          color: #070707;
          border: none;
          border-radius: 10px;
          padding: 0.9rem 2.2rem;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          margin-bottom: 1rem;
        }
        .btn-share:hover { background: #d4bc82; }
        .btn-share:active { transform: scale(0.97); }

        .share-url-wrap {
          background: #0d0d0d;
          border: 1px solid #1e1a10;
          border-radius: 8px;
          padding: 0.6rem 1rem;
          margin-bottom: 1.5rem;
          max-width: 100%;
          overflow: hidden;
        }
        .share-url-text {
          font-family: 'Courier New', monospace;
          font-size: 0.78rem;
          color: #c9a84c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        .fine-print {
          font-size: 0.7rem;
          color: #2c2820;
          line-height: 1.7;
          margin: 0;
          max-width: 380px;
        }

        /* ── RIGHT COLUMN ── */
        .col-right {
          position: sticky;
          top: 84px;
        }

        .room-panel {
          background: linear-gradient(160deg, #0e0c08 0%, #0a0907 100%);
          border: 1px solid #f0d08040;
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 0 60px rgba(240,208,128,0.04);
        }

        /* Room header */
        .room-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .room-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #3a3020;
          text-transform: uppercase;
          margin: 0 0 0.3rem;
        }
        .room-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          color: #f0d080;
          text-transform: uppercase;
          margin: 0;
          line-height: 1;
          word-break: break-all;
        }
        .room-at { color: #a08030; }
        .room-title-placeholder {
          color: #3a3020;
          font-style: italic;
          font-weight: 400;
          text-transform: none;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          letter-spacing: 0;
        }

        .btn-edit {
          background: transparent;
          border: 1px solid #2a2416;
          border-radius: 6px;
          color: #5a5040;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.4rem 0.85rem;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: border-color 0.2s, color 0.2s;
          margin-top: 0.2rem;
        }
        .btn-edit:hover { border-color: #4a4030; color: #c9a84c; }

        /* Edit form */
        .edit-form {
          background: #0a0907;
          border: 1px solid #1e1a10;
          border-radius: 12px;
          padding: 1.1rem 1.1rem 1rem;
          margin-bottom: 1.5rem;
        }
        .edit-note {
          font-size: 0.75rem;
          color: #5a5040;
          line-height: 1.6;
          margin: 0 0 0.85rem;
        }
        .edit-input {
          width: 100%;
          background: #111008;
          border: 1px solid #2a2416;
          border-radius: 8px;
          padding: 0.65rem 0.9rem;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.88rem;
          color: #f0ebe1;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 0.75rem;
          transition: border-color 0.2s;
        }
        .edit-input:focus { border-color: #c9a84c; }
        .edit-actions {
          display: flex;
          gap: 0.6rem;
        }
        .btn-cancel {
          flex: 1;
          background: transparent;
          border: 1px solid #2a2416;
          border-radius: 7px;
          color: #5a5040;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.6rem;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-cancel:hover { border-color: #4a4030; color: #8a8278; }
        .btn-save {
          flex: 2;
          background: #c9a84c;
          border: none;
          border-radius: 7px;
          color: #070707;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.6rem;
          cursor: pointer;
          transition: opacity 0.2s, background 0.2s;
        }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-save:not(:disabled):hover { background: #d4bc82; }
        .edit-error {
          font-size: 0.75rem;
          color: #e05050;
          margin: 0.6rem 0 0;
        }

        /* Avatar grid */
        .avatars-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .avatar-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
        }
        .avatar {
          position: relative;
          width: 60px;
          height: 60px;
        }
        .avatar-ring {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .avatar-inner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #111008;
        }
        .avatar-inner-full {
          background: rgba(240,208,128,0.06);
        }
        .avatar-label {
          font-size: 0.62rem;
          font-weight: 600;
          text-align: center;
          margin: 0;
          letter-spacing: 0.03em;
        }
        .label-unlocked { color: #c9a84c; }
        .label-need { color: #2a2416; }

        /* Progress bar */
        .progress-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
        }
        .progress-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #3a3020;
        }
        .progress-count {
          font-size: 0.82rem;
          color: #8a8278;
        }
        .progress-count strong {
          color: #c9a84c;
          font-size: 1rem;
        }
        .progress-track {
          height: 5px;
          background: #1a1510;
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #c9a84c, #f0d080);
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
          min-width: 0;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .main {
            grid-template-columns: 1fr;
            padding: 3rem 1.5rem 5rem;
            gap: 2.5rem;
          }
          .col-right { position: static; }
          .headline { font-size: clamp(3rem, 12vw, 5rem); }
          .avatars-grid { gap: 0.75rem; }
          .avatar { width: 54px; height: 54px; }
        }

        @media (max-width: 400px) {
          .nav { padding: 0 1.2rem; }
          .avatars-grid { gap: 0.4rem; }
          .avatar { width: 48px; height: 48px; }
        }
      `}</style>
    </>
  );
}
