export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ACCENTS = ['#6366f1', '#a78bfa', '#ec4899', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#38bdf8'];

// Strip control chars and bidi overrides (display-name spoofing), keep one line.
export const cleanLine = (s, max) =>
  String(s ?? '')
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

export const cleanText = (s, max) =>
  String(s ?? '')
    .replace(/\r/g, '')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .trim()
    .slice(0, max);

export function parseTags(s) {
  const out = [];
  for (const raw of String(s || '').toLowerCase().split(/[\s,]+/)) {
    const t = raw.replace(/^#+/, '');
    if (/^[a-z0-9_]{2,24}$/.test(t) && !out.includes(t)) out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

export const nameOf = (u) => u.display_name || u.username;
