import Head from "next/head";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";

export default function SquadPage() {
  const ROOM_CAPACITY = 8;
  const MAX_REFERRALS = ROOM_CAPACITY - 1;

  const router = useRouter();
  const { share_code } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  // Owner edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState(null);
  const [editError, setEditError] = useState("");
  const editInputRef = useRef(null);

  // Member edit state: { [memberId]: { open, email, status, error } }
  const [memberEdit, setMemberEdit] = useState({});

  // Join squad form state
  const [joinEmail, setJoinEmail] = useState("");
  const [joinStatus, setJoinStatus] = useState(null); // null | 'joining' | 'joined' | 'error'
  const [joinError, setJoinError] = useState("");
  const [joinedEmail, setJoinedEmail] = useState(""); // email of the person who just joined, for "You" badge

  const shareUrl =
    typeof window !== "undefined" && share_code
      ? `${window.location.origin}/?ref=${share_code}`
      : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("vantage_email");
    if (stored) setOwnerEmail(stored);
    const storedCode = localStorage.getItem("vantage_share_code");
    if (storedCode && share_code && storedCode === share_code) setIsOwner(true);
  }, [share_code]);

  const fetchSquad = useCallback(async () => {
    if (!share_code) return;
    try {
      const res = await fetch(`/api/squad/${share_code}`);
      if (!res.ok) throw new Error("Squad not found");
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
    const interval = setInterval(fetchSquad, 4_000);
    return () => clearInterval(interval);
  }, [fetchSquad]);

  useEffect(() => {
    if (editOpen && editInputRef.current) editInputRef.current.focus();
  }, [editOpen]);

  const handleShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Vantage",
          text: "I'm on the Vantage waitlist — the best sports betting platform coming soon. Join through my link:",
          url: shareUrl,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleOwnerEditSave = async (e) => {
    e.preventDefault();
    if (!editEmail || editStatus === "saving") return;
    setEditStatus("saving");
    setEditError("");
    try {
      const res = await fetch("/api/waitlist/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_code, new_email: editEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error || "Something went wrong.");
        setEditStatus("error");
        return;
      }
      localStorage.setItem("vantage_email", editEmail.toLowerCase().trim());
      setOwnerEmail(editEmail.toLowerCase().trim());
      setEditStatus("sent");
      setTimeout(() => {
        setEditOpen(false);
        setEditStatus(null);
        setEditEmail("");
        if (json.new_share_code && json.new_share_code !== share_code) {
          router.replace(`/squad/${json.new_share_code}`);
        }
      }, 1500);
    } catch {
      setEditError("Network error. Please try again.");
      setEditStatus("error");
    }
  };

  const openMemberEdit = (memberId) => {
    setMemberEdit((prev) => ({
      ...prev,
      [memberId]: { open: true, email: "", status: null, error: "" },
    }));
  };

  const closeMemberEdit = (memberId) => {
    setMemberEdit((prev) => ({
      ...prev,
      [memberId]: { open: false, email: "", status: null, error: "" },
    }));
  };

  const handleMemberEmailChange = (memberId, val) => {
    setMemberEdit((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], email: val },
    }));
  };

  const handleMemberEditSave = async (e, memberId) => {
    e.preventDefault();
    const state = memberEdit[memberId] || {};
    if (!state.email || state.status === "saving") return;
    setMemberEdit((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], status: "saving", error: "" },
    }));
    try {
      const res = await fetch("/api/waitlist/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_code,
          new_email: state.email,
          member_id: memberId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMemberEdit((prev) => ({
          ...prev,
          [memberId]: {
            ...prev[memberId],
            status: "error",
            error: json.error || "Something went wrong.",
          },
        }));
        return;
      }
      setMemberEdit((prev) => ({
        ...prev,
        [memberId]: { ...prev[memberId], status: "sent" },
      }));
      setTimeout(() => {
        closeMemberEdit(memberId);
        fetchSquad();
      }, 1500);
    } catch {
      setMemberEdit((prev) => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          status: "error",
          error: "Network error.",
        },
      }));
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await fetch("/api/squad/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_share_code: share_code,
          member_id: memberId,
        }),
      });
      fetchSquad();
    } catch {
      /* silent */
    }
  };

  const handleJoinSquad = async (e) => {
    e.preventDefault();
    if (!joinEmail || joinStatus === "joining") return;
    if ((data?.members?.length || 0) >= MAX_REFERRALS) {
      setJoinError("This squad room is full.");
      setJoinStatus("error");
      return;
    }
    setJoinStatus("joining");
    setJoinError("");
    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: joinEmail, share_code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setJoinError(json.error || "Something went wrong.");
        setJoinStatus("error");
        return;
      }
      const normalizedJoin = joinEmail.toLowerCase().trim();
      try {
        localStorage.setItem("vantage_email", normalizedJoin);
      } catch {}
      setJoinedEmail(normalizedJoin);
      setJoinStatus("joined");
      // Optimistically add member to list so it appears immediately
      setData((prev) => {
        if (!prev) return prev;
        const alreadyIn = prev.members.some(
          (m) => m.email.toLowerCase() === normalizedJoin,
        );
        if (alreadyIn) return prev;
        return {
          ...prev,
          members: [
            ...prev.members,
            {
              id: `optimistic-${Date.now()}`,
              email: normalizedJoin,
              joined_at: new Date().toISOString(),
            },
          ],
        };
      });
      fetchSquad();
    } catch {
      setJoinError("Network error. Please try again.");
      setJoinStatus("error");
    }
  };

  const maskEmail = (email) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.slice(0, 2);
    const masked = "*".repeat(Math.max(0, local.length - 2));
    return `${visible}${masked}@${domain}`;
  };

  const maskedOwner = ownerEmail ? maskEmail(ownerEmail) : null;
  const members = data?.members || [];
  const peopleCount = Math.min(ROOM_CAPACITY, 1 + members.length);
  const isRoomFull = members.length >= MAX_REFERRALS;
  const rewardTiers = [2, 4, 6, 8];

  return (
    <>
      <Head>
        <title>Your Squad — Vantage</title>
        <meta
          name="description"
          content="You're on the Vantage waitlist. Share your link."
        />
        <meta name="robots" content="noindex" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page">
        <nav className="nav">
          <a href="/" className="nav-logo">
            <img
              src="/Logo.png"
              alt="Vantage"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span>VANTAGE</span>
          </a>
        </nav>

        {loading && (
          <div className="center-screen">
            <div className="spinner"></div>
          </div>
        )}

        {error && !loading && (
          <div className="center-screen">
            <p className="error-msg">Squad not found or link is invalid.</p>
            <a href="/" className="back-link">
              ← Back to waitlist
            </a>
          </div>
        )}

        {data && !loading && (
          <main className="main">
            {/* LEFT */}
            <div className="col-left">
              <p className="eyebrow">
                <span className="dot dot-green"></span>You&apos;re on the list
              </p>
              <h1 className="headline">You&apos;re IN.</h1>
              <p className="sub">Share your link to fill your squad.</p>

              <ul className="perks">
                <li>
                  <span className="perk-check">✓</span> Free credits to bet with
                  on launch
                </li>
                <li>
                  <span className="perk-check">✓</span> Exclusive player cards
                  &amp; squad rooms
                </li>
                <li>
                  <span className="perk-check">✓</span> Massive daily promos
                  &amp; drops
                </li>
              </ul>

              <button className="btn-share" onClick={handleShare}>
                {copied ? "✓ Link Copied!" : "Join the Waitlist"}
              </button>

              <div className="share-url-wrap">
                <button
                  type="button"
                  className="copy-link-btn"
                  onClick={handleCopyLink}
                  aria-label={copied ? "Link copied" : "Copy invite link"}
                  title={copied ? "Link copied" : "Copy invite link"}
                >
                  {copied ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <rect x="4" y="4" width="11" height="11" rx="2" />
                    </svg>
                  )}
                </button>
                <span className="share-url-text">{shareUrl}</span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-right">
              <div className="room-panel">
                {/* Owner header */}
                <div className="room-header">
                  <div className="room-title-wrap">
                    <p className="room-label">YOUR SPOT</p>
                    <h2 className="room-title">
                      {maskedOwner ? (
                        <>
                          {maskedOwner.split("@")[0]}
                          <span className="room-at">
                            @{maskedOwner.split("@")[1]}
                          </span>
                        </>
                      ) : (
                        <span className="room-title-placeholder">
                          your spot
                        </span>
                      )}
                    </h2>
                  </div>
                  {!editOpen && (
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setEditOpen(true);
                        setEditError("");
                        setEditStatus(null);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* Owner edit form */}
                {editOpen && (
                  <form className="edit-form" onSubmit={handleOwnerEditSave}>
                    <p className="edit-note">Update your email address.</p>
                    <input
                      ref={editInputRef}
                      type="email"
                      className="edit-input"
                      placeholder="new@email.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      disabled={
                        editStatus === "saving" || editStatus === "sent"
                      }
                    />
                    <div className="edit-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setEditOpen(false);
                          setEditEmail("");
                          setEditStatus(null);
                          setEditError("");
                        }}
                        disabled={editStatus === "saving"}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-save"
                        disabled={
                          editStatus === "saving" || editStatus === "sent"
                        }
                      >
                        {editStatus === "saving"
                          ? "Saving…"
                          : editStatus === "sent"
                            ? "✓ Saved!"
                            : "Save"}
                      </button>
                    </div>
                    {editError && <p className="edit-error">{editError}</p>}
                  </form>
                )}

                {/* Divider */}
                <div className="members-header">
                  <span className="members-label">SQUAD</span>
                  <span className="members-count">{peopleCount}/8 people</span>
                </div>
                <div className="reward-tiers">
                  <p className="reward-left">Rewards unlock at each tier</p>
                  <div className="reward-markers">
                    {rewardTiers.map((tier) => {
                      const unlocked = peopleCount >= tier;
                      return (
                        <span
                          key={tier}
                          className={`reward-marker${unlocked ? " unlocked" : ""}`}
                        >
                          {tier}/8
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Member list */}
                {members.length === 0 ? (
                  <p className="empty-state">
                    No one in your squad yet. Share your link!
                  </p>
                ) : (
                  <ul className="member-list">
                    {members.map((m) => {
                      const ms = memberEdit[m.id] || {};
                      const isYou =
                        joinedEmail && m.email.toLowerCase() === joinedEmail;
                      return (
                        <li
                          key={m.id}
                          className={`member-row${isYou ? " member-row-you" : ""}`}
                        >
                          {ms.open ? (
                            <form
                              className="member-edit-form"
                              onSubmit={(e) => handleMemberEditSave(e, m.id)}
                            >
                              <input
                                type="email"
                                className="edit-input edit-input-sm"
                                placeholder="new@email.com"
                                value={ms.email}
                                onChange={(e) =>
                                  handleMemberEmailChange(m.id, e.target.value)
                                }
                                required
                                autoFocus
                                disabled={
                                  ms.status === "saving" || ms.status === "sent"
                                }
                              />
                              <div className="edit-actions">
                                <button
                                  type="button"
                                  className="btn-cancel"
                                  onClick={() => closeMemberEdit(m.id)}
                                  disabled={ms.status === "saving"}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn-save"
                                  disabled={
                                    ms.status === "saving" ||
                                    ms.status === "sent"
                                  }
                                >
                                  {ms.status === "saving"
                                    ? "Saving…"
                                    : ms.status === "sent"
                                      ? "✓ Saved!"
                                      : "Save"}
                                </button>
                              </div>
                              {ms.error && (
                                <p className="edit-error">{ms.error}</p>
                              )}
                            </form>
                          ) : (
                            <>
                              <span className="member-email">
                                {maskEmail(m.email)}
                              </span>
                              <div className="member-actions">
                                {isYou && (
                                  <span className="you-badge">You</span>
                                )}
                                <button
                                  className="btn-member-action"
                                  onClick={() => openMemberEdit(m.id)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn-member-remove"
                                  onClick={() => handleRemoveMember(m.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Join squad form — only visible to non-owners (people who arrived via share link) */}
                {!isOwner &&
                  (joinStatus === "joined" ? (
                    <div className="join-success">
                      <span className="join-success-check">✓</span>
                      <span>You&apos;re in the squad!</span>
                    </div>
                  ) : isRoomFull ? (
                    <div className="join-success">
                      <span>This squad room is full.</span>
                    </div>
                  ) : (
                    <form className="join-form" onSubmit={handleJoinSquad}>
                      <p className="join-label">JOIN THIS SQUAD</p>
                      <div className="join-row">
                        <input
                          type="email"
                          className="join-input"
                          placeholder="your@email.com"
                          value={joinEmail}
                          onChange={(e) => setJoinEmail(e.target.value)}
                          required
                          disabled={joinStatus === "joining"}
                        />
                        <button
                          type="submit"
                          className="join-btn"
                          disabled={joinStatus === "joining"}
                        >
                          {joinStatus === "joining" ? "Joining…" : "Join →"}
                        </button>
                      </div>
                      {joinError && <p className="edit-error">{joinError}</p>}
                    </form>
                  ))}

                {/* Joined date */}
                <div className="joined-at">
                  <span className="joined-label">Joined</span>
                  <span className="joined-date">
                    {data.joined_at
                      ? new Date(data.joined_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--black, #201a16);
          color: #f0ebe1;
          font-family: "Space Grotesk", system-ui, sans-serif;
        }

        .nav {
          display: flex;
          align-items: center;
          padding: 0 2.5rem;
          height: 64px;
          border-bottom: 0;
          position: sticky;
          top: 0;
          background: var(--black, #201a16);
          backdrop-filter: none;
          z-index: 100;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          color: #f0ebe1;
        }
        .nav-logo img {
          height: 52px;
          width: auto;
        }
        .nav-logo span {
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

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
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .error-msg {
          font-size: 0.95rem;
          color: #5a5040;
        }
        .back-link {
          color: #c9a84c;
          font-size: 0.85rem;
          text-decoration: none;
        }
        .back-link:hover {
          text-decoration: underline;
        }

        .main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          max-width: 1080px;
          margin: 0 auto;
          padding: 3.8rem 2.5rem 6rem;
          align-items: start;
        }

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
          box-shadow: 0 0 8px rgba(62, 207, 142, 0.6);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.65);
          }
        }

        .headline {
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: clamp(3.5rem, 8vw, 6.5rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          text-transform: none;
          line-height: 0.95;
          color: #f5f0e8;
          margin: 0 0 1.2rem;
        }
        .sub {
          font-size: 1rem;
          color: #8a8278;
          line-height: 1.6;
          margin: 0 0 1.75rem;
          max-width: 380px;
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
          background: rgba(201, 168, 76, 0.12);
          border: 1px solid rgba(201, 168, 76, 0.3);
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
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            background 0.2s,
            transform 0.15s;
          margin-bottom: 1rem;
        }
        .btn-share:hover {
          background: #d4bc82;
        }
        .btn-share:active {
          transform: scale(0.97);
        }

        .share-url-wrap {
          background: #0d0d0d;
          border: 1px solid #1e1a10;
          border-radius: 8px;
          padding: 0.5rem 0.55rem 0.5rem 0.9rem;
          max-width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }
        .share-url-text {
          font-family: "Courier New", monospace;
          font-size: 0.78rem;
          color: #c9a84c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          flex: 1;
          min-width: 0;
        }
        .copy-link-btn {
          border: 1px solid #2a2416;
          background: #111008;
          color: #c9a84c;
          border-radius: 6px;
          width: 30px;
          height: 30px;
          padding: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition:
            border-color 0.2s,
            background 0.2s,
            color 0.2s;
        }
        .copy-link-btn svg {
          width: 14px;
          height: 14px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .copy-link-btn:hover {
          border-color: #4a4030;
          background: #17140d;
          color: #e0bf6b;
        }

        .col-right {
          position: sticky;
          top: 84px;
        }

        .room-panel {
          background: linear-gradient(160deg, #0e0c08 0%, #0a0907 100%);
          border: 1px solid #f0d08040;
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 0 60px rgba(240, 208, 128, 0.04);
        }

        .room-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
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
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 1.02rem !important;
          font-weight: 700;
          letter-spacing: -0.01em !important;
          color: #f0d080;
          text-transform: none !important;
          margin: 0;
          line-height: 1.18 !important;
          word-break: break-word;
        }
        .room-at {
          color: #a08030;
        }
        .room-title-placeholder {
          color: #3a3020;
          font-style: italic;
          font-weight: 400;
          text-transform: none;
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          letter-spacing: 0;
        }

        .btn-edit {
          background: transparent;
          border: 1px solid #2a2416;
          border-radius: 6px;
          color: #5a5040;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.4rem 0.85rem;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition:
            border-color 0.2s,
            color 0.2s;
          margin-top: 0.2rem;
        }
        .btn-edit:hover {
          border-color: #4a4030;
          color: #c9a84c;
        }

        .edit-form {
          background: #0a0907;
          border: 1px solid #1e1a10;
          border-radius: 12px;
          padding: 1.1rem 1.1rem 1rem;
          margin-bottom: 1.25rem;
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
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #f0ebe1;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 0.75rem;
          transition: border-color 0.2s;
        }
        .edit-input-sm {
          padding: 0.5rem 0.75rem;
          font-size: 0.82rem;
        }
        .edit-input:focus {
          border-color: #c9a84c;
        }
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
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.6rem;
          cursor: pointer;
          transition:
            border-color 0.2s,
            color 0.2s;
        }
        .btn-cancel:hover {
          border-color: #4a4030;
          color: #8a8278;
        }
        .btn-save {
          flex: 2;
          background: #c9a84c;
          border: none;
          border-radius: 7px;
          color: #070707;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.6rem;
          cursor: pointer;
          transition:
            opacity 0.2s,
            background 0.2s;
        }
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-save:not(:disabled):hover {
          background: #d4bc82;
        }
        .edit-error {
          font-size: 0.75rem;
          color: #e05050;
          margin: 0.6rem 0 0;
        }

        /* Members section */
        .members-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0 0.65rem;
          border-top: 1px solid #141008;
          margin-bottom: 0.5rem;
        }
        .members-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #3a3020;
          text-transform: uppercase;
        }
        .members-count {
          font-size: 0.72rem;
          color: #5a5040;
          font-weight: 500;
        }
        .reward-tiers {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.65rem 0.8rem;
          align-items: center;
          margin: 0 0 0.9rem;
        }
        .reward-left {
          font-size: 0.66rem;
          color: #8a8278;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
        }
        .reward-markers {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          justify-content: flex-start;
        }
        .reward-marker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          border-radius: 999px;
          border: 1px solid #2a2416;
          padding: 0.2rem 0.55rem;
          font-size: 0.68rem;
          font-weight: 600;
          color: #5a5040;
          background: #0d0b07;
        }
        .reward-marker.unlocked {
          border-color: rgba(201, 168, 76, 0.45);
          color: #c9a84c;
          background: rgba(201, 168, 76, 0.08);
        }

        .empty-state {
          font-size: 0.8rem;
          color: #3a3020;
          font-style: italic;
          margin: 0 0 1.25rem;
        }

        .member-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .member-row {
          background: #0d0b07;
          border: 1px solid #1a1510;
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .member-row-you {
          border-color: rgba(201, 168, 76, 0.35);
          background: rgba(201, 168, 76, 0.05);
        }
        .member-email {
          font-size: 0.82rem;
          color: #8a8278;
          font-family: "Courier New", monospace;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .member-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .you-badge {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #c9a84c;
          background: rgba(201, 168, 76, 0.12);
          border: 1px solid rgba(201, 168, 76, 0.3);
          border-radius: 4px;
          padding: 0.15rem 0.45rem;
        }
        .member-edit-form {
          width: 100%;
        }

        .btn-member-action {
          background: transparent;
          border: 1px solid #2a2416;
          border-radius: 5px;
          color: #5a5040;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.28rem 0.6rem;
          cursor: pointer;
          transition:
            border-color 0.2s,
            color 0.2s;
        }
        .btn-member-action:hover {
          border-color: #4a4030;
          color: #c9a84c;
        }

        .btn-member-remove {
          background: transparent;
          border: 1px solid #2a1010;
          border-radius: 5px;
          color: #5a3030;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.28rem 0.6rem;
          cursor: pointer;
          transition:
            border-color 0.2s,
            color 0.2s;
        }
        .btn-member-remove:hover {
          border-color: #6a2020;
          color: #e05050;
        }

        /* Joined date */
        .join-form {
          margin-bottom: 1.25rem;
          padding: 1.1rem;
          background: #0a0907;
          border: 1px solid #1e1a10;
          border-radius: 12px;
        }
        .join-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #3a3020;
          text-transform: uppercase;
          margin: 0 0 0.75rem;
        }
        .join-row {
          display: flex;
          gap: 0.5rem;
        }
        .join-input {
          flex: 1;
          background: #111008;
          border: 1px solid #2a2416;
          border-radius: 8px;
          padding: 0.65rem 0.9rem;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.85rem;
          color: #f0ebe1;
          outline: none;
          transition: border-color 0.2s;
          min-width: 0;
        }
        .join-input:focus {
          border-color: #c9a84c;
        }
        .join-btn {
          background: #c9a84c;
          color: #070707;
          border: none;
          border-radius: 8px;
          padding: 0.65rem 1.1rem;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .join-btn:hover {
          background: #d4bc82;
        }
        .join-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .join-success {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.85rem;
          color: #3ecf8e;
          font-weight: 600;
          margin-bottom: 1.25rem;
          padding: 0.85rem 1.1rem;
          background: rgba(62, 207, 142, 0.06);
          border: 1px solid rgba(62, 207, 142, 0.2);
          border-radius: 10px;
        }
        .join-success-check {
          font-size: 1rem;
        }

        .joined-at {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid #141008;
        }
        .joined-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3a3020;
        }
        .joined-date {
          font-size: 0.82rem;
          color: #8a8278;
        }

        @media (max-width: 768px) {
          .main {
            grid-template-columns: 1fr;
            padding: 2.4rem 1.5rem 5rem;
            gap: 2.5rem;
          }
          .col-right {
            position: static;
          }
          .headline {
            font-size: clamp(3rem, 12vw, 5rem);
          }
          .reward-tiers {
            grid-template-columns: 1fr;
            gap: 0.45rem;
          }
        }
        @media (max-width: 400px) {
          .nav {
            padding: 0 1.2rem;
          }
        }
      `}</style>
    </>
  );
}
