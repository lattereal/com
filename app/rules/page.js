export const metadata = { title: 'Rules' };

export default function Rules() {
  return (
    <article className="prose-page">
      <h1>Rules</h1>
      <p>ComForums is a private community. Keep it useful and keep it safe.</p>
      <h2>Not allowed</h2>
      <ul>
        <li>Doxxing or posting personal information about anyone.</li>
        <li>CSAM, gore, or threats of violence.</li>
        <li>Malware binaries, phishing kits, or stolen credentials.</li>
        <li>Sale or trade of illegal goods.</li>
        <li>Spam or bot accounts.</li>
        <li>Uploading anything above, including behind a password. Moderators can open protected uploads.</li>
        <li>Creating extra accounts to get around the one-account-per-network rule.</li>
      </ul>
      <h2>Reporting and enforcement</h2>
      <p>Report problems to admin@comforums.example, or use the Report link on any thread or post. Violations result in an immediate ban and, where legally required, referral to law enforcement.</p>
    </article>
  );
}
