export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <article className="prose-page">
      <p className="mb-2 text-xs uppercase tracking-widest text-muted">last updated november 3, 2026</p>
      <h1>Privacy policy</h1>
      <p>This page explains what ComForums stores and how that information is used when you use the site.</p>
      <h2>Information tied to your account</h2>
      <p>When you register, we store your username and a hashed version of your password. We do not store your password in readable form. If you add a display name, bio, profile picture, banner, music, posts, replies, uploads, or messages, that information is stored so the related features work. Public profile details and public posts can be seen by other visitors.</p>
      <h2>Connection information</h2>
      <p>Like other websites, ComForums receives technical information when your browser connects, including your IP address. The application uses network information for rate limits and abuse prevention. For the one-account-per-network check, the account record stores a keyed hash of the network address rather than the raw address. That hash is still a security identifier; it should not be considered anonymous.</p>
      <h2>Messages and uploads</h2>
      <p>Direct messages and chat messages are stored to make messaging work. They are not public, but staff may review relevant information when investigating reports, abuse, or security issues, or when responding to valid legal requests. Password-protected uploads are access-controlled, not end-to-end encrypted. Site operators may be able to access them.</p>
      <h2>Cookies and providers</h2>
      <p>ComForums uses a session cookie to keep you signed in and a separate short-lived cookie for password-protected uploads. The application does not currently include advertising or analytics integrations. The site is hosted by Vercel and uses a Neon PostgreSQL database. These providers may process technical data and logs as part of providing their services.</p>
      <h2>Why we use information</h2>
      <ul>
        <li>To create accounts and keep you signed in.</li>
        <li>To show profiles, discussions, uploads, and messages.</li>
        <li>To prevent spam and investigate reports or rule violations.</li>
        <li>To keep the site working, secure, and reliable.</li>
        <li>To respond to legal requests and protect users or the service when appropriate.</li>
      </ul>
      <h2>What other people can see</h2>
      <p>Information marked as public, including public threads, replies, and profile details, is visible to other visitors. Think before posting. Do not share passwords, login codes, financial information, private addresses, or anything you do not want others to see. Removing something from ComForums cannot remove screenshots, browser copies, or copies saved elsewhere.</p>
      <h2>How long information is kept</h2>
      <p>Chat messages and direct messages are automatically deleted after 15 hours. Account information, profiles, posts, replies, and security records may be kept for as long as they are needed to run the site, enforce the rules, prevent abuse, resolve issues, or meet legal requirements. If an account or item is deleted, copies may remain in backups, provider logs, or records that need to be retained.</p>
      <h2>Legal requests</h2>
      <p>We may preserve or disclose information when we are required to do so by valid legal process, or when the law otherwise allows it. Whether we can notify an affected user depends on the circumstances and applicable law.</p>
      <h2>Keeping your account safe</h2>
      <p>We take steps to protect the site, but no online service can guarantee complete security. Messages and uploads are not end-to-end encrypted. Use a unique password and avoid sending sensitive information through ComForums.</p>
      <h2>Questions or requests</h2>
      <p>For privacy questions or requests, contact the ComForums team through our <a href="https://t.me/comforumscc" target="_blank" rel="noreferrer">Telegram channel</a>.</p>
      <h2>Changes to this policy</h2>
      <p>This page may be updated when the site or its practices change. The date at the top shows the latest revision.</p>
    </article>
  );
}
