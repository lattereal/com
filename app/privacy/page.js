export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <article className="prose-page">
      <h1>Privacy</h1>
      <p>Draft text. Have it reviewed against the laws that apply to you before launch.</p>
      <h2>What we collect</h2>
      <p>Your username, a hashed password, the profile details you choose to add, and the content you post or upload, including chat and direct messages. We collect no email address. We use one session cookie to keep you signed in. We use no analytics or advertising trackers.</p>
      <h2>How we use it</h2>
      <p>To run the forum: sign-in, moderation, and abuse prevention. To allow one account per network, we store a keyed hash of your IP address at sign-up (never the address itself) and use IP addresses for rate limiting. Moderators can open any upload, including password-protected ones, to enforce the rules.</p>
      <h2>Sharing</h2>
      <p>We do not sell your data. We may disclose information when legally required.</p>
      <h2>Deletion</h2>
      <p>Email admin@comforums.example to request deletion of your account.</p>
    </article>
  );
}
