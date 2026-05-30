import { useState } from 'react';
import { Award, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Employee } from '../../contexts/WorkforceContext';
import { fmtMoney, toNum } from '../../utils/displayUtils';
import { pct, computeMatrix, type MatrixQuadrant } from '../../utils/salesAnalytics';
import { InlineEmployeeDetail } from './InlineEmployeeDetail';
import { InlineDrillSection } from './InlineDrillSection';

const quadrantConfig: { key: MatrixQuadrant; label: string; desc: string; color: string; icon: typeof Award }[] = [
  { key: 'stars', label: 'Stars', desc: 'High Ach + Growth', color: 'bg-emerald-100 border-emerald-300 text-emerald-800', icon: Award },
  { key: 'performers', label: 'Performers', desc: 'High Ach', color: 'bg-blue-100 border-blue-300 text-blue-800', icon: Target },
  { key: 'growers', label: 'Growers', desc: 'High Growth', color: 'bg-amber-100 border-amber-300 text-amber-800', icon: TrendingUp },
  { key: 'concerns', label: 'Concerns', desc: 'Needs Action', color: 'bg-red-100 border-red-300 text-red-800', icon: AlertTriangle },
];

interface PerformanceMatrixProps {
  title: string;
  roleEmps: Employee[];
  allEmployees: Employee[];
  allActive: Employee[];
}

export function PerformanceMatrix({ title, roleEmps, allEmployees, allActive }: PerformanceMatrixProps) {
  const [matrixFilter, setMatrixFilter] = useState<'all' | MatrixQuadrant>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drillAll, setDrillAll] = useState<{ title: string; emps: Employee[] } | null>(null);

  const matrixData = computeMatrix(roleEmps);
  const selectedQuadrant = matrixFilter === 'all' ? null : matrixData[matrixFilter];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-3">{roleEmps.length} people in scope</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quadrantConfig.map(q => {
          const emps = matrixData[q.key];
          const Icon = q.icon;
          const isSelected = matrixFilter === q.key;
          return (
            <button key={q.key} onClick={() => setMatrixFilter(isSelected ? 'all' : q.key)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${q.color} ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
              <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3.5 h-3.5" /><span className="text-xs font-bold">{q.label}</span></div>
              <p className="text-xl font-bold">{emps.length}</p>
              <p className="text-[9px] opacity-70">{fmtMoney(emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0))}</p>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedQuadrant && selectedQuadrant.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-slate-800 mb-2">{quadrantConfig.find(q => q.key === matrixFilter)?.label} — ownership</h4>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 border-b"><th className="text-left py-1 px-2">Name</th><th className="text-left py-1 px-2">Zone</th><th className="text-left py-1 px-2">State</th><th className="text-left py-1 px-2">HQ</th><th className="text-right py-1 px-2">Rev</th><th className="text-right py-1 px-2">Ach</th><th className="text-right py-1 px-2">Gr</th></tr></thead>
                <tbody>
                  {selectedQuadrant.slice(0, 25).map((emp, i) => (
                    <tr key={i} onClick={() => setSelectedEmployee(selectedEmployee?.name === emp.name ? null : emp)}
                      className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${selectedEmployee?.name === emp.name ? 'bg-blue-50' : ''}`}>
                      <td className="py-1 px-2 font-medium truncate max-w-[100px]">{String(emp.name)}</td>
                      <td className="py-1 px-2 text-slate-500">{String(emp.zone || '-')}</td>
                      <td className="py-1 px-2 text-slate-500">{String(emp.state || '-')}</td>
                      <td className="py-1 px-2 text-slate-500">{String(emp.hq || '-')}</td>
                      <td className="py-1 px-2 text-right">{fmtMoney(toNum(emp.net_sale_apr_26))}</td>
                      <td className="py-1 px-2 text-right">{pct(emp, 'apr_ach').toFixed(1)}%</td>
                      <td className="py-1 px-2 text-right">{pct(emp, 'growth').toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedQuadrant.length > 25 && (
              <button onClick={() => setDrillAll({ title: `${title} ${matrixFilter}`, emps: selectedQuadrant })} className="text-xs text-blue-600 mt-2">
                View all {selectedQuadrant.length} with full drilldown →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEmployee && (
          <div className="mt-3"><InlineEmployeeDetail employee={selectedEmployee} allEmployees={allEmployees} onClose={() => setSelectedEmployee(null)} compact /></div>
        )}
        {drillAll && (
          <div className="mt-3"><InlineDrillSection title={drillAll.title} emps={drillAll.emps} allActive={allActive} onClose={() => setDrillAll(null)} /></div>
        )}
      </AnimatePresence>
    </div>
  );
}
