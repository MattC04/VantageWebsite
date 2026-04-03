import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { supabaseAnon } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [mobileRedirect, setMobileRedirect] = useState(false);

  // Store parsed tokens so establishSession can be called from the fallback button
  const tokensRef = useRef(null);

  async function establishSession() {
    const tokens = tokensRef.current;
    if (!tokens) return;

    let sessionError = null;

    if (tokens.accessToken && tokens.refreshToken) {
      const result = await supabaseAnon.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      sessionError = result.error;
    } else if (tokens.tokenHash) {
      const result = await supabaseAnon.auth.verifyOtp({
        token_hash: tokens.tokenHash,
        type: "recovery",
      });
      sessionError = result.error;
    } else {
      setStatus("error");
      setErrorMessage(
        "This reset link has expired or is invalid. Please request a new one from the Vantage app."
      );
      return;
    }

    if (sessionError) {
      setStatus("error");
      setErrorMessage(
        "This reset link has expired or is invalid. Please request a new one from the Vantage app."
      );
    } else {
      setStatus("ready");
    }
  }

  useEffect(() => {
    async function init() {
      // Supabase may deliver tokens as hash fragment OR query params depending
      // on browser/redirect behavior. Check both.
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");
      const type = hashParams.get("type") || queryParams.get("type");
      const tokenHash = queryParams.get("token_hash");

      // No tokens at all — invalid link
      if (!type || type !== "recovery") {
        if (!tokenHash) {
          setStatus("error");
          setErrorMessage(
            "This reset link has expired or is invalid. Please request a new one from the Vantage app."
          );
          return;
        }
      }

      // Store tokens for later use by establishSession
      tokensRef.current = { accessToken, refreshToken, tokenHash };

      // Mobile users: attempt deep link, keep spinner showing
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setMobileRedirect(true);

        if (accessToken) {
          window.location.href = `vantage://reset-password#${hash}`;
        } else if (tokenHash) {
          window.location.href = `vantage://reset-password?token_hash=${tokenHash}&type=recovery`;
        }

        // Don't auto-fallback — the iOS "Open in app?" dialog is non-blocking,
        // so any state update here would dismiss it. Let the user tap the
        // fallback link manually if the app doesn't open.
        return;
      }

      // Desktop: establish session immediately
      await establishSession();
    }

    init();
  }, []);

  function validate() {
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMessage(err);
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const { error } = await supabaseAnon.auth.updateUser({ password });

    if (error) {
      setStatus("ready");
      setErrorMessage(error.message);
    } else {
      setStatus("success");
      supabaseAnon.auth.signOut();
    }
  }

  return (
    <>
      <Head>
        <title>Reset Password | Vantage</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="rp-page">
        <div className="rp-card">
          <img src="/Logo.png" alt="Vantage" className="rp-logo" />

          {status === "loading" && (
            <div className="rp-center">
              <div className="rp-spinner" />
              <p className="rp-sub">
                {mobileRedirect ? "Opening the Vantage app…" : "Verifying your reset link…"}
              </p>
              {mobileRedirect && (
                <button
                  className="rp-link"
                  onClick={() => establishSession()}
                >
                  Use web form instead
                </button>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="rp-center">
              <div className="rp-icon rp-icon--error">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="rp-heading">Link Expired</h2>
              <p className="rp-sub">{errorMessage}</p>
            </div>
          )}

          {(status === "ready" || status === "submitting") && (
            <>
              <h2 className="rp-heading">Set New Password</h2>
              <p className="rp-sub" style={{ marginBottom: "1.5rem" }}>
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="rp-form">
                <div className="rp-input-group">
                  <label className="form-label" htmlFor="rp-pw">
                    New Password
                  </label>
                  <input
                    id="rp-pw"
                    type="password"
                    className="rp-input"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === "submitting"}
                    autoFocus
                  />
                </div>

                <div className="rp-input-group">
                  <label className="form-label" htmlFor="rp-confirm">
                    Confirm Password
                  </label>
                  <input
                    id="rp-confirm"
                    type="password"
                    className="rp-input"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === "submitting"}
                  />
                </div>

                {errorMessage && (
                  <p className="rp-error">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  className="rp-btn"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Updating…" : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {status === "success" && (
            <div className="rp-center">
              <div className="success-check">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="rp-heading">Password Updated</h2>
              <p className="rp-sub">
                You can now sign in with your new password in the Vantage app.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
