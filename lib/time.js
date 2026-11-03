export function timeAgo(date) {
  const d = new Date(date);
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const fmt = (n) => Number(n).toLocaleString('en-US');

export function snippet(md, len = 140) {
  const t = md.replace(/[#*_`>\[\]()!~-]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > len ? t.slice(0, len) + '…' : t;
}
