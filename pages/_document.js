import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Never sweat a parlay alone. The player props betting platform." />
        <link rel="icon" type="image/png" href="/Logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
