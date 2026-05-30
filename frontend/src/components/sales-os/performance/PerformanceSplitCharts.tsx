import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
  Cell,
  PieChart, Pie,
} from 'recharts';
import type { OSSegment } from '../../../types/salesOS';
import type { SplitChart } from '../AnalyticsSplitGrid';

interface Props {
  charts: SplitChart[];
  activeChartId: string | null;
  activeSegment: string | null;
  onSegmentClick: (chartId: string, segment: string) => void;
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-full min-h-[360px] rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)] flex flex-col">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
      <div className="flex-1 min-h-[300px] mt-3">{children}</div>
    </div>
  );
}

function SegmentLegend({
  segments,
  active,
  onClick,
}: {
  segments: OSSegment[];
  active: string | null;
  onClick: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {segments.map(s => (
        <button
          key={s.key}
          type="button"
          onClick={() => onClick(s.key)}
          className={`text-[11px] px-2.5 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
            active === s.key
              ? 'ring-2 ring-slate-900 ring-offset-2 shadow-md scale-[1.02]'
              : 'hover:scale-[1.02] hover:shadow-sm'
          }`}
          style={{
            backgroundColor: active === s.key ? s.color : `${s.color}22`,
            color: active === s.key ? '#fff' : '#334155',
          }}
        >
          {s.label} ({s.count})
        </button>
      ))}
    </div>
  );
}

const CHART_H = 280;

function BarSplit({ segments, active, onClick }: { segments: OSSegment[]; active: string | null; onClick: (k: string) => void }) {
  const data = segments.map(s => ({ name: s.label, count: s.count, fill: s.color, key: s.key }));
  return (
    <>
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }} />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} onClick={d => onClick((d as { key: string }).key)} style={{ cursor: 'pointer' }}>
            {data.map(e => <Cell key={e.key} fill={e.fill} opacity={active && active !== e.key ? 0.35 : 1} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <SegmentLegend segments={segments} active={active} onClick={onClick} />
    </>
  );
}

function RadialSplit({ segments, active, onClick }: { segments: OSSegment[]; active: string | null; onClick: (k: string) => void }) {
  const data = segments.map(s => ({ name: s.label, value: s.count, fill: s.color, key: s.key }));
  return (
    <>
      <ResponsiveContainer width="100%" height={CHART_H}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="92%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, Math.max(...data.map(d => d.value), 1)]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={6} onClick={d => onClick((d as { key: string }).key)} style={{ cursor: 'pointer' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <SegmentLegend segments={segments} active={active} onClick={onClick} />
    </>
  );
}

function TreemapSplit({ segments, active, onClick }: { segments: OSSegment[]; active: string | null; onClick: (k: string) => void }) {
  const total = segments.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <>
      <div className="flex h-[280px] rounded-xl overflow-hidden gap-1 shadow-inner">
        {segments.map(s => {
          const w = (s.count / total) * 100;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onClick(s.key)}
              style={{
                width: `${w}%`,
                backgroundColor: s.color,
                opacity: active && active !== s.key ? 0.35 : 1,
              }}
              className="h-full flex flex-col items-center justify-center text-white text-xs font-semibold px-2 min-w-[48px] transition-all duration-200 hover:brightness-110"
            >
              <span className="truncate w-full text-center">{s.label}</span>
              <span className="text-2xl font-bold mt-1">{s.count}</span>
            </button>
          );
        })}
      </div>
      <SegmentLegend segments={segments} active={active} onClick={onClick} />
    </>
  );
}

function RingSplit({ segments, active, onClick }: { segments: OSSegment[]; active: string | null; onClick: (k: string) => void }) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  return (
    <>
      <div className="relative h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="count"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={108}
              paddingAngle={4}
              onClick={(_, idx) => segments[idx] && onClick(segments[idx].key)}
              style={{ cursor: 'pointer' }}
            >
              {segments.map(s => (
                <Cell key={s.key} fill={s.color} opacity={active && active !== s.key ? 0.35 : 1} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-slate-800 tabular-nums">{total}</span>
        </div>
      </div>
      <SegmentLegend segments={segments} active={active} onClick={onClick} />
    </>
  );
}

export function PerformanceSplitCharts({ charts, activeChartId, activeSegment, onSegmentClick }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
      {charts.map((c, i) => {
        const active = activeChartId === c.id ? activeSegment : null;
        const click = (seg: string) => onSegmentClick(c.id, seg);
        const displayTitle = c.title.replace(/^(RM|BM) /, '');

        return (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.28 }}
          >
            <ChartShell title={displayTitle}>
              {!c.segments?.length ? (
                <p className="text-sm text-slate-400 text-center py-16">No segment data</p>
              ) : c.vizType === 'bar' ? (
                <BarSplit segments={c.segments} active={active} onClick={click} />
              ) : c.vizType === 'radial' ? (
                <RadialSplit segments={c.segments} active={active} onClick={click} />
              ) : c.vizType === 'treemap' ? (
                <TreemapSplit segments={c.segments} active={active} onClick={click} />
              ) : (
                <RingSplit segments={c.segments} active={active} onClick={click} />
              )}
            </ChartShell>
          </motion.div>
        );
      })}
    </div>
  );
}
