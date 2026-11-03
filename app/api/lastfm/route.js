import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const clean = (value, max) => String(value || '').trim().slice(0, max);

export async function GET(req) {
  const title = clean(req.nextUrl.searchParams.get('title'), 100);
  const artist = clean(req.nextUrl.searchParams.get('artist'), 80);
  if (!title || !artist) return NextResponse.json({ image: null });

  try {
    // Last.fm's public website exposes album artwork in its page metadata.
    const search = new URL('https://www.last.fm/search');
    search.searchParams.set('q', `${artist} ${title}`);
    const response = await fetch(search, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; comforums/1.0)' },
      redirect: 'follow',
      next: { revalidate: 86400 },
    });
    if (!response.ok) return NextResponse.json({ image: null });
    const html = await response.text();

    const candidates = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ];
    let image = null;
    for (const pattern of candidates) {
      const match = html.match(pattern);
      if (match?.[1]) {
        image = match[1].replace(/&amp;/g, '&').replace(/&#x2F;/g, '/');
        break;
      }
    }
    if (image && /^https://(lastfm..fbsbx.com|lastfm.scdn.co|.*last.fm)/i.test(image)) {
      return NextResponse.json({ image }, { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } });
    }
    return NextResponse.json({ image: null }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return NextResponse.json({ image: null }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }
}
