// Profile photo, or the first letters of the name tinted with the member's accent color.
export default function Avatar({ user, size = 32, className = '' }) {
  const name = user.display_name || user.username;
  const style = { width: size, height: size };
  if (user.avatar_id)
    return <img src={`/m/${user.avatar_id}`} alt="" loading="lazy" style={style} className={`shrink-0 rounded-full object-cover ${className}`} />;
  const accent = user.accent || '#6366f1';
  return (
    <div
      aria-hidden
      style={{ ...style, background: `${accent}2e`, color: accent, fontSize: Math.max(11, size * 0.38) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${className}`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
