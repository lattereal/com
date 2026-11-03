export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <article className="prose-page">
      <p className="mb-2 text-xs uppercase tracking-widest text-muted">legal · last updated november 3, 2026</p>
      <h1>Privacy policy</h1>
      <p>This policy describes the information ComForums handles when you browse, register, post, message other members, or use profile features. It is a plain-language description of the current application, not a promise that no data is ever processed by infrastructure providers. Review it with a qualified privacy lawyer for the jurisdictions where the service is operated or used.</p>
      <h2>1. Information you provide</h2>
      <p>When you create an account, the application stores your username and a password hash. Passwords are hashed with bcrypt; the application does not store the password in readable form. You may also choose to provide a display name, biography, avatar, profile banner, audio tracks, uploads, posts, replies, and messages. Information you put on a public profile or public discussion may be visible to anyone who can access the site.</p>
      <h2>2. Network and security information</h2>
      <p>The application receives network information, including IP addresses, as part of normal web requests. It uses request IP information for rate limiting and abuse prevention. The one-account-per-network feature stores a keyed HMAC hash of the sign-up network address rather than the raw address in the account record. This hash is still a security identifier and should not be treated as anonymous information.</p>
      <h2>3. Messages and private uploads</h2>
      <p>Direct messages and chat messages are stored so the messaging features work. They are not public profile content, but administrators may need access to investigate abuse, enforce the rules, respond to security incidents, or comply with valid legal process. Password-protected uploads restrict ordinary viewing; they are not end-to-end encrypted and administrators may access them for moderation.</p>
      <h2>4. Cookies and service providers</h2>
      <p>The application uses a session cookie to keep you signed in and a separate short-lived cookie for unlocking password-protected uploads. The site does not currently include an advertising or analytics integration in its application code. The service is hosted using Vercel and stores application data in a Neon PostgreSQL database. Those providers may process technical information under their own terms and policies when delivering their services.</p>
      <h2>5. How information is used</h2>
      <ul><li>To create and authenticate accounts and maintain sessions.</li><li>To display profiles, discussions, uploads, and conversations.</li><li>To prevent spam, enforce account restrictions, and investigate reports.</li><li>To maintain, secure, troubleshoot, and improve the service.</li><li>To respond to valid legal requests and protect users or the service where permitted or required by law.</li></ul>
      <h2>6. Public information</h2>
      <p>Threads, replies, and profile information are public where the interface marks them as public. Do not post passwords, authentication codes, financial details, private addresses, or information you do not want other people to see. Deleting an account does not guarantee that copies, screenshots, browser caches, or third-party archives disappear.</p>
      <h2>7. Retention and deletion</h2>
      <p>Account data and content are retained while needed to operate the service, enforce its rules, resolve disputes, maintain security, or meet legal obligations. The application does not currently publish a fixed deletion timetable. Account deletion may remove associated profile and message data, but backups, infrastructure logs, and records that must be retained may persist for a period determined by the relevant provider or legal requirement.</p>
      <h2>8. Legal disclosures</h2>
      <p>Information may be disclosed in response to legal process that the service determines it is required to comply with, or where disclosure is otherwise permitted by applicable law. The service may challenge or narrow requests where appropriate, but does not promise that it can always do so or that notice can always be provided.</p>
      <h2>9. Security limitations</h2>
      <p>Reasonable technical measures are used to protect the service, but no website, database, network, or storage system can be guaranteed secure. Direct messages and uploaded files are not described as end-to-end encrypted. Use a unique password and avoid sharing sensitive information through the service.</p>
      <h2>10. Changes</h2>
      <p>This policy may change as the application and its providers change. The date above identifies the latest revision. Continued use after an update means the revised policy is available for review; it does not remove rights that apply under local law.</p>
      <p className="mt-8 border-t border-line pt-4 text-xs text-muted">This document is informational and is not legal advice. It must be reviewed and completed with the operator's actual contact details, retention practices, and applicable legal requirements before being relied upon as a formal privacy notice.</p>
    </article>
  );
}
