export default function PremiumName({ user, premium, children }) {
  const color = premium && /^#[0-9a-fA-F]{6}$/.test(user.name_color || '') ? user.name_color : undefined;
  const effect = premium && ['glow', 'gradient', 'shimmer'].includes(user.name_effect) ? user.name_effect : '';
  return <span className={effect ? `premium-name premium-name-${effect}` : ''} style={color ? { color, '--name-color': color } : undefined}>{children}</span>;
}
