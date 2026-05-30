import { useMemo, useState } from 'react';
import { useWorkforce, type Employee } from '../contexts/WorkforceContext';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Target, Award, AlertTriangle } from 'lucide-react';
import {
  toNum, fmt, fmtMoney, fmtPct, totalRevenue, activeEmployees, bms, rms,
} from '../utils/displayUtils';

type Tab = 'rm' | 'bm';

export function Performance() {
  const { employees, openDrawer, showDrilldownPanel } = useWorkforce();
  const allEmps = useMemo(() => activeEmployees(employees), [employees]);
  const allBms = useMemo(() => bms(employees), [employees]);
  const allRms = useMemo(() => rms(employees), [employees]);
  const totalRevAll = useMemo(() => totalRevenue(allEmps), [allEmps]);

  const [tab, setTab] = useState<Tab>('rm');
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'stars' | 'performers' | 'growers' | 'concerns'>('all');

  const roleEmps = tab === 'rm' ? allRms : allBms;
  const roleLabel = tab === 'rm' ? 'RM' : 'BM';

  const sortedByAch = useMemo(() => {
    return [...roleEmps].filter(e => toNum(e.apr_ach) > 0).sort((a, b) => toNum(b.apr_ach) - toNum(a.apr_ach));
  }, [roleEmps]);

  const sortedByGrowth = useMemo(() => {
    return [...roleEmps].sort((a, b) => toNum(b.growth) - toNum(a.growth));
  }, [roleEmps]);

  const sortedByRevenue = useMemo(() => {
    return [...roleEmps].sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26));
  }, [roleEmps]);

  const top5 = sortedByAch.slice(0, 5);
  const bottom5 = [...sortedByAch].reverse().slice(0, 5);
  const top5Growth = sortedByGrowth.slice(0, 5);
  const bottom5Growth = [...sortedByGrowth].reverse().slice(0, 5);

  // Performance vs Growth Matrix
  const matrixData = useMemo(() => {
    const data = roleEmps.filter(e => toNum(e.apr_ach) > 0);
    const quadrants = {
      stars: [] as Employee[],      // High Ach, High Growth (>90% ach, >0% growth)
      performers: [] as Employee[], // High Ach, Low Growth (>90% ach, <=0% growth)
      growers: [] as Employee[],    // Low Ach, High Growth (<90% ach, >0% growth)
      concerns: [] as Employee[],   // Low Ach, Low Growth (<90% ach, <=0% growth)
    };

    for (const e of data) {
      const ach = toNum(e.apr_ach);
      const gr = toNum(e.growth);
      if (ach >= 90 && gr > 0) quadrants.stars.push(e);
      else if (ach >= 90 && gr <= 0) quadrants.performers.push(e);
      else if (ach < 90 && gr > 0) quadrants.growers.push(e);
      else quadrants.concerns.push(e);
    }
    return quadrants;
  }, [roleEmps]);

  const quadrantConfig: { key: 'stars' | 'performers' | 'growers' | 'concerns'; label: string; desc: string; color: string; icon: typeof Award }[] = [
    { key: 'stars', label: 'Stars', desc: 'High Ach, High Growth', color: 'bg-emerald-100 border-emerald-300 text-emerald-800', icon: Award },
    { key: 'performers', label: 'Performers', desc: 'High Ach, Low Growth', color: 'bg-blue-100 border-blue-300 text-blue-800', icon: Target },
    { key: 'growers', label: 'Growers', desc: 'Low Ach, High Growth', color: 'bg-amber-100 border-amber-300 text-amber-800', icon: TrendingUp },
    { key: 'concerns', label: 'Concerns', desc: 'Low Ach, Low Growth', color: 'bg-red-100 border-red-300 text-red-800', icon: AlertTriangle },
  ];

  const selectedQuadrant = useMemo(() => {
    if (matrixFilter === 'all') return null;
    return matrixData[matrixFilter];
  }, [matrixData, matrixFilter]);

  return (
    <div className="space-y-5 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">RM & BM Performance</h1>
          <p className="text-xs text-slate-400">{allEmps.length} employees · {fmtMoney(totalRevAll)} revenue</p>
        </div>
      </motion.div>

      <BreadcrumbNav />
      <GlobalFilterBar
        extraFilters={[
          { key: 'ach_slab', label: 'Achievement Slab', options: ['>100%', '90-100%', '80-90%', '<80%'] },
          { key: 'growth_slab', label: 'Growth Slab', options: ['<0%', '0-10%', '10-20%', '20%+'] },
        ]}
      />

      {/* Tab selector */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => setTab('rm')}
          className={`text-sm px-4 py-2 rounded-md font-medium transition-all ${tab === 'rm' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >RM Performance</button>
        <button onClick={() => setTab('bm')}
          className={`text-sm px-4 py-2 rounded-md font-medium transition-all ${tab === 'bm' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >BM Performance</button>
      </div>

      {/* Top/Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Performers by Achievement */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Top 5 {roleLabel}s by Achievement</h3>
          </div>
          <div className="space-y-2">
            {top5.map((emp, i) => {
              const rev = totalRevenue([emp]);
              return (
                <button key={i} onClick={() => openDrawer(emp)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors text-left"
                >
                  <span className={`text-xs font-mono font-bold w-5 ${i < 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{String(emp.hq || '')} · {String(emp.zone || '')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">{fmtPct(toNum(emp.apr_ach))}</p>
                    <p className="text-[10px] text-slate-400">{fmtMoney(rev)}</p>
                  </div>
                </button>
              );
            })}
            {top5.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data available</p>}
          </div>
        </motion.div>

        {/* Bottom Performers by Achievement */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Bottom 5 {roleLabel}s by Achievement</h3>
          </div>
          <div className="space-y-2">
            {bottom5.map((emp, i) => {
              const rev = totalRevenue([emp]);
              return (
                <button key={i} onClick={() => openDrawer(emp)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  <span className="text-xs font-mono text-slate-400 w-5">
                    #{sortedByAch.length - i}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{String(emp.hq || '')} · {String(emp.zone || '')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-red-600">{fmtPct(toNum(emp.apr_ach))}</p>
                    <p className="text-[10px] text-slate-400">{fmtMoney(rev)}</p>
                  </div>
                </button>
              );
            })}
            {bottom5.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data available</p>}
          </div>
        </motion.div>

        {/* Top by Growth */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Top 5 {roleLabel}s by Growth</h3>
          </div>
          <div className="space-y-2">
            {top5Growth.map((emp, i) => {
              const gr = toNum(emp.growth);
              return (
                <button key={i} onClick={() => openDrawer(emp)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors text-left"
                >
                  <span className={`text-xs font-mono font-bold w-5 ${i < 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{String(emp.hq || '')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${gr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{gr >= 0 ? '+' : ''}{fmt(gr, 1)}%</p>
                    <p className="text-[10px] text-slate-400">{fmtPct(toNum(emp.apr_ach))} ach</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom by Growth */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Bottom 5 {roleLabel}s by Growth</h3>
          </div>
          <div className="space-y-2">
            {bottom5Growth.map((emp, i) => {
              const gr = toNum(emp.growth);
              return (
                <button key={i} onClick={() => openDrawer(emp)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  <span className="text-xs font-mono text-slate-400 w-5">
                    #{roleEmps.filter(e => toNum(e.growth) !== 0).length - i}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{String(emp.hq || '')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${gr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{gr >= 0 ? '+' : ''}{fmt(gr, 1)}%</p>
                    <p className="text-[10px] text-slate-400">{fmtPct(toNum(emp.apr_ach))} ach</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Performance vs Growth Matrix */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Performance vs Growth Matrix</h2>
        <p className="text-xs text-slate-400 mb-4">{roleLabel}s classified by Achievement and Growth</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quadrantConfig.map(q => {
            const emps = matrixData[q.key];
            const Icon = q.icon;
            const isSelected = matrixFilter === q.key;
            return (
              <button
                key={q.key}
                onClick={() => setMatrixFilter(isSelected ? 'all' : q.key)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${q.color} ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <h3 className="text-sm font-bold">{q.label}</h3>
                </div>
                <p className="text-[10px] opacity-70 mb-2">{q.desc}</p>
                <p className="text-2xl font-bold">{emps.length}</p>
                <p className="text-[10px] opacity-60">{roleLabel}s</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span>Rev: {fmtMoney(emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0))}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected quadrant detail */}
        {selectedQuadrant && selectedQuadrant.length > 0 && (
          <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              {quadrantConfig.find(q => q.key === matrixFilter)?.label} - {selectedQuadrant.length} {roleLabel}s
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left py-1.5 px-2">#</th>
                    <th className="text-left py-1.5 px-2">Name</th>
                    <th className="text-left py-1.5 px-2">HQ</th>
                    <th className="text-right py-1.5 px-2">Revenue</th>
                    <th className="text-right py-1.5 px-2">Ach %</th>
                    <th className="text-right py-1.5 px-2">Growth %</th>
                    <th className="text-right py-1.5 px-2">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuadrant.slice(0, 30).map((emp, i) => (
                    <tr key={i} onClick={() => openDrawer(emp)} className="hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                      <td className="py-1.5 px-2 text-slate-400">{i + 1}</td>
                      <td className="py-1.5 px-2 font-medium text-slate-900 truncate max-w-[120px]">{String(emp.name || '-')}</td>
                      <td className="py-1.5 px-2 text-slate-500">{String(emp.hq || '-')}</td>
                      <td className="py-1.5 px-2 text-right font-medium text-slate-900">{fmtMoney(toNum(emp.net_sale_apr_26))}</td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${toNum(emp.apr_ach) >= 90 ? 'text-emerald-600' : toNum(emp.apr_ach) >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                        {fmtPct(toNum(emp.apr_ach))}
                      </td>
                      <td className={`py-1.5 px-2 text-right ${toNum(emp.growth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {toNum(emp.growth) >= 0 ? '+' : ''}{fmt(toNum(emp.growth), 1)}%
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-500">{fmtPct(toNum(emp.april26_cov))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedQuadrant.length > 30 && (
                <button onClick={() => showDrilldownPanel(selectedQuadrant, `${matrixFilter} ${roleLabel}s`)}
                  className="w-full text-xs text-blue-600 hover:text-blue-700 py-2">
                  View all {selectedQuadrant.length} records →
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Revenue Leaders */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Revenue Leaders</h2>
        <p className="text-xs text-slate-400 mb-4">Top {roleLabel}s by revenue contribution</p>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="text-left py-1.5 px-2">#</th>
                  <th className="text-left py-1.5 px-2">Name</th>
                  <th className="text-left py-1.5 px-2">HQ</th>
                  <th className="text-right py-1.5 px-2">Revenue</th>
                  <th className="text-right py-1.5 px-2">Achievement</th>
                  <th className="text-right py-1.5 px-2">Growth</th>
                  <th className="text-right py-1.5 px-2">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {sortedByRevenue.slice(0, 15).map((emp, i) => {
                  const rev = totalRevenue([emp]);
                  return (
                    <tr key={i} onClick={() => openDrawer(emp)} className="hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                      <td className="py-1.5 px-2">
                        <span className={`text-xs font-mono font-bold ${i < 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-medium text-slate-900 truncate max-w-[120px]">{String(emp.name || '-')}</td>
                      <td className="py-1.5 px-2 text-slate-500 truncate max-w-[80px]">{String(emp.hq || '-')}</td>
                      <td className="py-1.5 px-2 text-right font-medium text-slate-900">{fmtMoney(rev)}</td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${toNum(emp.apr_ach) >= 90 ? 'text-emerald-600' : toNum(emp.apr_ach) >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                        {fmtPct(toNum(emp.apr_ach))}
                      </td>
                      <td className={`py-1.5 px-2 text-right ${toNum(emp.growth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {toNum(emp.growth) >= 0 ? '+' : ''}{fmt(toNum(emp.growth), 1)}%
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-500">{fmtPct(toNum(emp.april26_cov))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <RecordDrawer />
    </div>
  );
}