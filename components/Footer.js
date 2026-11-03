import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-line text-xs text-muted">
      <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-4 px-5 py-6">
        <span>ComForums © 2026</span>
        <nav className="flex flex-wrap gap-4">
          <Link href="/rules" className="hover:text-fg">Rules</Link>
          <Link href="/ranks" className="hover:text-fg">Ranks</Link>
          <Link href="/privacy" className="hover:text-fg">Privacy</Link>
          <Link href="/terms" className="hover:text-fg">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
