import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const key = process.env.LASTFM_API_KEY;
  const title = (req.nextUrl.searchParams.get('title') || '').slice(0, 100);
  const artist = (req.nextUrl.searchParams.get('artist') || '').slice(0, 80);
  if (!key || !title || !artist) return NextResponse.json({ image: null }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.search = new URLSearchParams({ method: 'track.getInfo', api_key: key, artist, track: title, format: 'json' }).toString();
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return NextResponse.json({ image: null });
    const data = await response.json();
    const images = data?.track?.album?.image || [];
    const image = images.find((item) => item.size === 'extralarge')?.['#text'] || images.find((item) => item.size === 'large')?.['#text'] || null;
    return NextResponse.json({ image }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return NextResponse.json({ image: null });
  }
}
