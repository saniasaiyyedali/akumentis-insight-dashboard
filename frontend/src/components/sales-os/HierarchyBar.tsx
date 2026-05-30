import { motion } from 'framer-motion';
import type { OSHierarchyLevel } from '../../types/salesOS';
import { LEVEL_GRADIENTS } from '../../types/salesOS';

function fmtMoney(v: number) {
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(Math.round(v));
}

interface Props {
  levels: OSHierarchyLevel[];
  activeLevel?: string;
  onSelect: (level: string) => void;
}

export function HierarchyBar({ levels, activeLevel, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {levels.map((lv, i) => {
        const grad = LEVEL_GRADIENTS[lv.level] || 'from-slate-600 to-slate-500';
        const active = activeLevel === lv.level;
        return (
          <motion.button
            key={lv.level}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(lv.level)}
            className={`flex-1 min-w-[140px] rounded-xl p-4 text-left transition-all bg-gradient-to-br ${grad} text-white shadow-md hover:shadow-xl hover:scale-[1.02] ${active ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-100 scale-[1.02]' : ''}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{lv.label}</p>
            <p className="text-2xl font-bold mt-1">{lv.count}</p>
            <div className="flex gap-3 mt-2 text-[10px] opacity-90">
              <span>{fmtMoney(lv.revenue)}</span>
              <span>{lv.achievement.toFixed(0)}% ach</span>
              <span>{lv.growth >= 0 ? '+' : ''}{lv.growth.toFixed(0)}%</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
