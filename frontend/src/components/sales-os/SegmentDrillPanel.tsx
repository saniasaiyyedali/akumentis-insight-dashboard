import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { fmtMoney, fmtPct } from '../../utils/format';
import type { SegmentMember } from './SegmentExpansion';

interface Aggregate {
  revenue: number;
  achievement: number;
  growth: number;
  contributionPct: number;
  revenueAtRisk: number;
  count: number;
}

interface ZoneRow {
  name: string;
  revenue: number;
  achievement: number;
  growth: number;
  revenueAtRisk: number;
}

interface Props {
  title: string;
  aggregate: Aggregate | null;
  byZone: ZoneRow[];
  byState: ZoneRow[];
  topPerformers: SegmentMember[];
  bottomPerformers: SegmentMember[];
  totalCount: number;
  onClose: () => void;
}

export function SegmentDrillPanel({
  title, aggregate, byZone, byState, topPerformers, bottomPerformers, totalCount, onClose,
}: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-5 shadow-inner">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">{title}</h4>
              <p className="text-xs text-slate-500">{totalCount} managers in segment</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/80 text-slate-400"><X className="w-4 h-4" /></button>
          </div>

          {aggregate && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              {[
                { l: 'Revenue', v: fmtMoney(aggregate.revenue) },
                { l: 'Contribution', v: fmtPct(aggregate.contributionPct) },
                { l: 'Achievement', v: fmtPct(aggregate.achievement) },
                { l: 'Growth', v: `${aggregate.growth >= 0 ? '+' : ''}${fmtPct(aggregate.growth)}` },
                { l: 'At Risk', v: fmtMoney(aggregate.revenueAtRisk) },
              ].map(m => (
                <div key={m.l} className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase">{m.l}</p>
                  <p className="text-sm font-bold text-slate-900">{m.v}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {byZone.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-blue-500" /><h5 className="text-xs font-bold text-slate-700">Zone ownership</h5></div>
                <div className="space-y-2">
                  {byZone.map(z => (
                    <div key={z.name} className="flex items-center gap-2">
                      <span className="text-xs w-16 truncate text-slate-600">{z.name}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (z.revenue / (byZone[0]?.revenue || 1)) * 100)}%` }}
                          className="h-full bg-blue-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 w-12 text-right">{fmtPct(z.achievement)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <MiniLeaderboard title="Top performers" icon={TrendingUp} items={topPerformers} positive />
            <MiniLeaderboard title="Bottom performers" icon={TrendingDown} items={bottomPerformers} positive={false} />
          </div>

          {byState.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {byState.map(s => (
                <span key={s.name} className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                  {s.name}: {fmtMoney(s.revenue)} · {fmtPct(s.achievement)}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MiniLeaderboard({ title, icon: Icon, items, positive }: { title: string; icon: typeof TrendingUp; items: SegmentMember[]; positive: boolean }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${positive ? 'text-emerald-500' : 'text-red-500'}`} />
        <h5 className="text-xs font-bold text-slate-700">{title}</h5>
      </div>
      {items.length === 0 ? <p className="text-xs text-slate-400">—</p> : (
        <ul className="space-y-1.5">
          {items.map((p, i) => (
            <li key={p.empCode + i} className="text-xs">
              <span className="font-medium text-slate-800">{p.name}</span>
              <span className="text-slate-400 ml-1">· {p.zone}</span>
              <div className="text-[10px] text-slate-500">{fmtMoney(p.revenue)} · {fmtPct(p.achievement)} ach · {fmtPct(p.growth)} gr</div>
              {p.managerChain?.length > 0 && (
                <div className="text-[9px] text-slate-400 truncate">→ {p.managerChain.map(c => c.name).join(' → ')}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
