import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
  Cell,
  PieChart, Pie,
} from 'recharts';
import type { OSSegment } from '../../types/salesOS';

export interface SplitChart {
  id: string;
  title: string;
  vizType: 'bar' | 'radial' | 'treemap' | 'ring';
  segments: OSSegment[];
  level?: string;
  segmentType?: string;
}

interface Props {
  charts: SplitChart[];
  activeChartId: string | null;
  activeSegment: string | null;
  onSegmentClick: (chartId: string, segment: string) => void;
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-full min-h-[280px] flex flex-col">
      <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
      <div className="flex-1 min-h-[200px]">{children}</div>
    </div>
  );
}

function SegmentLegend({ segments, active, onClick }: { segments: OSSegment[]; active: string | null; onClick: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {segments.map(s => (
        <button
          key={s.key}
          onClick={() => onClick(s.key)}
          className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-all ${active === s.key ? 'ring-2 ring-slate-900 ring-offset-1' : 'hover:bg-slate-50'}`}
          style={{ backgroundColor: active === s.key ? s.color : `${s.color}22`, color: active === s.key ? '#fff' : '#334155' }}
        >
          {s.label} ({s.count})
        </button>
      ))}
    </div>
  );
}

function BarSplit({ segments, active, onClick }: { segments: OSSegment[]; active: string | null; onClick: (k: string) => void }) {
  const data = segments.map(s => ({ name: s.label, count: s.count, fill: s.color, key: s.key }));
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 8 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => [v, 'Managers']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} onClick={d => onClick((d as { key: string }).key)} style={{ cursor: 'pointer' }}>
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
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="28%" outerRadius="95%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, Math.max(...data.map(d => d.value), 1)]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={4} onClick={d => onClick((d as { key: string }).key)} style={{ cursor: 'pointer' }} />
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
      <div className="flex h-[180px] rounded-lg overflow-hidden gap-0.5">
        {segments.map(s => {
          const w = (s.count / total) * 100;
          return (
            <button
              key={s.key}
              onClick={() => onClick(s.key)}
              style={{
                width: `${w}%`,
                backgroundColor: s.color,
                opacity: active && active !== s.key ? 0.35 : 1,
              }}
              className="h-full flex flex-col items-center justify-center text-white text-[10px] font-semibold px-1 min-w-[40px] transition-opacity hover:opacity-90"
            >
              <span className="truncate w-full text-center">{s.label}</span>
              <span className="text-lg font-bold">{s.count}</span>
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
      <div className="relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={segments} dataKey="count" cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3}
              onClick={(_, idx) => segments[idx] && onClick(segments[idx].key)} style={{ cursor: 'pointer' }}>
              {segments.map(s => <Cell key={s.key} fill={s.color} opacity={active && active !== s.key ? 0.35 : 1} />)}
            </Pie>
            <Tooltip formatter={(v) => [v, 'Count']} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-800">{total}</span>
        </div>
      </div>
      <SegmentLegend segments={segments} active={active} onClick={onClick} />
    </>
  );
}

export function AnalyticsSplitGrid({ charts, activeChartId, activeSegment, onSegmentClick }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {charts.map((c, i) => {
        const active = activeChartId === c.id ? activeSegment : null;
        const click = (seg: string) => onSegmentClick(c.id, seg);
        return (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ChartShell title={c.title}>
              {!c.segments?.length ? (
                <p className="text-xs text-slate-400 text-center py-12">No data</p>
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
