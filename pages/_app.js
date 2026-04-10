import '../styles.css';
import { Analytics } from '@vercel/analytics/next';
import { useEffect, useState } from 'react';

function InAppBrowserGate({ children }) {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    // Detect Instagram, Facebook, TikTok, Snapchat, Twitter in-app browsers
    const inApp = /Instagram|FBAN|FBAV|Musical_ly|BytedanceWebview|Snapchat|Twitter/i.test(ua);
    setIsInAppBrowser(inApp);
  }, []);

  if (!isInAppBrowser) return children;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  const handleOpenBrowser = () => {
    if (isAndroid) {
      // Intent URL opens in Chrome on Android
      window.location.href = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;end`;
    }
    // iOS has no reliable deep-link to Safari from in-app browsers,
    // so we rely on the user tapping the menu/dots → "Open in Safari"
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: '#0a0a0a', color: '#fff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <img
        src="/Logo.png" alt="Vantage"
        style={{ width: 80, height: 80, marginBottom: '1.5rem', objectFit: 'contain' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem', fontWeight: 700 }}>
        Open in your browser
      </h1>
      <p style={{ fontSize: '1rem', color: '#aaa', margin: '0 0 1.5rem', maxWidth: 340, lineHeight: 1.5 }}>
        {isIOS
          ? <>Tap the <strong style={{ color: '#fff' }}>⋯</strong> or <strong style={{ color: '#fff' }}>share</strong> button below, then choose <strong style={{ color: '#fff' }}>&quot;Open in Safari&quot;</strong> for the best experience.</>
          : <>Tap the button below to open this page in your browser.</>
        }
      </p>

      {isAndroid && (
        <button
          onClick={handleOpenBrowser}
          style={{
            background: '#c8a94e', color: '#000', border: 'none',
            padding: '0.85rem 2rem', borderRadius: 8, fontSize: '1rem',
            fontWeight: 700, cursor: 'pointer', marginBottom: '1rem',
          }}
        >
          Open in Browser
        </button>
      )}

      <div style={{
        marginTop: '1rem', padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.08)', borderRadius: 8,
        fontSize: '0.8rem', color: '#888', wordBreak: 'break-all', maxWidth: 340,
      }}>
        {currentUrl}
      </div>

      <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '1.5rem' }}>
        Or copy the link above and paste it in your browser
      </p>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <InAppBrowserGate>
        <Component {...pageProps} />
      </InAppBrowserGate>
      <Analytics />
    </>
  );
}
