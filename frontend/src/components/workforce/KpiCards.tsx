import { useWorkforce } from '../../contexts/WorkforceContext';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, UserX, Building2, Globe, MapPin, Target, Briefcase,
} from 'lucide-react';

const CARD_CONFIG = [
  { key: 'totalPositions', label: 'Total Positions', icon: Briefcase, color: 'text-slate-600', bg: 'bg-slate-100' },
  { key: 'filledPositions', label: 'Filled Positions', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { key: 'vacancies', label: 'Vacancies', icon: UserX, color: 'text-red-600', bg: 'bg-red-100' },
  { key: 'vacancyPct', label: 'Vacancy %', icon: UserX, color: 'text-orange-600', bg: 'bg-orange-100', suffix: '%' },
  { key: 'activeEmployees', label: 'Active Employees', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'totalDivisions', label: 'Divisions', icon: Building2, color: 'text-violet-600', bg: 'bg-violet-100' },
  { key: 'totalZones', label: 'Zones', icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { key: 'totalStates', label: 'States', icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'totalHQs', label: 'HQs', icon: Target, color: 'text-teal-600', bg: 'bg-teal-100' },
];

export function KpiCards() {
  const { kpi, showDrillDown, employees, loadingState } = useWorkforce();

  if (loadingState.kpi && !kpi) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!kpi) return null;

  const handleCardClick = (key: string) => {
    if (key === 'vacancies' || key === 'vacancyPct') {
      const vacant = employees.filter(e => e.dsgn === 'ABOLISHED' || !e.name);
      if (vacant.length > 0) showDrillDown(vacant, 'Vacant Positions');
    } else if (key === 'filledPositions') {
      const filled = employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name);
      if (filled.length > 0) showDrillDown(filled, 'Filled Positions');
    } else if (key === 'activeEmployees') {
      if (employees.length > 0) showDrillDown(employees, 'All Employees');
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
      {CARD_CONFIG.map((cfg, i) => {
        const Icon = cfg.icon;
        const val = kpi[cfg.key as keyof typeof kpi];
        const display = cfg.suffix ? `${val}${cfg.suffix}` : typeof val === 'number' ? val.toLocaleString() : String(val ?? '-');

        return (
          <motion.button
            key={cfg.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => handleCardClick(cfg.key)}
            className="bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className={`p-1.5 rounded-lg ${cfg.bg} w-fit mb-2`}>
              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
            </div>
            <p className="text-lg font-bold text-slate-900">{display}</p>
            <p className="text-[10px] text-slate-500">{cfg.label}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
