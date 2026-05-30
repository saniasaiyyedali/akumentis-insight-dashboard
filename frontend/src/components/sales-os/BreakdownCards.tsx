import { motion } from 'framer-motion';
import { ChevronRight, MapPin, User } from 'lucide-react';
import type { OSBreakdownItem } from '../../types/salesOS';

function fmtMoney(v: number) {
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(0)}K`;
  return `₹${Math.round(v)}`;
}

interface Props {
  title: string;
  items: OSBreakdownItem[];
  onItemClick: (item: OSBreakdownItem) => void;
}

export function BreakdownCards({ title, items, onItemClick }: Props) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.slice(0, 16).map((item, i) => (
          <motion.button
            key={item.key + i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onItemClick(item)}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-400 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {item.designation ? <User className="w-4 h-4 text-slate-400 shrink-0" /> : <MapPin className="w-4 h-4 text-slate-400 shrink-0" />}
                <span className="text-sm font-semibold text-slate-900 truncate">{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
            </div>
            <p className="text-xl font-bold text-emerald-600 mt-2">{fmtMoney(item.revenue)}</p>
            <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
              <span className={item.achievement >= 90 ? 'text-emerald-600' : item.achievement >= 80 ? 'text-amber-600' : 'text-red-600'}>
                {item.achievement.toFixed(0)}% ach
              </span>
              <span>{item.growth >= 0 ? '+' : ''}{item.growth.toFixed(0)}% gr</span>
              {item.revenueAtRisk > 0 && <span className="text-red-500">{fmtMoney(item.revenueAtRisk)} risk</span>}
            </div>
            {item.designation && <p className="text-[10px] text-slate-400 mt-1">{item.designation}</p>}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
