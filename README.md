# Vantage

Sports betting waitlist website. "Never Sweat A Parlay Alone."

## What it is

A static landing page with a waitlist signup form. The frontend is plain HTML/CSS/JS — Next.js is only used to serve the API route that handles signups.

## File Structure

```
index.html              ← The website (main entry point)
styles.css              ← All styling
main.js                 ← Animations, intro sequence, waitlist form logic

assets/
  curry prop.png        ← Hero section player prop card
  Lebron prop.png       ← Hero section player prop card
  phonepicture.png      ← Hero section phone mockup UI

sweatscreen.png         ← Features section phone screenshot
Logo.png                ← Nav logo and favicon

pages/
  api/
    waitlist/
      join.js           ← API endpoint — handles waitlist form POST

lib/
  email.js              ← Builds and sends confirmation email via Resend
  supabase.js           ← Supabase client initialization
  utils.js              ← Email validation, rate limiting
```

## Sections

| # | Section | Description |
|---|---------|-------------|
| 1 | Intro overlay | Animated loading screen with parlay odds counter |
| 2 | Hero | "Never Sweat A Parlay Alone" headline, phone mockup, Curry/LeBron prop cards, scrolling ticker |
| 3 | Features | Two slides — "Sweat Screen" (live play-by-play) and "Player Cards" (collect & level up) |
| 4 | Waitlist | Email signup form, posts to `/api/waitlist/join` |

## How signups work

1. User submits email on the waitlist form
2. `main.js` POSTs to `/api/waitlist/join`
3. API validates the email, checks rate limits (`lib/utils.js`)
4. Stores the email in Supabase
5. Sends a confirmation email via Resend (`lib/email.js`)

## Dependencies (CDN)

- [GSAP 3.12.5](https://gsap.com) — scroll animations
- [Lenis 1.1.14](https://lenis.darkroom.engineering) — smooth scrolling
- [EmailJS](https://www.emailjs.com) — loaded but backend uses Resend

## Stack

- Frontend: HTML, CSS, vanilla JS
- Backend: Next.js API routes (Node.js)
- Database: Supabase (Postgres)
- Email: Resend
- Hosting: Vercel
