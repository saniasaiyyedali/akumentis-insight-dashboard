import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { fmtMoney } from '../../../utils/format';
import type { RegionOwner } from './OrgLevelInsightPanel';

interface Props {
  regions: RegionOwner[];
  levelLabel: string;
  loading?: boolean;
}

export function OrgRevenueRiver({ regions, levelLabel, loading }: Props) {
  const flows = useMemo(() => {
    const sorted = [...regions].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    const max = Math.max(...sorted.map(r => r.revenue), 1);
    return sorted.map((r, i) => ({
      ...r,
      thickness: 4 + (r.revenue / max) * 28,
      delay: i * 0.12,
    }));
  }, [regions]);

  if (loading) {
    return <div className="h-48 rounded-3xl bg-slate-100/50 animate-pulse" />;
  }

  if (!flows.length) return null;

  const w = 800;
  const h = 200;
  const midY = h / 2;

  return (
    <section className="rounded-3xl border border-slate-200/50 bg-gradient-to-b from-indigo-950/5 to-cyan-50/30 p-4 sm:p-5 overflow-hidden">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-3">Revenue river</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-h-[180px]">
        <defs>
          {flows.map((f, i) => (
            <linearGradient key={f.name} id={`river-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
            </linearGradient>
          ))}
        </defs>
        {flows.map((f, i) => {
          const lane = midY - (flows.length - 1) * 14 + i * 28;
          const path = `M 40 ${lane} C 200 ${lane - f.thickness}, 400 ${midY}, 560 ${midY} S 720 ${lane + f.thickness * 0.3}, ${w - 40} ${midY}`;
          return (
            <g key={f.name}>
              <motion.path
                d={path}
                fill="none"
                stroke={`url(#river-${i})`}
                strokeWidth={f.thickness}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{ duration: 1.2, delay: f.delay, ease: 'easeOut' }}
              />
              <circle r={4} fill="#8b5cf6" opacity={0.9}>
                <animateMotion dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" path={path} />
              </circle>
              <text x={8} y={lane + 4} className="fill-slate-600 text-[11px] font-medium">
                {f.name}
              </text>
              <text x={w - 120} y={midY + (i - flows.length / 2) * 12 + 4} className="fill-indigo-600 text-[10px] font-bold">
                {levelLabel}
              </text>
            </g>
          );
        })}
        <text x={w - 48} y={midY + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
          flow
        </text>
      </svg>
      <div className="flex flex-wrap gap-4 mt-2 justify-center">
        {flows.map(f => (
          <span key={f.name} className="text-[10px] text-slate-500">
            <span className="font-semibold text-indigo-700">{f.name}</span> {fmtMoney(f.revenue)}
          </span>
        ))}
      </div>
    </section>
  );
}
