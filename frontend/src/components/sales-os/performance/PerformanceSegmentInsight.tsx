import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fmtMoney, fmtPct } from '../../../utils/format';
import type { SegmentMember } from '../SegmentExpansion';

interface Aggregate {
  revenue: number;
  achievement: number;
  growth: number;
  contributionPct: number;
  revenueAtRisk: number;
  count: number;
}

interface Props {
  title: string;
  aggregate: Aggregate | null;
  topPerformers: SegmentMember[];
  bottomPerformers: SegmentMember[];
  totalCount: number;
  loading?: boolean;
}

function Leaderboard({
  title,
  icon: Icon,
  items,
  variant,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: SegmentMember[];
  variant: 'top' | 'bottom';
}) {
  const maxRev = Math.max(...items.map(p => p.revenue), 1);
  return (
    <div className="rounded-xl border border-slate-100/80 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${variant === 'top' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <Icon className={`w-4 h-4 ${variant === 'top' ? 'text-emerald-600' : 'text-rose-600'}`} />
        </div>
        <h4 className="text-xs font-bold text-slate-800">{title}</h4>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No data</p>
      ) : (
        <ul className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
          {items.map((p, i) => (
            <li key={`${p.empCode || p.name}-${i}`}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="font-semibold text-slate-800 truncate">
                  <span className="text-slate-300 font-mono mr-1">#{i + 1}</span>
                  {p.name}
                </span>
                <span className="text-emerald-600 font-bold shrink-0 ml-2">{fmtMoney(p.revenue)}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${variant === 'top' ? 'bg-emerald-500' : 'bg-rose-400'}`}
                  style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {fmtPct(p.achievement)} ach · {p.growth >= 0 ? '+' : ''}{fmtPct(p.growth)} gr
                {p.revenueAtRisk > 0 && <span className="text-red-500"> · Risk {fmtMoney(p.revenueAtRisk)}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PerformanceSegmentInsight({
  title,
  aggregate,
  topPerformers,
  bottomPerformers,
  totalCount,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white to-indigo-50/40 p-6 space-y-4">
        <div className="h-5 w-56 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-white/95 via-slate-50/50 to-violet-50/40 backdrop-blur-sm p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_30px_rgba(99,102,241,0.08)]"
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">{totalCount} in segment</p>
      </div>

      {aggregate && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
          {[
            { l: 'Count', v: String(aggregate.count ?? totalCount) },
            { l: 'Revenue', v: fmtMoney(aggregate.revenue) },
            { l: 'Achievement', v: fmtPct(aggregate.achievement) },
            { l: 'Growth', v: `${aggregate.growth >= 0 ? '+' : ''}${fmtPct(aggregate.growth)}` },
            { l: 'Revenue at risk', v: fmtMoney(aggregate.revenueAtRisk) },
            { l: 'Contribution', v: fmtPct(aggregate.contributionPct) },
          ].map(m => (
            <div
              key={m.l}
              className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{m.l}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">{m.v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Leaderboard title="Top performers" icon={TrendingUp} items={topPerformers} variant="top" />
        <Leaderboard title="Bottom performers" icon={TrendingDown} items={bottomPerformers} variant="bottom" />
      </div>
    </motion.div>
  );
}
