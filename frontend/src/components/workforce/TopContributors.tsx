import { useMemo } from 'react';
import { type Employee } from '../../contexts/WorkforceContext';
import {
  toNum, fmt, fmtMoney, totalRevenue,
  sms, rms, bms,
} from '../../utils/displayUtils';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useState } from 'react';

type Tab = 'hq' | 'sm' | 'rm' | 'bm';

export function TopContributors({ employees, onOpenDrawer, totalRev }: {
  employees: Employee[];
  onOpenDrawer: (emp: Employee) => void;
  totalRev: number;
}) {
  const [tab, setTab] = useState<Tab>('hq');
  const active = useMemo(() => employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name), [employees]);

  const tabs = [
    { key: 'hq' as Tab, label: 'HQs' },
    { key: 'sm' as Tab, label: 'SMs' },
    { key: 'rm' as Tab, label: 'RMs' },
    { key: 'bm' as Tab, label: 'BMs' },
  ];

  const entries = useMemo(() => {
    if (tab === 'hq') {
      const hqMap = new Map<string, Employee[]>();
      for (const e of active) {
        const key = String(e.hq || '').toUpperCase();
        if (!hqMap.has(key)) hqMap.set(key, []);
        hqMap.get(key)!.push(e);
      }
      return [...hqMap.entries()]
        .map(([name, g]) => {
          const rev = totalRevenue(g);
          return {
            name, rev, contribPct: totalRev > 0 ? (rev / totalRev) * 100 : 0,
            avgAch: g.reduce((s, e) => s + toNum(e.apr_ach), 0) / g.length,
            avgGrowth: g.reduce((s, e) => s + toNum(e.growth), 0) / g.length,
            avgCov: g.reduce((s, e) => s + toNum(e.april26_cov), 0) / g.length,
            count: g.length, emps: g,
          };
        })
        .sort((a, b) => b.rev - a.rev)
        .slice(0, 10);
    }
    const pool = tab === 'sm' ? sms(employees) : tab === 'rm' ? rms(employees) : bms(employees);
    return pool
      .map(e => ({
        name: String(e.name || ''), rev: totalRevenue([e]),
        contribPct: totalRev > 0 ? (totalRevenue([e]) / totalRev) * 100 : 0,
        avgAch: toNum(e.apr_ach), avgGrowth: toNum(e.growth), avgCov: toNum(e.april26_cov),
        count: 1, emps: [e],
      }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 10);
  }, [tab, active, employees, totalRev]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">Top Contributors</h3>
      </div>
      <div className="flex gap-1 mb-3">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[9px] text-slate-400 border-b border-slate-100">
              <th className="text-left py-1 px-1 w-5">#</th>
              <th className="text-left py-1 px-1">Name</th>
              <th className="text-right py-1 px-1">Revenue</th>
              <th className="text-right py-1 px-1">Contrib</th>
              <th className="text-right py-1 px-1">Ach %</th>
              <th className="text-right py-1 px-1">Growth</th>
              <th className="text-right py-1 px-1">Coverage</th>
              {tab === 'hq' && <th className="text-right py-1 px-1">Count</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} onClick={() => {
                if (tab !== 'hq' && e.emps[0]) onOpenDrawer(e.emps[0]);
              }}
                className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${tab !== 'hq' ? 'cursor-pointer' : ''}`}
              >
                <td className="py-1 px-1">
                  <span className={`text-[10px] font-mono font-bold ${i < 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                </td>
                <td className="py-1 px-1 font-medium text-slate-800 max-w-[100px] truncate">{e.name}</td>
                <td className="py-1 px-1 text-right font-semibold text-slate-900">{fmtMoney(e.rev)}</td>
                <td className="py-1 px-1 text-right text-slate-500">{fmt(e.contribPct, 1)}%</td>
                <td className="py-1 px-1 text-right">
                  <span className={`font-semibold ${e.avgAch >= 90 ? 'text-emerald-600' : e.avgAch >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                    {fmt(e.avgAch, 1)}%
                  </span>
                </td>
                <td className="py-1 px-1 text-right text-slate-600">{fmt(e.avgGrowth, 1)}%</td>
                <td className="py-1 px-1 text-right text-slate-600">{fmt(e.avgCov, 1)}%</td>
                {tab === 'hq' && <td className="py-1 px-1 text-right text-slate-400">{e.count}</td>}
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={8} className="text-center py-4 text-slate-400">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
