import { sql } from './db';

const MB = 1024 * 1024;
// Vercel caps request bodies at ~4.5 MB, so 4 MB is the practical ceiling for uploads.
export const LIMITS = { image: 4 * MB, audio: 4 * MB, video: 4 * MB };

// Decide the type from the file's real bytes. The browser-supplied type is only used to
// tell audio from video inside containers that can be either (mp4, webm). SVG is never allowed.
function sniff(b, declared = '') {
  if (b.length < 12) return null;
  const ascii = (s, e) => b.toString('latin1', s, e);
  const wantsAudio = String(declared).startsWith('audio/');
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return { mime: 'image/png', kind: 'image' };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', kind: 'image' };
  if (ascii(0, 4) === 'GIF8') return { mime: 'image/gif', kind: 'image' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', kind: 'image' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return { mime: 'audio/wav', kind: 'audio' };
  if (ascii(0, 4) === 'OggS') return { mime: 'audio/ogg', kind: 'audio' };
  if (ascii(0, 4) === 'fLaC') return { mime: 'audio/flac', kind: 'audio' };
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return { mime: 'audio/aac', kind: 'audio' };
  if (ascii(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { mime: 'audio/mpeg', kind: 'audio' };
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (brand === 'M4A ' || brand === 'M4B ' || wantsAudio) return { mime: 'audio/mp4', kind: 'audio' };
    return { mime: 'video/mp4', kind: 'video' };
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
    return wantsAudio ? { mime: 'audio/webm', kind: 'audio' } : { mime: 'video/webm', kind: 'video' };
  return null;
}

// Validates and stores an uploaded File. Returns { id, kind, mime } or { error }.
export async function saveMedia(file, ownerId, kinds = ['image', 'audio', 'video'], maxBytes) {
  if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || !file.size)
    return { error: 'Choose a file first.' };
  const hardMax = maxBytes || Math.max(...kinds.map((k) => LIMITS[k]));
  if (file.size > hardMax) return { error: `File is too large (max ${Math.floor(hardMax / MB)} MB).` };

  const buf = Buffer.from(await file.arrayBuffer());
  const t = sniff(buf, file.type);
  if (!t || !kinds.includes(t.kind)) return { error: `Unsupported file type. Allowed: ${kinds.join(', ')}.` };
  if (buf.length > Math.min(hardMax, LIMITS[t.kind])) return { error: 'File is too large.' };

  const [m] = await sql`
    insert into media (owner_id, mime, size, data) values (${ownerId}, ${t.mime}, ${buf.length}, ${buf})
    returning id`;
  return { id: m.id, kind: t.kind, mime: t.mime };
}
