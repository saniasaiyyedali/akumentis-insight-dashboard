import { useState, useRef, useEffect } from 'react';
import { useWorkforce, type Employee } from '../../contexts/WorkforceContext';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalSearch() {
  const { searchQuery, setSearchQuery, employees, openDrawer } = useWorkforce();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Employee[]>([]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    const q = searchQuery.toLowerCase();
    const matches = employees
      .filter(e => {
        return Object.values(e).some(v =>
          v !== null && String(v).toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
    setSuggestions(matches);
  }, [searchQuery, employees]);

  const getMatchedField = (emp: Record<string, unknown>, q: string): string => {
    for (const [key, val] of Object.entries(emp)) {
      if (val !== null && String(val).toLowerCase().includes(q)) return key;
    }
    return 'unknown';
  };

  const allColumns = employees.length > 0 ? Object.keys(employees[0]) : [];

  return (
    <div className="relative w-full">
      <div className={`relative flex items-center transition-all duration-200 bg-white border rounded-xl ${
        focused ? 'ring-2 ring-blue-400 border-blue-300' : 'border-slate-200'
      }`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={`Search ${allColumns.length} columns...`}
          className="w-full pl-9 pr-8 py-2.5 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSuggestions([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {suggestions.length > 0 && focused && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {suggestions.map((s, i) => {
              const field = getMatchedField(s as Record<string, unknown>, searchQuery.toLowerCase());
              return (
                <button
                  key={i}
                  onMouseDown={() => { openDrawer(s); setFocused(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{String(s.name || '-')}</span>
                    <span className="text-slate-400">#{s.empCode}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono">
                      {field}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{String(s.hq || '-')}</span>
                    <span>{String(s.division || '-')}</span>
                    <span>{String(s.dsgn || '-')}</span>
                  </div>
                </button>
              );
            })}
            <div className="px-4 py-2 text-[10px] text-slate-400 bg-slate-50 rounded-b-xl flex justify-between">
              <span>Searching across all {allColumns.length} columns</span>
              <span>{employees.length} records</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
