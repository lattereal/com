export const metadata = { title: 'Ranks' };

const ranks = [
  { name: 'rich', detail: 'Unlocks premium profile customization, including name colors, effects, themes, and social links.' },
  { name: 'respected', detail: 'Unlocks premium profile customization, including name colors, effects, themes, and social links.' },
  { name: 'known', detail: 'Unlocks premium profile customization, including name colors, effects, themes, and social links.' },
];

export default function Ranks() {
  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-2xl font-medium">ranks</h1>
      <p className="mt-2 text-sm text-muted">These three ranks come with extra profile customization.</p>
      <div className="mt-7 divide-y divide-line border-y border-line">
        {ranks.map((rank) => <section key={rank.name} className="py-4">
          <h2 className="text-sm font-medium capitalize">{rank.name}</h2>
          <p className="mt-1 text-sm text-muted">{rank.detail}</p>
        </section>)}
      </div>
      <section className="mt-8 rounded border border-line bg-surface p-5">
        <h2 className="text-base font-medium">profile perks</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>custom display-name colors</li>
          <li>name effects, including sparkle, glow, gradient, and shimmer</li>
          <li>profile themes</li>
          <li>social links on your profile</li>
        </ul>
        <p className="mt-3 text-sm text-muted">Want to ask about a rank? <a href="https://t.me/comforumscom" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-fg">contact us on Telegram</a>.</p>
      </section>
    </div>
  );
}
