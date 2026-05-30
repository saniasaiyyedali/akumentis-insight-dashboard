import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { fmtMoney } from '../../../utils/format';
import type { LandscapeNode } from './orgVisualUtils';
import { perfColor } from './orgVisualUtils';

interface Props {
  nodes: LandscapeNode[];
  selectedId: string | null;
  onSelect: (node: LandscapeNode) => void;
  loading?: boolean;
}

function layoutNodes(nodes: LandscapeNode[], w: number, h: number) {
  const maxRev = Math.max(...nodes.map(n => n.revenue), 1);
  const cx = w / 2;
  const cy = h / 2;
  const orbit = Math.min(w, h) * 0.34;

  return nodes.map((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const r = orbit + (i % 2) * 24;
    const size = 28 + Math.sqrt(n.revenue / maxRev) * 52;
    return {
      ...n,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      size,
      color: perfColor(n.achievement, n.revenueAtRisk, n.atRisk),
      pulse: n.revenueAtRisk > 0 && (n.achievement < 75 || n.atRisk),
    };
  });
}

export function OrgLandscape({ nodes, selectedId, onSelect, loading }: Props) {
  const w = 720;
  const h = 380;
  const placed = useMemo(() => layoutNodes(nodes, w, h), [nodes]);

  if (loading) {
    return <div className="h-[380px] rounded-3xl bg-slate-100/50 animate-pulse" />;
  }

  if (!nodes.length) {
    return (
      <div className="h-[280px] rounded-3xl border border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-400">
        No landscape nodes for this level
      </div>
    );
  }

  return (
    <section className="relative rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden shadow-inner min-h-[380px]">
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="org-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="#94a3b8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#org-grid)" />
        </svg>
      </div>
      <p className="absolute top-4 left-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 z-10">
        Organization landscape
      </p>
      <div className="absolute bottom-4 right-5 flex gap-3 text-[9px] text-slate-500 z-10">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Strong</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Avg</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Risk</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-h-[380px] relative z-[1]">
        {placed.map((a, i) =>
          placed.slice(i + 1).map(b => (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#475569"
strokeWidth={1.5}
opacity={0.75}
            />
          ))
        )}
        {placed.map((n, i) => {
          const selected = selectedId === n.id;
          return (
            <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(n)}>
              {n.pulse && (
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={n.size / 2 + 8}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2}
                  initial={{ opacity: 0.6, scale: 0.9 }}
                  animate={{ opacity: 0, scale: 1.35 }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
                />
              )}
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={n.size / 2}
                fill={n.color}
                fillOpacity={selected ? 1 : 0.88}
                stroke={selected ? '#0f172a' : '#fff'}
                strokeWidth={selected ? 3 : 2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22, delay: i * 0.03 }}
              />
              <text
                x={n.x}
                y={n.y - 4}
                textAnchor="middle"
                className="fill-slate-800 text-[10px] font-semibold pointer-events-none"
                style={{ fontSize: Math.max(9, n.size / 5) }}
              >
                {n.label.length > 12 ? `${n.label.slice(0, 10)}…` : n.label}
              </text>
              <text
                x={n.x}
                y={n.y + 10}
                textAnchor="middle"
                className="fill-slate-600 text-[8px] pointer-events-none"
              >
                {fmtMoney(n.revenue)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
