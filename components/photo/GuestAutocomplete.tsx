import React, { useEffect, useState } from 'react';
import type { GuestRecord } from '../../types';
import { formatGuestSubtitle, searchGuests } from '../../utils/guestIndex';

interface GuestAutocompleteProps {
  query: string;
  onSelect: (guest: GuestRecord) => void;
  visible: boolean;
}

export const GuestAutocomplete: React.FC<GuestAutocompleteProps> = ({
  query,
  onSelect,
  visible,
}) => {
  const [results, setResults] = useState<GuestRecord[]>([]);

  useEffect(() => {
    if (!visible || query.trim().length < 1) {
      setResults([]);
      return;
    }
    setResults(searchGuests(query, 8));
  }, [query, visible]);

  if (!visible || results.length === 0) return null;

  return (
    <ul
      className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#222]"
      role="listbox"
      aria-label="賓客建議"
    >
      {results.map((guest) => (
        <li key={guest.id}>
          <button
            type="button"
            role="option"
            onClick={() => onSelect(guest)}
            className="flex w-full flex-col px-4 py-3 text-left hover:bg-white/5"
          >
            <span className="text-sm font-medium text-white">{guest.name}</span>
            <span className="text-xs text-white/50">{formatGuestSubtitle(guest)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
