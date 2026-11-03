import { LABEL } from '@/lib/roles';

// Members get no badge. rich / known / respected are cosmetic; the rest carry powers.
const STYLE = {
  rich: 'border-[#e2b857]/30 bg-[#e2b857]/10 text-[#e2b857]',
  known: 'border-[#5eb1d9]/30 bg-[#5eb1d9]/10 text-[#5eb1d9]',
  respected: 'border-[#5fbf8f]/30 bg-[#5fbf8f]/10 text-[#5fbf8f]',
  mod: 'border-[#8b8ff5]/30 bg-[#8b8ff5]/10 text-[#a5a8f8]',
  co_owner: 'border-[#e08a6b]/30 bg-[#e08a6b]/10 text-[#e8a085]',
  owner: 'border-white/20 bg-white/10 text-white',
};

export default function RoleBadge({ role, className = '' }) {
  if (!STYLE[role]) return null;
  return (
    <span className={`inline-flex h-[18px] items-center rounded-full border px-2 text-[11px] font-medium leading-none ${STYLE[role]} ${className}`}>
      {LABEL[role]}
    </span>
  );
}
