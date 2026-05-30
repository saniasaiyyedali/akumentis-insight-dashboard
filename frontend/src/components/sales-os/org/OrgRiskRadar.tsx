import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { fmtMoney } from '../../../utils/format';
import type { PersonRow } from './OrgLevelInsightPanel';
import { riskSeverity } from './orgVisualUtils';

interface Props {
  items: PersonRow[];
  selectedId: string | null;
  onSelect: (item: PersonRow) => void;
  loading?: boolean;
}

export function OrgRiskRadar({ items, selectedId, onSelect, loading }: Props) {
  const cx = 160;
  const cy = 160;
  const maxR = 120;
  const maxRisk = Math.max(...items.map(i => i.revenueAtRisk), 1);

  const blips = useMemo(() => {
    return items.slice(0, 12).map((item, i) => {
      const angle = (i / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const sev = riskSeverity(item.revenueAtRisk, maxRisk);
      const r = 28 + sev * maxR;
      return {
        item,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        sev,
        critical: sev > 0.75,
      };
    });
  }, [items, maxRisk]);

  if (loading) {
    return <div className="h-[320px] rounded-3xl bg-slate-100/50 animate-pulse" />;
  }

  if (!items.length) {
    return (
      <section className="rounded-3xl border border-slate-200/50 bg-red-50/20 p-8 text-center text-sm text-slate-400">
        No risk signals at this level
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-red-100/60 bg-gradient-to-br from-white to-red-50/20 p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-2">Risk radar</p>
      <svg viewBox="0 0 320 320" className="w-full max-w-[320px] mx-auto h-auto">
        {[0.33, 0.66, 1].map(ring => (
          <circle
            key={ring}
            cx={cx}
            cy={cy}
            r={maxR * ring}
            fill="none"
            stroke="#3e2222"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.5}
          />
        ))}
        <circle cx={cx} cy={cy} r={6} fill="#ef4444" opacity={0.8} />
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-white text-[8px] font-bold">
          RISK
        </text>
        {blips.map(({ item, x, y, sev, critical }, i) => {
          const id = item.empCode || item.name;
          const selected = selectedId === id;
          return (
            <g key={id} style={{ cursor: 'pointer' }} onClick={() => onSelect(item)}>
              {critical && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={14}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2}
                  animate={{ opacity: [0.8, 0], scale: [1, 1.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                />
              )}
              <motion.circle
                cx={x}
                cy={y}
                r={selected ? 12 : 8 + sev * 4}
                fill={critical ? '#ef4444' : '#f97316'}
                stroke={selected ? '#0f172a' : '#fff'}
                strokeWidth={2}
                whileHover={{ scale: 1.15 }}
              />
              <text x={x} y={y - 14} textAnchor="middle" className="fill-slate-700 text-[8px] font-medium pointer-events-none">
                {item.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
      {selectedId && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-red-600 font-semibold mt-2"
        >
          {fmtMoney(items.find(i => (i.empCode || i.name) === selectedId)?.revenueAtRisk ?? 0)} at risk
        </motion.p>
      )}
    </section>
  );
}
