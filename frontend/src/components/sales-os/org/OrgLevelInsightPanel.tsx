import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ShieldAlert, PieChart } from 'lucide-react';
import { fmtMoney, fmtPct } from '../../../utils/format';
import type { OSSegment } from '../../../types/salesOS';

export interface RegionOwner {
  name: string;
  revenue: number;
  achievement: number;
  growth: number;
  contributionPct: number;
  revenueAtRisk: number;
  count: number;
}

export interface PersonRow {
  name: string;
  empCode: string;
  designation?: string;
  zone?: string;
  revenue: number;
  achievement: number;
  growth: number;
  contributionPct: number;
  revenueAtRisk: number;
  atRisk?: boolean;
}

interface Props {
  levelLabel: string;
  achievementDistribution: OSSegment[];
  growthDistribution: OSSegment[];
  regions: RegionOwner[];
  topPerformers: PersonRow[];
  bottomPerformers: PersonRow[];
  riskContributors: PersonRow[];
  loading?: boolean;
}

function DistChart({ title, data, icon: Icon }: { title: string; data: OSSegment[]; icon: typeof PieChart }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/80 p-4 h-[180px] flex items-center justify-center">
        <p className="text-xs text-slate-400">No distribution data</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
        <h3 className="text-xs font-bold text-slate-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data.map(s => ({ name: s.label, count: s.count, fill: s.color }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map(s => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OwnershipBars({ regions }: { regions: RegionOwner[] }) {
  const maxRev = Math.max(...regions.map(r => r.revenue), 1);
  if (!regions.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/80 p-4 min-h-[180px] flex items-center justify-center">
        <p className="text-xs text-slate-400">No ownership breakdown</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm">
      <h3 className="text-xs font-bold text-slate-800 mb-3">Revenue ownership</h3>
      <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
        {regions.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <div className="flex justify-between text-[10px] mb-1">
              <span className="font-medium text-slate-700 truncate flex-1">{r.name}</span>
              <span className="text-indigo-600 font-bold ml-2">{fmtMoney(r.revenue)}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${(r.revenue / maxRev) * 100}%` }}
                transition={{ duration: 0.4, delay: i * 0.02 }}
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">
              {fmtPct(r.contributionPct)} share · {fmtPct(r.achievement)} ach · {r.count} people
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PerformerList({
  title,
  icon: Icon,
  items,
  variant,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: PersonRow[];
  variant: 'top' | 'bottom';
}) {
  const maxRev = Math.max(...items.map(p => p.revenue), 1);
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${variant === 'top' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <Icon className={`w-3.5 h-3.5 ${variant === 'top' ? 'text-emerald-600' : 'text-rose-600'}`} />
        </div>
        <h3 className="text-xs font-bold text-slate-800">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No performers in this level</p>
      ) : (
        <ul className="space-y-2.5 max-h-[220px] overflow-y-auto">
          {items.map((p, i) => (
            <li key={`${p.empCode || p.name}-${i}`}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="font-medium text-slate-800 truncate">
                  <span className="text-slate-300 font-mono mr-1">#{i + 1}</span>
                  {p.name}
                </span>
                <span className="text-emerald-600 font-bold shrink-0 ml-2">{fmtMoney(p.revenue)}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${variant === 'top' ? 'bg-emerald-500' : 'bg-rose-400'}`}
                  style={{ width: `${maxRev > 0 ? (p.revenue / maxRev) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {fmtPct(p.achievement)} ach · {p.growth >= 0 ? '+' : ''}{fmtPct(p.growth)} gr
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RiskList({ items }: { items: PersonRow[] }) {
  const maxRisk = Math.max(...items.map(p => p.revenueAtRisk), 1);
  return (
    <div className="rounded-xl border border-red-100/80 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
        <h3 className="text-xs font-bold text-slate-800">Risk contributors</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No at-risk contributors at this level</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {items.map((p, i) => (
            <div key={`${p.empCode}-${i}`} className="rounded-lg bg-white/90 border border-red-50 px-3 py-2">
              <p className="text-[10px] font-semibold text-slate-800 truncate">{p.name}</p>
              <p className="text-sm font-bold text-red-600 mt-0.5">{fmtMoney(p.revenueAtRisk)}</p>
              <div className="h-1 bg-red-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${maxRisk > 0 ? (p.revenueAtRisk / maxRisk) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">{p.zone || p.designation || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgLevelInsightPanel({
  levelLabel,
  achievementDistribution,
  growthDistribution,
  regions,
  topPerformers,
  bottomPerformers,
  riskContributors,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-100/80 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <h2 className="text-sm font-bold text-slate-900">{levelLabel} analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DistChart title="Achievement distribution" data={achievementDistribution} icon={PieChart} />
        <DistChart title="Growth distribution" data={growthDistribution} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <OwnershipBars regions={regions} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PerformerList title="Top performers" icon={TrendingUp} items={topPerformers} variant="top" />
          <PerformerList title="Bottom performers" icon={TrendingDown} items={bottomPerformers} variant="bottom" />
        </div>
      </div>

      <RiskList items={riskContributors} />
    </motion.div>
  );
}
