import { motion } from 'framer-motion';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { normalizeKey } from '../../utils/displayUtils';

export function RmPerformance() {
  const { rmData, setActiveNode, employees, showDrillDown, loadingState } = useWorkforce();

  const chartData = useMemo(() => {
    if (!rmData?.byHq) return [];
    return rmData.byHq.slice(0, 10);
  }, [rmData]);

  if (loadingState.rm && !rmData) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-[250px] bg-slate-50 rounded" />
      </div>
    );
  }

  if (!rmData || rmData.total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <h3 className="text-sm font-semibold text-slate-900">RM Performance</h3>
        </div>
        <div className="text-center py-6 text-slate-400">
          <p className="text-sm">No RM data available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <h3 className="text-sm font-semibold text-slate-900">RM Performance</h3>
        </div>
        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          {rmData.total} RM
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData} layout="vertical"
            margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
            onClick={(e) => {
              if (e?.activeLabel) {
                const hq = String(e.activeLabel);
                const records = employees.filter(emp => normalizeKey(emp.hq) === hq && emp.dsgn === 'RM');
                if (records.length > 0) showDrillDown(records, `RM in ${hq}`);
                setActiveNode('hq', hq);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
            <Tooltip formatter={(value: unknown) => [String(value ?? 0), 'RM Count']} />
            <Bar dataKey="count" name="RM Count" fill="#f59e0b" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-col justify-center items-center">
          <p className="text-3xl font-bold text-slate-900">{rmData.total}</p>
          <p className="text-xs text-slate-500">Total RMs</p>
          <p className="text-xs text-slate-400 mt-4">Click bars to filter by HQ</p>
        </div>
      </div>
    </motion.div>
  );
}
