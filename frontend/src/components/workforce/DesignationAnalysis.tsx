import { motion } from 'framer-motion';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DesignationAnalysis() {
  const { designations, setActiveNode, employees, showDrillDown, loadingState } = useWorkforce();

  if (loadingState.designations && (!designations || designations.length === 0)) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-[300px] bg-slate-50 rounded" />
      </div>
    );
  }

  if (!designations || designations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-4"
      >
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Designation Distribution</h3>
        <div className="text-center py-6 text-slate-400">
          <p className="text-sm">No designation data available</p>
        </div>
      </motion.div>
    );
  }

  const sorted = [...designations].sort((a, b) => b.value - a.value);

  const handleBarClick = (entry: { name?: string }) => {
    if (entry.name) {
      const records = employees.filter(e => e.dsgn === entry.name || e.designation === entry.name);
      if (records.length > 0) showDrillDown(records, `Designation: ${entry.name}`);
      setActiveNode('dsgn', entry.name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4"
    >
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Designation Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
          onClick={(e) => { if (e?.activeLabel) handleBarClick({ name: String(e.activeLabel) }); }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
          <Tooltip formatter={(value: unknown) => [Number(value).toLocaleString(), 'Employees']} />
          <Bar dataKey="value" name="Employees" fill="#ec4899" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
