import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fmtMoney, fmtPct } from '../../utils/format';
import type { SegmentMember } from './SegmentExpansion';

interface Props {
  rm: { top: SegmentMember[]; bottom: SegmentMember[] };
  bm: { top: SegmentMember[]; bottom: SegmentMember[] };
}

function LeaderboardCard({
  title,
  icon: Icon,
  items,
  variant,
  maxRev,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: SegmentMember[];
  variant: 'top' | 'bottom';
  maxRev: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${variant === 'top' ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <Icon className={`w-4 h-4 ${variant === 'top' ? 'text-emerald-600' : 'text-red-600'}`} />
        </div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No data</p>
      ) : (
        <div className="space-y-3">
          {items.map((p, i) => {
            const pct = maxRev > 0 ? (p.revenue / maxRev) * 100 : 0;
            return (
              <motion.div key={(p.empCode || p.name) + i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 truncate flex-1">
                    <span className="text-slate-400 font-mono mr-1">#{i + 1}</span>{p.name}
                  </span>
                  <span className="text-emerald-600 font-bold ml-2">{fmtMoney(p.revenue)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    className={`h-full rounded-full ${variant === 'top' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                </div>
                <div className="flex gap-3 text-[10px] text-slate-500">
                  <span>Ach {fmtPct(p.achievement)}</span>
                  <span>Gr {p.growth >= 0 ? '+' : ''}{fmtPct(p.growth)}</span>
                  <span>Contrib {fmtPct(p.contributionPct)}</span>
                  {p.revenueAtRisk > 0 && <span className="text-red-500">Risk {fmtMoney(p.revenueAtRisk)}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopBottomLeaderboards({ rm, bm }: Props) {
  const maxRm = Math.max(...rm.top.map(p => p.revenue), 1);
  const maxBm = Math.max(...bm.top.map(p => p.revenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <LeaderboardCard title="Top 10 RM" icon={TrendingUp} items={rm.top} variant="top" maxRev={maxRm} />
      <LeaderboardCard title="Bottom 10 RM" icon={TrendingDown} items={rm.bottom} variant="bottom" maxRev={maxRm} />
      <LeaderboardCard title="Top 10 BM" icon={TrendingUp} items={bm.top} variant="top" maxRev={maxBm} />
      <LeaderboardCard title="Bottom 10 BM" icon={TrendingDown} items={bm.bottom} variant="bottom" maxRev={maxBm} />
    </div>
  );
}
