import { motion } from 'framer-motion';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS_FILLED = '#22c55e';
const COLORS_VACANT = '#ef4444';

export function VacancyIntelligence() {
  const { kpi, employees, showDrillDown, loadingState } = useWorkforce();

  if (loadingState.kpi && !kpi) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-[250px] bg-slate-50 rounded" />
      </div>
    );
  }

  if (!kpi) return null;

  const data = [
    { name: 'Filled', value: kpi.filledPositions, color: COLORS_FILLED },
    { name: 'Vacant', value: kpi.vacancies, color: COLORS_VACANT },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-4"
      >
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Vacancy Intelligence</h3>
        <div className="text-center py-6 text-slate-400">
          <p className="text-sm">No vacancy data available</p>
        </div>
      </motion.div>
    );
  }

  const handlePieClick = (entry: { name?: string }) => {
    if (entry.name === 'Filled') {
      const filled = employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name);
      if (filled.length > 0) showDrillDown(filled, 'Filled Positions');
    } else if (entry.name === 'Vacant') {
      const vacant = employees.filter(e => e.dsgn === 'ABOLISHED' || !e.name);
      if (vacant.length > 0) showDrillDown(vacant, 'Vacant Positions');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4"
    >
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Vacancy Intelligence</h3>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
              onClick={handlePieClick}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown) => [Number(value).toLocaleString(), '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
