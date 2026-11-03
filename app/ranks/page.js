export const metadata = { title: 'Ranks' };

const ranks = [
  { name: 'owner', detail: 'Runs the site and has full control over community settings and staff.' },
  { name: 'co-owner', detail: 'Helps manage the site and has senior staff permissions.' },
  { name: 'moderator', detail: 'Helps keep discussions in line with the community rules.' },
  { name: 'rich', detail: 'A profile rank with access to premium profile customization.' },
  { name: 'respected', detail: 'A community rank with the same premium profile customization.' },
  { name: 'known', detail: 'A community rank with the same premium profile customization.' },
  { name: 'member', detail: 'The standard rank for everyone who joins ComForums.' },
];

export default function Ranks() {
  return (
    <div className="mx-auto max-w-[720px]">
      <p className="mb-1 text-xs tracking-widest text-muted">community</p>
      <h1 className="text-2xl font-medium">ranks</h1>
      <p className="mt-2 text-sm text-muted">Ranks show a member's place in the community. Staff ranks have moderation permissions. Rich, Respected, and Known are profile ranks.</p>
      <div className="mt-7 divide-y divide-line border-y border-line">
        {ranks.map((rank) => <section key={rank.name} className="py-4">
          <h2 className="text-sm font-medium">{rank.name}</h2>
          <p className="mt-1 text-sm text-muted">{rank.detail}</p>
        </section>)}
      </div>
      <section className="mt-8 rounded border border-line bg-surface p-5">
        <h2 className="text-base font-medium">premium profile perks</h2>
        <p className="mt-2 text-sm text-muted">Rich, Respected, and Known members can use extra profile options:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>custom display-name colors</li>
          <li>name effects, including glow, gradient, and shimmer</li>
          <li>profile themes</li>
          <li>social links on your profile</li>
        </ul>
        <p className="mt-3 text-sm text-muted">These options are locked for standard members. Want to ask about a rank? <a href="https://t.me/comforumscc" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-fg">contact us on Telegram</a>.</p>
      </section>
    </div>
  );
}
