import Link from 'next/link';

export default function Pagination({ page, pages, base }) {
  if (pages <= 1) return null;
  const href = (p) => `${base}${base.includes('?') ? '&' : '?'}page=${p}`;
  const start = Math.max(1, Math.min(page - 3, pages - 6));
  const nums = Array.from({ length: Math.min(7, pages) }, (_, i) => start + i);
  const cell = 'inline-flex h-8 min-w-8 items-center justify-center rounded border px-2 text-[13px]';
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center gap-1.5 text-muted">
      {page > 1 ? <Link href={href(page - 1)} className={`${cell} border-line hover:text-fg`}>prev</Link> : <span className={`${cell} border-transparent opacity-50`}>prev</span>}
      <span className="px-1">/</span>
      {nums.map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? 'page' : undefined}
          className={`${cell} ${n === page ? 'border-accent text-fg' : 'border-line hover:text-fg'}`}>{n}</Link>
      ))}
      <span className="px-1">/</span>
      {page < pages ? <Link href={href(page + 1)} className={`${cell} border-line hover:text-fg`}>next</Link> : <span className={`${cell} border-transparent opacity-50`}>next</span>}
    </nav>
  );
}
