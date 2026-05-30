import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { fmtMoney, fmtPct } from '../../../utils/format';

export interface RibbonLevel {
  level: string;
  label: string;
  count: number;
  teamSize: number;
  revenue: number;
  achievement: number;
  growth: number;
  revenueAtRisk: number;
  atRisk?: boolean;
}

const ACCENT: Record<string, { gradient: string; glow: string; border: string }> = {
  'BU HEAD': { gradient: 'from-indigo-500 to-indigo-600', glow: 'shadow-indigo-500/40', border: 'border-indigo-400' },
  NSM: { gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/40', border: 'border-violet-400' },
  SM: { gradient: 'from-blue-500 to-cyan-600', glow: 'shadow-blue-500/40', border: 'border-blue-400' },
  ZM: { gradient: 'from-teal-500 to-emerald-600', glow: 'shadow-teal-500/40', border: 'border-teal-400' },
  RM: { gradient: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/40', border: 'border-emerald-400' },
  BM: { gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/40', border: 'border-amber-400' },
};

interface Props {
  levels: RibbonLevel[];
  activeLevel: string | null;
  onSelect: (level: string) => void;
  loading?: boolean;
}

export function OrgHierarchyRibbon({ levels, activeLevel, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-3xl bg-slate-100/60 h-24 animate-pulse" />
    );
  }

  return (
    <section className="rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl p-3 sm:p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {levels.map((lv, i) => {
          const accent = ACCENT[lv.level] || ACCENT.RM;
          const active = activeLevel === lv.level;
          const size = lv.teamSize ?? lv.count;

          return (
            <div key={lv.level} className="flex items-center shrink-0">
              <motion.button
                type="button"
                onClick={() => onSelect(lv.level)}
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.96 }}
                animate={{
                  scale: active ? 1.05 : 1,
                  y: active ? -6 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`
                  group relative w-[100px] sm:w-[112px] rounded-2xl px-3 py-4 text-center transition-shadow duration-300
                  ${active
                    ? `bg-gradient-to-br ${accent.gradient} text-white ${accent.glow} shadow-2xl ring-2 ring-white/50 border-2 ${accent.border}`
                    : 'bg-white/80 text-slate-700 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-slate-300'}
                `}
              >
                {active && (
                  <motion.span
                    layoutId="org-ribbon-glow"
                    className="absolute inset-0 rounded-2xl bg-white/20 blur-md"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`relative block text-[10px] font-bold uppercase tracking-widest ${active ? 'text-white/90' : 'text-slate-500'}`}>
                  {lv.label.replace(' HEAD', '')}
                </span>
                <span className={`relative block text-2xl font-bold tabular-nums mt-1 ${active ? 'text-white' : 'text-slate-900'}`}>
                  {size}
                </span>
                <div
                  className={`
                    absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-44 rounded-xl border bg-slate-900/95 text-white p-3 text-left
                    opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-xl
                    ${active ? 'hidden' : ''}
                  `}
                >
                  <p className="text-[10px] text-slate-400 mb-1.5">{lv.label}</p>
                  <p className="text-xs">{fmtMoney(lv.revenue)} · {fmtPct(lv.achievement)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Risk {fmtMoney(lv.revenueAtRisk)}</p>
                </div>
              </motion.button>
              {i < levels.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 mx-1 shrink-0" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
