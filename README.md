# ComForums

Next.js 14 (app router, JS) · Tailwind · Postgres · username + password auth (bcrypt + signed HttpOnly cookie).

## What's in v2
- **Accounts**: username + password only, no email. One account per network (a keyed hash of the signup IP is stored, never the IP). The first account to register becomes **owner**.
- **Roles**: members can hold multiple roles: member, rich, known, respected, mod, co-owner and owner. Cosmetic badges can be combined with staff roles; permissions use the highest assigned role. Owners can rename usernames and delete non-owner accounts. Nobody can be made owner from the UI.
- **Categories**: `/admin/categories` (co-owner, owner) add / rename / reorder / delete categories and add / edit / delete boards.
- **Friends + DMs**: send a request from a profile or `/friends`; once accepted you can message at `/messages`.
- **Chat**: `/chat` is a lounge for everyone. Text, images, audio, video and voice notes (mic button). DMs use the same component.
- **Profiles**: public `/profiles` directory ranked by role, with searchable clickable profile cards. Individual profiles include photo, display name, bio, accent color, hashtag groups (`/g/<tag>`), up to 5 songs, and a Content tab. Uploads are public or password protected.

## Setup
1. `npm install`
2. Create a Neon (or Supabase) Postgres DB; copy `.env.example` to `.env.local` and fill it in.
3. `npm run db:setup`. This is safe to re-run and **upgrades existing databases in place**, including the multi-role column and index (v1 admins become owners; email columns are dropped; text categories become real categories).
4. `npm run dev`, register (you become owner). For local testing with several accounts set `IP_LOCK=off`.
5. Deploy on Vercel with the same env vars. Keep `IP_LOCK` on in production.

## Things to know
- **Files live in Postgres** (`media` table), so there is no separate storage service. Vercel limits request bodies to about 4.5 MB, so uploads are capped at 4 MB (avatars 2 MB). If you outgrow that, move `lib/media.js` and `app/m/[id]/route.js` to Vercel Blob or S3.
- Uploads are checked by their real bytes (png, jpg, gif, webp, mp3, m4a, ogg, wav, mp4, webm). SVG and everything else is rejected. Files are served with `nosniff` and a sandbox CSP.
- **Chat is polling** every 2.5 s, which works on Vercel without a websocket server. Voice is voice notes, not live calls. Live voice rooms need WebRTC with a service such as LiveKit.
- **No email means no self-serve password reset.** A co-owner or owner resets it from `/admin/members` (shows a temporary password once).
- **One account per IP** blocks people who share a network (family, dorm, school, mobile carriers). Release a lock from `/admin/members`. On Vercel the client IP comes from a header Vercel sets; behind any other proxy, make sure `x-forwarded-for` can't be spoofed.
- Moderators can open password-protected uploads so rule-breaking content can't hide behind a password.

## Before real traffic
- `lib/ratelimit.js` is in-memory. Replace with Upstash Redis on Vercel.
- CSP allows inline scripts (Next bootstrap). Move to a nonce-based CSP in middleware to tighten it.
- Chat and DM history is never pruned. Add a cleanup job when it grows.
- Privacy, Terms and Rules are placeholder drafts.
