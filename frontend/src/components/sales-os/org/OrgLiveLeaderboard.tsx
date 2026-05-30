import { motion, AnimatePresence } from 'framer-motion';
import { fmtMoney, fmtPct } from '../../../utils/format';
import type { PersonRow } from './OrgLevelInsightPanel';

interface Props {
  top: PersonRow[];
  bottom: PersonRow[];
  visible: boolean;
}

function Rail({ title, items, variant }: { title: string; items: PersonRow[]; variant: 'top' | 'bottom' }) {
  const maxRev = Math.max(...items.map(p => p.revenue), 1);
  const accent = variant === 'top' ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-orange-500';

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</p>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.slice(0, 5).map((p, i) => (
            <motion.div
              key={p.empCode || p.name}
              layout
              initial={{ opacity: 0, x: variant === 'top' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28, delay: i * 0.04 }}
              className="relative flex items-center gap-3 rounded-xl bg-white/90 border border-slate-100/80 px-3 py-2.5 shadow-sm overflow-hidden"
            >
              <motion.span
                layout
                className={`text-lg font-black tabular-nums w-7 ${variant === 'top' ? 'text-emerald-600' : 'text-rose-500'}`}
              >
                {i + 1}
              </motion.span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                <div className="h-1.5 mt-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${accent}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.revenue / maxRev) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 shrink-0">{fmtMoney(p.revenue)}</span>
              <span className="text-[9px] text-slate-400 shrink-0 hidden sm:block">{fmtPct(p.achievement)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <p className="text-xs text-slate-400 py-6 text-center">—</p>
        )}
      </div>
    </div>
  );
}

export function OrgLiveLeaderboard({ top, bottom, visible }: Props) {
  if (!visible) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-5 sm:p-6"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-4">Live leaderboard</p>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        <Rail title="Top 5" items={top} variant="top" />
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
        <Rail title="Bottom 5" items={bottom} variant="bottom" />
      </div>
    </motion.section>
  );
}
