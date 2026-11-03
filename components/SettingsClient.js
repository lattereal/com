'use client';

import { useState } from 'react';
import { saveProfile, savePremiumProfile, setAvatar, removeAvatar, setBanner, removeBanner, addSong, deleteSong } from '@/app/actions-social';
import { changePassword } from '@/app/actions';
import ActionForm from '@/components/ActionForm';
import CropUpload from '@/components/CropUpload';
import { ACCENTS } from '@/lib/util';
import { userRoles } from '@/lib/roles';

const sections = ['profile', 'appearance', 'music', 'account'];
const premiumRoles = ['rich', 'respected', 'known', 'owner'];
const premiumSocials = ['website', 'discord', 'github', 'telegram', 'instagram', 'youtube', 'tiktok', 'x'];
const themes = ['default', 'midnight', 'rose', 'forest', 'ocean'];
const effects = ['sparkle', 'glow', 'gradient', 'shimmer', 'none'];
const area = 'w-full rounded border border-line bg-bg p-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none';

function Card({ title, hint, children }) {
  return <section className="mb-4 rounded border border-line bg-surface p-5 sm:p-6"><h2 className="text-base font-medium">{title}</h2>{hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}<div className="mt-4">{children}</div></section>;
}

export default function SettingsClient({ user, bio, songs }) {
  const [section, setSection] = useState('profile');
  const premium = userRoles(user).some((r) => premiumRoles.includes(r));
  const socials = user.socials || {};
  return (
    <div className="max-w-[760px]">
      <div className="mb-7"><p className="mb-1 text-xs tracking-widest text-muted">your account</p><h1 className="text-2xl font-medium">settings</h1><p className="mt-1 text-sm text-muted">manage your profile and account preferences.</p></div>
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-line pb-3" aria-label="settings sections">
        {sections.map((s) => <button key={s} type="button" onClick={() => setSection(s)} aria-pressed={section === s} className={section === s ? 'rounded bg-[#242428] px-3 py-2 text-sm text-fg' : 'rounded px-3 py-2 text-sm text-muted hover:bg-[#1a1a1e] hover:text-fg'}>{s}</button>)}
      </nav>
      {section === 'profile' && <><Card title="profile details" hint="how other members see you."><ActionForm action={saveProfile} label="save profile" wrapClass="flex flex-col gap-4" footClass="flex justify-end"><label className="flex flex-col gap-1.5 text-sm">display name<input name="display_name" defaultValue={user.display_name || ''} maxLength={32} placeholder={user.username} className="input" /><span className="text-xs text-muted">shown instead of @{user.username}; your username never changes.</span></label><label className="flex flex-col gap-1.5 text-sm">bio<textarea name="bio" defaultValue={bio || ''} maxLength={500} rows={4} placeholder="a few lines about you" className={area} /></label><fieldset><legend className="mb-2 text-sm">accent color</legend><div className="flex flex-wrap gap-3">{ACCENTS.map((c) => <label key={c} className="cursor-pointer"><input type="radio" name="accent" value={c} defaultChecked={user.accent === c} className="peer sr-only" aria-label={c} /><span style={{ background: c, '--tw-ring-color': c }} className="block h-7 w-7 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-focus-visible:ring-2" /></label>)}</div></fieldset></ActionForm></Card></>}
      {section === 'profile' && <Card title="premium profile" hint="extra profile styling is available to Rich, Respected, Known, and site owners.">
        {premium ? <ActionForm action={savePremiumProfile} resetOnSuccess={false} label="save premium settings" wrapClass="flex flex-col gap-5" footClass="flex justify-end">
          <label className="flex flex-col gap-1.5 text-sm">name color<input name="name_color" type="color" defaultValue={/^#[0-9a-fA-F]{6}$/.test(user.name_color || '') ? user.name_color : '#ff3b3b'} className="h-11 w-20 cursor-pointer rounded border border-line bg-bg p-1" /><span className="text-xs text-muted">changes the color of your display name across your profile.</span></label>
          <label className="flex flex-col gap-1.5 text-sm">name effect<select name="name_effect" defaultValue={effects.includes(user.name_effect) ? user.name_effect : 'sparkle'} className="input">{effects.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          <label className="flex flex-col gap-1.5 text-sm">profile theme<select name="profile_theme" defaultValue={themes.includes(user.profile_theme) ? user.profile_theme : 'default'} className="input">{themes.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          <div><p className="mb-2 text-sm">social links</p><div className="grid gap-3 sm:grid-cols-2">{premiumSocials.map((key) => <label key={key} className="flex flex-col gap-1 text-xs text-muted">{key}<input name={`social_${key}`} defaultValue={socials[key] || ''} placeholder={key === 'website' ? 'https://example.com' : 'profile link'} className="input" /></label>)}</div><p className="mt-2 text-xs text-muted">only links you add are shown on your profile.</p></div>
        </ActionForm> : <div className="rounded border border-line bg-bg p-4 text-sm text-muted">These options are locked. Rich, Respected, and Known members can customize name colors, effects, themes, and social links. <a href="https://t.me/comforumscc" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">contact us on Telegram</a> if you want to ask about a rank.</div>}
      </Card>}
      {section === 'appearance' && <><Card title="profile photo" hint="choose and crop a square image. png, jpg, gif or webp · up to 2 mb."><div className="mb-4 flex items-center gap-4"><div className="h-16 w-16 overflow-hidden rounded-full border-4 border-surface bg-bg">{user.avatar_id ? <img src={`/m/${user.avatar_id}`} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm text-muted">{user.username.slice(0,2)}</div>}</div><span className="text-xs text-muted">square crop · 512 × 512</span></div><CropUpload action={setAvatar} label="save profile photo" aspect={1} />{user.avatar_id && <form action={removeAvatar} className="mt-3"><button className="text-xs text-muted hover:text-fg">remove photo</button></form>}</Card><Card title="profile banner" hint="choose a wide image and crop it to fit your profile. up to 4 mb.">{user.banner_id && <img src={`/m/${user.banner_id}`} alt="current banner" className="mb-3 aspect-[3/1] w-full rounded border border-line object-cover" />}<CropUpload action={setBanner} label="save banner" aspect={3} />{user.banner_id && <form action={removeBanner} className="mt-3"><button className="text-xs text-muted hover:text-fg">remove banner</button></form> }</Card></>}
      {section === 'music' && <Card title="profile songs" hint="up to 5 audio files. they appear on your profile.">{songs.length > 0 && <ul className="mb-5 divide-y divide-line border-y border-line">{songs.map((s) => <li key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="min-w-0 truncate">{s.title}{s.artist && <span className="text-muted"> · {s.artist}</span>}</span><form action={deleteSong}><input type="hidden" name="id" value={s.id} /><button className="text-[13px] text-muted hover:text-red-300">remove</button></form></li>)}</ul>}<ActionForm action={addSong} label="add song" wrapClass="flex flex-col gap-3" footClass="flex justify-end"><div className="flex gap-3"><input name="title" required maxLength={80} placeholder="title" aria-label="song title" className="input" /><input name="artist" maxLength={60} placeholder="artist" aria-label="artist" className="input" /></div><input name="file" type="file" required accept="audio/*" aria-label="audio file" className="text-sm text-muted" /></ActionForm></Card>}
      {section === 'account' && <Card title="password" hint="there is no email on file, so a forgotten password can only be reset by an administrator."><ActionForm action={changePassword} label="change password" wrapClass="flex flex-col gap-3" footClass="flex justify-end"><input name="current" type="password" required autoComplete="current-password" placeholder="current password" aria-label="current password" className="input" /><input name="next" type="password" required minLength={8} autoComplete="new-password" placeholder="new password (8+ characters)" aria-label="new password" className="input" /></ActionForm></Card>}
    </div>
  );
}
