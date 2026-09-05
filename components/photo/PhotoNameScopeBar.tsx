import React from 'react';
import type { NameSearchScope } from '../../types';
import { formatTableLabel } from '../../utils/tableLabels';

interface PhotoNameScopeBarProps {
  scope: NameSearchScope;
  onScopeChange: (scope: NameSearchScope) => void;
  guestTable?: number | null;
  compact?: boolean;
}

export const PhotoNameScopeBar: React.FC<PhotoNameScopeBarProps> = ({
  scope,
  onScopeChange,
  guestTable,
  compact = false,
}) => (
  <div
    className={`flex gap-1.5 ${compact ? '' : 'mt-3'}`}
    role="group"
    aria-label="搜尋範圍"
  >
    <button
      type="button"
      onClick={() => onScopeChange('person')}
      className={`flex-1 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
        scope === 'person'
          ? 'border-[var(--photo-accent)] bg-[var(--photo-accent)]/20 text-[var(--photo-gold-light)] shadow-[0_0_16px_var(--photo-warm-glow)]'
          : 'border-white/12 bg-white/5 text-white/55 active:bg-white/10'
      }`}
    >
      只有本人
    </button>
    <button
      type="button"
      onClick={() => onScopeChange('table')}
      className={`flex-1 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
        scope === 'table'
          ? 'border-[var(--photo-accent)] bg-[var(--photo-accent)]/20 text-[var(--photo-gold-light)] shadow-[0_0_16px_var(--photo-warm-glow)]'
          : 'border-white/12 bg-white/5 text-white/55 active:bg-white/10'
      }`}
    >
      含同桌{guestTable != null ? ` · ${formatTableLabel(guestTable)}` : ''}
    </button>
  </div>
);
