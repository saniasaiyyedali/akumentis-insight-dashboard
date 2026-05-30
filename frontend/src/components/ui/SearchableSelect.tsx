import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onClear?: () => void;
}

export function SearchableSelect({ options, value, onChange, placeholder, onClear }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative min-w-[130px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-1 text-xs px-2.5 py-1.5 border rounded-lg bg-white text-left
          ${value ? 'text-slate-700 border-slate-200' : 'text-slate-400 border-slate-200'}
          hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors`}
      >
        <span className="truncate flex-1">{value || placeholder}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[280px] flex flex-col">
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-100">
            <Search className="w-3 h-3 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-xs bg-transparent border-none outline-none text-slate-700 placeholder-slate-400"
              onKeyDown={e => {
                if (e.key === 'Escape') { setOpen(false); setSearch(''); }
                if (e.key === 'Enter' && filtered.length > 0) {
                  onChange(filtered[0]);
                  setOpen(false);
                  setSearch('');
                }
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">No matches</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors
                    ${value === opt
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>

          {onClear && value && (
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); setSearch(''); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-t border-slate-100"
            >
              <X className="w-3 h-3" />
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}