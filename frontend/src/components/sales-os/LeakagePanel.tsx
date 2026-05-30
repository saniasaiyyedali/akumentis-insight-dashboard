import { motion } from 'framer-motion';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import type { OSLeakage } from '../../types/salesOS';

function fmtMoney(v: number) {
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return `₹${Math.round(v).toLocaleString()}`;
}

interface Props {
  leakage: OSLeakage;
  onDrill: (dimension: string, name: string) => void;
  onBack: () => void;
}

export function LeakagePanel({ leakage, onDrill, onBack }: Props) {
  const sections = [
    { title: 'Top Risk Zones', items: leakage.topZones, dim: 'zone' },
    { title: 'Top Risk States', items: leakage.topStates, dim: 'state' },
    { title: 'Top Risk RMs', items: leakage.topRMs, dim: 'rm' },
    { title: 'Top Risk BMs', items: leakage.topBMs, dim: 'bm' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900">← Back to workspace</button>

      <div className="rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 text-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8" />
          <div>
            <p className="text-sm opacity-80">Revenue At Risk</p>
            <p className="text-3xl font-bold">{fmtMoney(leakage.revenueAtRisk)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div><p className="opacity-70">At Risk</p><p className="font-bold">{leakage.atRiskCount}</p></div>
          <div><p className="opacity-70">Low Achievement</p><p className="font-bold">{leakage.achievementRiskCount}</p></div>
          <div><p className="opacity-70">Negative Growth</p><p className="font-bold">{leakage.negativeGrowthCount}</p></div>
        </div>
      </div>

      {sections.map(sec => sec.items.length > 0 && (
        <div key={sec.title}>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{sec.title}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {sec.items.map(item => (
              <button key={item.name} onClick={() => onDrill(sec.dim, item.name)}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-red-300 hover:shadow-md transition-all">
                <div>
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-red-600 font-medium">{fmtMoney(item.revenueAtRisk)} at risk</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-500" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
