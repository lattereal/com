export default function PremiumName({ user, premium, children }) {
  const color = premium && /^#[0-9a-fA-F]{6}$/.test(user.name_color || '') ? user.name_color : premium ? '#ff3b3b' : undefined;
  const effect = premium ? (['sparkle', 'glow', 'gradient', 'shimmer', 'none'].includes(user.name_effect) ? (user.name_effect === 'none' ? '' : user.name_effect) : 'sparkle') : '';
  return (
    <span className={effect ? `premium-name premium-name-${effect}` : 'premium-name'} style={color ? { color, '--name-color': color } : undefined}>
      {children}
      {effect === 'sparkle' && <span aria-hidden="true" className="premium-name-particles"><i>✦</i><i>✧</i><i>·</i><i>✦</i></span>}
    </span>
  );
}
