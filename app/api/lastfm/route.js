import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const clean = (value, max) => String(value || '').trim().slice(0, max);

export async function GET(req) {
  const title = clean(req.nextUrl.searchParams.get('title'), 100);
  const artist = clean(req.nextUrl.searchParams.get('artist'), 80);
  if (!title || !artist) return NextResponse.json({ image: null });

  try {
    // Read artwork exposed in Last.fm's public search page metadata.
    const search = new URL('https://www.last.fm/search');
    search.searchParams.set('q', `${artist} ${title}`);
    const response = await fetch(search, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; comforums/1.0)', Accept: 'text/html' },
      redirect: 'follow',
      next: { revalidate: 86400 },
    });
    if (!response.ok) return NextResponse.json({ image: null });
    const html = await response.text();

    const match = html.match(/<meta\b(?=[^>]*\bproperty=["']og:image["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i)
      || html.match(/<meta\b(?=[^>]*\bcontent=["']([^"']+)["'])(?=[^>]*\bproperty=["']og:image["'])[^>]*>/i);
    const rawImage = match?.[1]?.replace(/&amp;/g, '&').replace(/&#x2F;/g, '/') || null;
    let image = null;
    if (rawImage) {
      const parsed = new URL(rawImage);
      const host = parsed.hostname.toLowerCase();
      if (parsed.protocol === 'https:' && (host === 'lastfm.freetls.fastly.net' || host.endsWith('.last.fm'))) image = parsed.toString();
    }

    return NextResponse.json({ image }, {
      headers: { 'Cache-Control': image ? 'public, max-age=86400, stale-while-revalidate=604800' : 'public, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ image: null }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }
}
