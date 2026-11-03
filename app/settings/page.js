import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { saveProfile, setAvatar, removeAvatar, setBanner, removeBanner, addSong, deleteSong } from '@/app/actions-social';
import { changePassword } from '@/app/actions';
import ActionForm from '@/components/ActionForm';
import Avatar from '@/components/Avatar';
import { ACCENTS } from '@/lib/util';

export const metadata = { title: 'Settings' };

const area = 'w-full rounded border border-line bg-bg p-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none';
const fileCls = 'text-sm text-muted file:mr-3 file:rounded file:border file:border-line file:bg-bg file:px-3 file:py-1.5 file:text-sm file:text-fg';

function Card({ title, hint, children }) {
  return (
    <section className="mb-4 rounded border border-line bg-surface p-6">
      <h2 className="text-base font-medium">{title}</h2>
      {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function Settings() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [[p], songs] = await Promise.all([
    sql`select bio from users where id = ${user.id}`,
    sql`select id, title, artist from profile_songs where user_id = ${user.id} order by id`,
  ]);

  return (
    <div className="max-w-[640px]">
      <h1 className="mb-8 text-2xl font-medium text-muted">Settings</h1>
      <Card title="Photo" hint="png, jpg, gif or webp, up to 2 mb.">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={64} />
          <div className="flex flex-col gap-3">
            <ActionForm action={setAvatar} label="Upload" wrapClass="flex flex-wrap items-center gap-3" footClass="">
              <input name="file" type="file" required accept="image/png,image/jpeg,image/gif,image/webp" aria-label="Profile photo" className={fileCls} />
            </ActionForm>
            {user.avatar_id && <form action={removeAvatar}><button className="text-[13px] text-muted hover:text-fg hover:underline">Remove photo</button></form>}
          </div>
        </div>
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-2 text-sm font-medium">profile banner</h3>
          <p className="mb-3 text-xs text-muted">wide images work best · up to 4 mb.</p>
          {user.banner_id && <img src={`/m/${user.banner_id}`} alt="Current profile banner" className="mb-3 h-24 w-full rounded border border-line object-cover" />}
          <ActionForm action={setBanner} label="Upload banner" wrapClass="flex flex-wrap items-center gap-3" footClass="">
            <input name="file" type="file" required accept="image/png,image/jpeg,image/gif,image/webp" aria-label="Profile banner" className={fileCls} />
          </ActionForm>
          {user.banner_id && <form action={removeBanner} className="mt-3"><button className="text-[13px] text-muted hover:text-fg hover:underline">Remove banner</button></form>}
        </div>
      </Card>

      <Card title="Profile">
        <ActionForm action={saveProfile} label="Save profile" wrapClass="flex flex-col gap-4" footClass="flex justify-end">
          <label className="flex flex-col gap-1.5 text-sm">Display name
            <input name="display_name" defaultValue={user.display_name || ''} maxLength={32} placeholder={user.username} className="input" />
            <span className="text-xs text-muted">shown instead of @{user.username}. your username never changes.</span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">Bio
            <textarea name="bio" defaultValue={p.bio} maxLength={500} rows={4} placeholder="a few lines about you" className={area} />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm">Accent color</legend>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="accent" value={c} defaultChecked={user.accent === c} className="peer sr-only" aria-label={c} />
                  <span style={{ background: c, '--tw-ring-color': c }} className="block h-7 w-7 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-focus-visible:ring-2" />
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </Card>

      <Card title="Songs" hint="up to 5 audio files. they appear in your profile.">
        {songs.length > 0 && <ul className="mb-5 divide-y divide-line border-y border-line">
          {songs.map((s) => <li key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="min-w-0 truncate">{s.title}{s.artist && <span className="text-muted"> · {s.artist}</span>}</span>
            <form action={deleteSong}><input type="hidden" name="id" value={s.id} /><button className="text-[13px] text-muted hover:text-red-300">Remove</button></form>
          </li>)}
        </ul>}
        <ActionForm action={addSong} label="Add song" wrapClass="flex flex-col gap-3" footClass="flex justify-end">
          <div className="flex gap-3">
            <input name="title" required maxLength={80} placeholder="title" aria-label="Song title" className="input" />
            <input name="artist" maxLength={60} placeholder="artist" aria-label="Artist" className="input" />
          </div>
          <input name="file" type="file" required accept="audio/*" aria-label="Audio file" className={fileCls} />
        </ActionForm>
      </Card>

      <Card title="Password" hint="there is no email on file, so a forgotten password can only be reset by an administrator.">
        <ActionForm action={changePassword} label="Change password" wrapClass="flex flex-col gap-3" footClass="flex justify-end">
          <input name="current" type="password" required autoComplete="current-password" placeholder="current password" aria-label="Current password" className="input" />
          <input name="next" type="password" required minLength={8} autoComplete="new-password" placeholder="new password (8+ characters)" aria-label="New password" className="input" />
        </ActionForm>
      </Card>
    </div>
  );
}
