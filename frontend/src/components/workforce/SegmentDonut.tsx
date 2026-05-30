import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Employee } from '../../contexts/WorkforceContext';
import { fmtMoney, toNum, totalRevenue, normalizeKey, groupBy } from '../../utils/displayUtils';
import { avgPct, type SlabData } from '../../utils/salesAnalytics';
import { InlineEmployeeDetail } from './InlineEmployeeDetail';

interface SegmentDonutProps {
  title: string;
  slabs: SlabData[];
  totalLabel: string;
  allEmployees: Employee[];
  onDrill?: (title: string, emps: Employee[]) => void;
}

export function SegmentDonut({ title, slabs, totalLabel, allEmployees, onDrill }: SegmentDonutProps) {
  const [expandedSlab, setExpandedSlab] = useState<string | null>(null);
  const [expandedEmp, setExpandedEmp] = useState<Employee | null>(null);
  const totalCount = slabs.reduce((s, d) => s + d.count, 0);
  const pieData = slabs.map(s => ({ name: s.name, value: s.count, color: s.color }));

  if (totalCount === 0) return null;

  const activeSlab = slabs.find(s => s.name === expandedSlab);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
      <div className="flex flex-col items-center">
        <div className="relative">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value"
                onClick={(_, i) => { const s = slabs[i]; if (s) { setExpandedSlab(expandedSlab === s.name ? null : s.name); setExpandedEmp(null); onDrill?.(`${title}: ${s.name}`, s.emps); } }}
                style={{ cursor: 'pointer' }}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center"><p className="text-xl font-bold text-slate-900">{totalCount}</p><p className="text-[9px] text-slate-500">{totalLabel}</p></div>
          </div>
        </div>
        <div className="w-full space-y-0.5 mt-2">
          {slabs.map(slab => (
            <button key={slab.name} onClick={() => { setExpandedSlab(expandedSlab === slab.name ? null : slab.name); setExpandedEmp(null); onDrill?.(`${title}: ${slab.name}`, slab.emps); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs ${expandedSlab === slab.name ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slab.color }} />
              <span className="font-medium text-slate-700 flex-1">{slab.name}</span>
              <span className="font-bold">{slab.count}</span>
              <span className="text-slate-400">{fmtMoney(slab.revenue)}</span>
              {expandedSlab === slab.name ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 text-slate-300" />}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeSlab && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden border-t border-slate-100 pt-3">
            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">{activeSlab.name} — inline breakdown</p>
            <InlineSlabBreakdown emps={activeSlab.emps} allEmployees={allEmployees} expandedEmp={expandedEmp} onSelectEmp={setExpandedEmp} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InlineSlabBreakdown({ emps, allEmployees, expandedEmp, onSelectEmp }: {
  emps: Employee[]; allEmployees: Employee[]; expandedEmp: Employee | null; onSelectEmp: (e: Employee | null) => void;
}) {
  const zones = groupBy(emps, e => normalizeKey(String(e.zone || 'Unknown')));
  const rows = [...zones.entries()].map(([zone, g]) => ({
    zone, state: normalizeKey(String(g[0]?.state || '')),
    hq: normalizeKey(String(g[0]?.hq || '')),
    count: g.length, revenue: totalRevenue(g),
    ach: avgPct(g, 'apr_ach'), growth: avgPct(g, 'growth'), cov: avgPct(g, 'april26_cov'),
    emps: g,
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  return (
    <div className="space-y-2">
      {rows.map(row => (
        <div key={row.zone} className="border border-slate-100 rounded-lg p-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 text-[10px]">
            <MetricCell label="Zone" value={row.zone} />
            <MetricCell label="State" value={row.state} />
            <MetricCell label="Revenue" value={fmtMoney(row.revenue)} bold />
            <MetricCell label="Ach" value={`${row.ach.toFixed(1)}%`} />
            <MetricCell label="Growth" value={`${row.growth >= 0 ? '+' : ''}${row.growth.toFixed(1)}%`} />
            <MetricCell label="Coverage" value={`${row.cov.toFixed(1)}%`} />
            <MetricCell label="People" value={String(row.count)} />
            <MetricCell label="Contrib" value={`${totalRevenue(allEmployees) > 0 ? ((row.revenue / totalRevenue(allEmployees)) * 100).toFixed(1) : 0}%`} />
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {row.emps.slice(0, 5).map((e, i) => (
              <button key={i} onClick={() => onSelectEmp(expandedEmp?.name === e.name ? null : e)}
                className={`text-[9px] px-1.5 py-0.5 rounded border ${expandedEmp?.name === e.name ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 border-slate-200 hover:border-blue-200'}`}>
                {String(e.name)} · {fmtMoney(toNum(e.net_sale_apr_26))}
              </button>
            ))}
          </div>
        </div>
      ))}
      {expandedEmp && (
        <InlineEmployeeDetail employee={expandedEmp} allEmployees={allEmployees} onClose={() => onSelectEmp(null)} compact />
      )}
    </div>
  );
}

function MetricCell({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div><p className="text-slate-400">{label}</p><p className={bold ? 'font-bold text-emerald-600' : 'text-slate-800'}>{value}</p></div>
  );
}
