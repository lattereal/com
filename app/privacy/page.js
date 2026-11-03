export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <article className="prose-page">
      <p className="mb-2 text-xs text-muted">updated november 3, 2026</p>
      <h1>privacy</h1>
      <p>Here is what ComForums stores when you use the site.</p>
      <h2>account and profile</h2>
      <p>We store your username and a password hash, not your readable password. We also store profile details, posts, replies, uploads, music, and messages you add.</p>
      <h2>connection data</h2>
      <p>Our servers receive technical information such as your IP address. We use network information for rate limits and abuse prevention. The one-account-per-network check uses a keyed hash instead of keeping the raw address in your account record.</p>
      <h2>messages and uploads</h2>
      <p>Messages are stored so they can be delivered and shown to you. They are not end-to-end encrypted. Chat and direct messages are cleaned up after 15 hours when the messaging cleanup runs, so deletion may not happen at the exact 15-hour mark. Password-protected uploads restrict access, but are not encrypted from site operators.</p>
      <h2>cookies and hosting</h2>
      <p>We use a sign-in cookie and a short-lived cookie for unlocked uploads. ComForums is hosted by Vercel and uses Neon for its database. Those providers may process technical data and logs to run their services. The site does not currently include advertising or analytics integrations.</p>
      <h2>who can see your information</h2>
      <p>Public profiles, threads, and replies are visible to visitors. Private messages are not public, but staff may review relevant information when investigating reports, abuse, or security problems.</p>
      <h2>how long we keep it</h2>
      <p>Chat and direct messages are automatically deleted after 15 hours when the cleanup runs. Account details, posts, uploads, and security records may stay while needed to operate the site, handle abuse, or meet legal requirements. Backups and provider logs may keep copies for longer.</p>
      <h2>legal requests</h2>
      <p>We may preserve or share information when required by valid legal process or when the law allows it.</p>
      <h2>contact</h2>
      <p>For privacy questions, contact us through the <a href="https://t.me/comforumscc" target="_blank" rel="noreferrer">ComForums Telegram channel</a>.</p>
    </article>
  );
}
