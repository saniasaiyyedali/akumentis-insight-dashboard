import { AlertTriangle } from 'lucide-react';
import { type Employee } from '../../contexts/WorkforceContext';
import { fmtMoney } from '../../utils/displayUtils';
import { computeLeakage } from '../../utils/salesAnalytics';

interface RevenueLeakageCenterProps {
  employees: Employee[];
  onDrill: (title: string, emps: Employee[]) => void;
}

export function RevenueLeakageCenter({ employees, onDrill }: RevenueLeakageCenterProps) {
  const leak = computeLeakage(employees);

  const tiles = [
    { label: 'Revenue At Risk', value: fmtMoney(leak.revenueAtRisk), emps: [...new Set([...leak.achRisk, ...leak.negGrowth, ...leak.coverageRisk])] },
    { label: 'Coverage Risk', value: String(leak.coverageRisk.length), emps: leak.coverageRisk },
    { label: 'Negative Growth', value: String(leak.negGrowth.length), emps: leak.negGrowth },
    { label: 'Achievement Risk', value: String(leak.achRisk.length), emps: leak.achRisk },
    { label: 'Top Risk Zone', value: leak.topRiskZones[0]?.name || '-', emps: leak.topRiskZones[0]?.emps || [] },
    { label: 'Top Risk State', value: leak.topRiskStates[0]?.name || '-', emps: leak.topRiskStates[0]?.emps || [] },
    { label: 'Top Risk RM', value: leak.topRiskRms[0]?.name ? String(leak.topRiskRms[0].name) : '-', emps: leak.topRiskRms },
    { label: 'Top Risk BM', value: leak.topRiskBms[0]?.name ? String(leak.topRiskBms[0].name) : '-', emps: leak.topRiskBms },
  ];

  return (
    <section className="bg-white border border-red-200 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        Revenue Leakage Center
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map(tile => (
          <button key={tile.label} onClick={() => tile.emps.length > 0 && onDrill(tile.label, tile.emps)}
            disabled={tile.emps.length === 0}
            className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-left hover:border-red-300 hover:shadow-sm transition-all disabled:opacity-50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{tile.label}</p>
            <p className="text-sm font-bold text-red-700 mt-0.5 truncate">{tile.value}</p>
            {tile.emps.length > 0 && <p className="text-[9px] text-slate-400 mt-1">{tile.emps.length} records · click to expand</p>}
          </button>
        ))}
      </div>
    </section>
  );
}
