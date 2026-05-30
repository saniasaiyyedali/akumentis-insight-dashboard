import { type Employee } from '../../contexts/WorkforceContext';
import { toNum, fmtMoney, fmtPct, totalRevenue } from '../../utils/displayUtils';
import { X, Users, DollarSign, Percent, TrendingUp, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  name: string;
  emps: Employee[];
  totalOrgRevenue: number;
  totalOrgEmployees: number;
}

function avgMetric(emps: Employee[], field: string, isPct = false): number {
  const vals = emps.map(e => toNum(e[field]) * (isPct ? 100 : 1)).filter(v => v !== 0);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function achievementSlab(val: number): string {
  if (val <= 0) return 'N/A';
  if (val >= 100) return '>100%';
  if (val >= 90) return '90-100%';
  if (val >= 80) return '80-90%';
  return '<80%';
}

function growthSlabLabel(val: number): string {
  if (val >= 20) return '20%+';
  if (val >= 10) return '10-20%';
  if (val >= 0) return '0-10%';
  return '<0%';
}

const ACH_SLAB_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '>100%': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  '90-100%': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '80-90%': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '<80%': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'N/A': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
};

const GR_SLAB_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '20%+': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  '10-20%': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  '0-10%': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '<0%': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'N/A': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
};

export function DetailPanel({ open, onClose, name, emps, totalOrgRevenue, totalOrgEmployees }: DetailPanelProps) {
  const rev = totalRevenue(emps);
  const ach = avgMetric(emps, 'apr_ach', true);
  const gr = avgMetric(emps, 'growth', true);
  const cov = avgMetric(emps, 'april26_cov', true);
  const contribPct = totalOrgRevenue > 0 ? (rev / totalOrgRevenue) * 100 : 0;
  const achSlab = achievementSlab(ach);
  const grSlab = growthSlabLabel(gr);
  const achStyle = ACH_SLAB_COLORS[achSlab] || ACH_SLAB_COLORS['N/A'];
  const grStyle = GR_SLAB_COLORS[grSlab] || GR_SLAB_COLORS['N/A'];

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 z-40" />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 truncate">{name}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{fmtMoney(rev)}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Revenue</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-900">{emps.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Employees</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] text-slate-500 uppercase">Achievement</span>
                  </div>
                  <p className={`text-lg font-bold ${ach >= 90 ? 'text-emerald-600' : ach >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(ach)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] text-slate-500 uppercase">Growth</span>
                  </div>
                  <p className={`text-lg font-bold ${gr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{gr >= 0 ? '+' : ''}{fmtPct(gr)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-[10px] text-slate-500 uppercase">Coverage</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{cov > 0 ? fmtPct(cov) : 'N/A'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-[10px] text-slate-500 uppercase">Contribution</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{fmtPct(contribPct)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance Slab</h4>
                <div className={`rounded-xl p-4 text-center ${achStyle.bg} border ${achStyle.border}`}>
                  <p className={`text-2xl font-bold ${achStyle.text}`}>{achSlab}</p>
                  <p className="text-xs text-slate-500 mt-1">Achievement Level</p>
                </div>

                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Growth Slab</h4>
                <div className={`rounded-xl p-4 text-center ${grStyle.bg} border ${grStyle.border}`}>
                  <p className={`text-2xl font-bold ${grStyle.text}`}>{grSlab}</p>
                  <p className="text-xs text-slate-500 mt-1">Growth Level</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <p className="text-[10px] text-slate-400 text-center">
                  {((emps.length / totalOrgEmployees) * 100).toFixed(1)}% of organization · {emps.length} of {totalOrgEmployees} employees
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}