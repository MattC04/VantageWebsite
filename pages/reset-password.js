import Head from "next/head";
import { useState, useEffect } from "react";
import { supabaseAnon } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function init() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (!accessToken || !refreshToken || type !== "recovery") {
        setStatus("error");
        setErrorMessage(
          "This reset link has expired or is invalid. Please request a new one from the Vantage app."
        );
        return;
      }

      // Mobile users: redirect to the app's deep link
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `vantage://reset-password#${hash}`;
        return;
      }

      // Desktop: establish session with the recovery tokens
      const { error: sessionError } = await supabaseAnon.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setStatus("error");
        setErrorMessage(
          "This reset link has expired or is invalid. Please request a new one from the Vantage app."
        );
        return;
      }

      setStatus("ready");
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
              <p className="rp-sub">Verifying your reset link…</p>
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
