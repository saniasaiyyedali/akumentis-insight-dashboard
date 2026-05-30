import { motion } from 'framer-motion';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { useState, useMemo } from 'react';

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function getColor(value: number, max: number) {
  const ratio = max > 0 ? value / max : 0;
  if (ratio > 0.8) return '#ef4444';
  if (ratio > 0.6) return '#f59e0b';
  if (ratio > 0.4) return '#22c55e';
  if (ratio > 0.2) return '#3b82f6';
  return '#6366f1';
}

export function TreemapChart() {
  const { treemapData, setActiveNode, employees, showDrillDown, loadingState } = useWorkforce();
  const [hovered, setHovered] = useState<{ name: string; parent: string; value: number; vacancyPct: number } | null>(null);

  const { flat, maxVal } = useMemo(() => {
    if (!treemapData || treemapData.length === 0) return { flat: [], maxVal: 0 };
    const max = Math.max(...treemapData.map(d => d.value));
    return { flat: [...treemapData].sort((a, b) => b.value - a.value), maxVal: max };
  }, [treemapData]);

  if (loadingState.treemap && flat.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-[300px] bg-slate-50 rounded" />
      </div>
    );
  }

  if (flat.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-4"
      >
        <h3 className="text-sm font-semibold text-slate-900 mb-4">HQ Treemap</h3>
        <div className="text-center py-6 text-slate-400">
          <p className="text-sm">No treemap data available</p>
        </div>
      </motion.div>
    );
  }

  const total = flat.length;
  const cols = Math.ceil(Math.sqrt(total));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">HQ Treemap</h3>
          <p className="text-[10px] text-slate-400">Click to filter by HQ</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500" />Small</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" />Med</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" />Large</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500" />XLarge</span>
        </div>
      </div>

      {hovered && (
        <div className="mb-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="font-semibold text-slate-900">{hovered.name}</span>
          <span className="text-slate-400 ml-2">{hovered.parent}</span>
          <span className="text-slate-500 ml-2">{hovered.value} employees</span>
          <span className="text-red-500 ml-2">{hovered.vacancyPct}% vacant</span>
        </div>
      )}

      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {flat.map((item, i) => {
          const size = maxVal > 0 ? item.value / maxVal : 0;
          const color = getColor(item.value, maxVal);
          const showLabel = item.value > maxVal * 0.15;

          return (
            <button
              key={i}
              onClick={() => {
                const records = employees.filter(e => e.hq === item.name);
                if (records.length > 0) showDrillDown(records, `HQ: ${item.name}`);
                setActiveNode('hq', item.name);
              }}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
              className="relative rounded-lg p-2 text-left transition-all hover:ring-2 hover:ring-blue-400 overflow-hidden"
              style={{
                backgroundColor: color + '20',
                borderLeft: `3px solid ${color}`,
                minHeight: Math.max(60, 120 * size + 40) + 'px',
              }}
            >
              {showLabel && (
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {truncate(item.name, 20)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {item.value} · {item.vacancyPct}% vac
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
