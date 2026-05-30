import { motion } from 'framer-motion';
import { fmtMoney, fmtPct } from '../../../utils/format';
import type { LandscapeNode } from './orgVisualUtils';

interface Props {
  node: LandscapeNode | null;
  levelLabel: string;
}

function MetricBar({
  label,
  display,
  pct,
  color,
}: {
  label: string;
  display: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-800 tabular-nums">{display}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function OrgNodeDrilldown({ node, levelLabel }: Props) {
  if (!node) return null;

  const maxRev = node.revenue * 1.2 || 1;
  const maxRisk = Math.max(node.revenueAtRisk * 1.5, 1);
  const maxTeam = Math.max(node.count, 10);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-indigo-200/50 bg-gradient-to-r from-white via-indigo-50/30 to-white p-5 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-3 h-3 rounded-full ring-4 ring-white shadow"
            style={{
              backgroundColor:
                node.revenueAtRisk > 0 && node.achievement < 70
                  ? '#ef4444'
                  : node.achievement >= 85
                    ? '#22c55e'
                    : '#eab308',
            }}
          />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{node.label}</h3>
            <p className="text-[10px] text-slate-500">{levelLabel} · {node.kind}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricBar label="Achievement" display={fmtPct(node.achievement)} pct={node.achievement} color="bg-emerald-500" />
          <MetricBar
            label="Growth"
            display={`${node.growth >= 0 ? '+' : ''}${fmtPct(node.growth)}`}
            pct={Math.min(100, Math.abs(node.growth))}
            color="bg-blue-500"
          />
          <MetricBar label="Revenue" display={fmtMoney(node.revenue)} pct={(node.revenue / maxRev) * 100} color="bg-indigo-500" />
          <MetricBar label="Risk" display={fmtMoney(node.revenueAtRisk)} pct={(node.revenueAtRisk / maxRisk) * 100} color="bg-red-500" />
          <MetricBar label="Team size" display={String(node.count)} pct={(node.count / maxTeam) * 100} color="bg-violet-500" />
          <MetricBar label="Contribution" display={fmtPct(node.contributionPct)} pct={node.contributionPct} color="bg-amber-500" />
        </div>
      </div>
    </motion.div>
  );
}
