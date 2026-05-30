import { motion } from 'framer-motion';
import { useWorkforce } from '../../contexts/WorkforceContext';
import {
  Database, Users, UserCheck, UserX, AlertTriangle,
  RefreshCw, Columns, MapPin, Building2,
} from 'lucide-react';

export function DataQualityPanel() {
  const { dataQuality, employees, showDrillDown, loadingState } = useWorkforce();

  if (loadingState.dataQuality && !dataQuality) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!dataQuality) return null;

  const cards = [
    { label: 'Total Records', value: dataQuality.totalRecords.toLocaleString(), icon: Database, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Columns', value: dataQuality.totalColumns, icon: Columns, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Missing Values', value: dataQuality.missingValues.toLocaleString(), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Missing HQ', value: dataQuality.missingHq.toLocaleString(), icon: Building2, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Missing State', value: dataQuality.missingState.toLocaleString(), icon: MapPin, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Missing Designation', value: dataQuality.missingDsgn.toLocaleString(), icon: UserX, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'Duplicate Codes', value: dataQuality.duplicateEmpCodes, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Duplicate Names', value: dataQuality.duplicateNames, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-100' },
  ];

  const handleCardClick = (card: typeof cards[0]) => {
    switch (card.label) {
      case 'Total Records':
        if (employees.length > 0) showDrillDown(employees, 'All Records');
        break;
      case 'Missing Values': {
        const missing = employees.filter(e => Object.values(e).some(v => v === null || v === undefined || v === ''));
        if (missing.length > 0) showDrillDown(missing, 'Records with Missing Values');
        break;
      }
      case 'Missing HQ': {
        const missing = employees.filter(e => !e.hq);
        if (missing.length > 0) showDrillDown(missing, 'Records Missing HQ');
        break;
      }
      case 'Missing State': {
        const missing = employees.filter(e => !e.state);
        if (missing.length > 0) showDrillDown(missing, 'Records Missing State');
        break;
      }
      case 'Missing Designation': {
        const missing = employees.filter(e => !e.dsgn && !e.designation);
        if (missing.length > 0) showDrillDown(missing, 'Records Missing Designation');
        break;
      }
      case 'Duplicate Codes': {
        const codes = employees.map(e => e.empCode).filter(Boolean);
        const dupes = codes.filter((c, i) => codes.indexOf(c) !== i);
        const dupeRecords = employees.filter(e => dupes.includes(e.empCode));
        if (dupeRecords.length > 0) showDrillDown(dupeRecords, 'Duplicate Employee Codes');
        break;
      }
      case 'Duplicate Names': {
        const names = employees.map(e => e.name).filter(Boolean);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        const dupeRecords = employees.filter(e => dupes.includes(e.name));
        if (dupeRecords.length > 0) showDrillDown(dupeRecords, 'Duplicate Names');
        break;
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100">
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Data Quality Panel</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <RefreshCw className="w-3 h-3" />
          <span suppressHydrationWarning>
            {dataQuality.lastRefresh
              ? new Date(dataQuality.lastRefresh).toLocaleString()
              : 'N/A'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleCardClick(card)}
              className="p-3 rounded-lg border border-slate-100 text-left hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1 rounded ${card.bg}`}>
                  <Icon className={`w-3 h-3 ${card.color}`} />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{card.value}</p>
              <p className="text-[10px] text-slate-500">{card.label}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
