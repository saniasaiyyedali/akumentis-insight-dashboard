import { useState } from 'react';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchableSelect } from '../ui/SearchableSelect';

const DEFAULT_VISIBLE_KEYS = ['division', 'zone', 'state', 'hq', 'dsgn'];

export function GlobalFilterBar({ visibleKeys, extraFilters }: {
  visibleKeys?: string[];
  extraFilters?: { key: string; label: string; options: string[] }[];
}) {
  const { dynamicFilters, filters, setFilter, removeFilter, clearFilters, refreshData } = useWorkforce();
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!dynamicFilters || dynamicFilters.length === 0) return null;

  const keys = visibleKeys || DEFAULT_VISIBLE_KEYS;
  const visible = dynamicFilters.filter(f => keys.includes(f.key));

  const extra = extraFilters || [];
  const advanced = dynamicFilters.filter(f => !keys.includes(f.key) && !f.key.startsWith('_'));

  const activeFilters = Object.entries(filters).filter(([_, v]) => v && v !== 'all');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 z-30 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {visible.map(f => (
          <SearchableSelect
            key={f.key}
            options={f.options}
            value={filters[f.key] || ''}
            onChange={v => setFilter(f.key, v)}
            onClear={() => removeFilter(f.key)}
            placeholder={`All ${f.label}s`}
          />
        ))}

        {extra.map(f => (
          <SearchableSelect
            key={f.key}
            options={f.options}
            value={filters[f.key] || ''}
            onChange={v => setFilter(f.key, v)}
            onClear={() => removeFilter(f.key)}
            placeholder={f.label}
          />
        ))}

        {advanced.length > 0 && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs px-2.5 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <Filter className="w-3 h-3" />
            Advanced
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {activeFilters.length > 0 && (
          <>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              {activeFilters.length} active
            </span>
            <button
              onClick={clearFilters}
              className="text-xs px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </>
        )}

        <button
          onClick={refreshData}
          className="ml-auto text-xs px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      <AnimatePresence>
        {showAdvanced && advanced.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 flex-wrap pt-3 mt-3 border-t border-slate-100">
              {advanced.map(f => (
                <SearchableSelect
                  key={f.key}
                  options={f.options}
                  value={filters[f.key] || ''}
                  onChange={v => setFilter(f.key, v)}
                  onClear={() => removeFilter(f.key)}
                  placeholder={`All ${f.label}s`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
