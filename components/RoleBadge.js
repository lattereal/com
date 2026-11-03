import { LABEL, userRoles } from '@/lib/roles';

const LABEL_STYLE = 'inline-flex items-center border-l border-line pl-2 text-[11px] font-medium text-muted';

export default function RoleBadge({ role, roles, className = '' }) {
  const assigned = userRoles({ role, roles }).filter((r) => r !== 'member');
  if (!assigned.length) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {assigned.map((r) => (
        <span key={r} className={LABEL_STYLE}>{LABEL[r].toLowerCase()}</span>
      ))}
    </span>
  );
}
