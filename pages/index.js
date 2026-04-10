// OLD LANDER — moved to index.old.js on 2026-04-10, replaced by VantageLander.html. DO NOT DELETE index.old.js.
// This file redirects to the new static landing page.

export default function Home() {
  return null;
}

export async function getServerSideProps({ res }) {
  // Serve VantageLander.html as the root page
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'VantageLander.html');
  const html = fs.readFileSync(filePath, 'utf-8');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.write(html);
  res.end();

  return { props: {} };
}
