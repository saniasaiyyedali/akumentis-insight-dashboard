import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { fmtMoney, fmtPct } from '../../utils/format';
import type { SegmentMember } from './SegmentExpansion';

interface PerformerRow extends SegmentMember {}

interface Props {
  rm: { top: PerformerRow[]; bottom: PerformerRow[] };
  bm: { top: PerformerRow[]; bottom: PerformerRow[] };
}

function PerformerList({
  title,
  icon: Icon,
  items,
  variant,
  expandedId,
  onToggle,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: PerformerRow[];
  variant: 'top' | 'bottom';
  expandedId: string | null;
  onToggle: (id: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${variant === 'top' ? 'text-emerald-500' : 'text-red-500'}`} />
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-1">
        {items.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No data</p>}
        {items.map((p, i) => {
          const id = p.empCode || p.name;
          const open = expandedId === id;
          return (
            <div key={id + i}>
              <button
                onClick={() => onToggle(open ? null : id)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left text-xs"
              >
                <span className="w-5 text-slate-400 font-mono">#{i + 1}</span>
                <span className="flex-1 truncate font-medium text-slate-800">{p.name}</span>
                <span className="text-emerald-600 font-semibold">{fmtMoney(p.revenue)}</span>
                <span className={p.achievement >= 80 ? 'text-slate-500' : 'text-red-600'}>{fmtPct(p.achievement)}</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-7 mb-2">
                    <div className="bg-slate-50 rounded-lg p-3 text-[10px] space-y-1">
                      <p><span className="text-slate-400">Zone:</span> {p.zone} · {p.state}</p>
                      <p><span className="text-slate-400">Growth:</span> {p.growth >= 0 ? '+' : ''}{fmtPct(p.growth)} · <span className="text-slate-400">Risk:</span> {p.revenueAtRisk > 0 ? fmtMoney(p.revenueAtRisk) : 'None'}</p>
                      {p.managerChain?.length > 0 && (
                        <p className="text-slate-500 truncate">Chain: {p.managerChain.map(c => c.name).join(' → ')}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopBottomPerformers({ rm, bm }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <PerformerList title="Top 10 RM" icon={TrendingUp} items={rm.top} variant="top" expandedId={expanded} onToggle={setExpanded} />
      <PerformerList title="Bottom 10 RM" icon={TrendingDown} items={rm.bottom} variant="bottom" expandedId={expanded} onToggle={setExpanded} />
      <PerformerList title="Top 10 BM" icon={TrendingUp} items={bm.top} variant="top" expandedId={expanded} onToggle={setExpanded} />
      <PerformerList title="Bottom 10 BM" icon={TrendingDown} items={bm.bottom} variant="bottom" expandedId={expanded} onToggle={setExpanded} />
    </div>
  );
}
