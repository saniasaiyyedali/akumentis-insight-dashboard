import { motion } from 'framer-motion';
import { DollarSign, Target, TrendingUp, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { OSSummary } from '../../types/salesOS';
import { fmtMoney, fmtPct } from '../../utils/format';

export function CoreKPIs({ summary, onRiskClick }: { summary: OSSummary; onRiskClick?: () => void }) {
  const cards = [
    {
      label: 'Revenue',
      value: fmtMoney(summary.revenue),
      icon: DollarSign,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      trend: summary.growth >= 0 ? 'up' as const : 'down' as const,
      trendLabel: `${summary.growth >= 0 ? '+' : ''}${fmtPct(summary.growth)} org growth`,
    },
    {
      label: 'Achievement',
      value: fmtPct(summary.achievement),
      icon: Target,
      gradient: 'from-blue-600 via-indigo-600 to-violet-600',
      trend: summary.achievement >= 90 ? 'up' as const : 'down' as const,
      trendLabel: summary.achievement >= 90 ? 'On track' : 'Below target',
    },
    {
      label: 'Growth',
      value: `${summary.growth >= 0 ? '+' : ''}${fmtPct(summary.growth)}`,
      icon: TrendingUp,
      gradient: summary.growth >= 0 ? 'from-violet-500 via-purple-500 to-fuchsia-600' : 'from-red-500 via-rose-500 to-orange-500',
      trend: summary.growth >= 0 ? 'up' as const : 'down' as const,
      trendLabel: 'Period average',
    },
    {
      label: 'Revenue At Risk',
      value: fmtMoney(summary.revenueAtRisk),
      icon: ShieldAlert,
      gradient: 'from-red-600 via-orange-500 to-amber-500',
      trend: 'down' as const,
      trendLabel: 'Requires action',
      onClick: onRiskClick,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.button
          key={c.label}
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          onClick={c.onClick}
          className={`relative overflow-hidden rounded-2xl p-5 text-left bg-gradient-to-br ${c.gradient} text-white shadow-lg ${c.onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : 'cursor-default'}`}
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between mb-3 relative">
            <c.icon className="w-5 h-5 opacity-90" />
            <span className={`flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${c.trend === 'up' ? 'bg-white/20' : 'bg-black/20'}`}>
              {c.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {c.trendLabel}
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight relative">{c.value}</p>
          <p className="text-sm font-medium opacity-85 mt-1 relative">{c.label}</p>
        </motion.button>
      ))}
    </div>
  );
}
