import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { OSSegment } from '../../types/salesOS';

interface Props {
  title: string;
  segments: OSSegment[];
  chartId: string;
  activeSegment?: string | null;
  onSegmentClick: (chartId: string, segment: string) => void;
}

export function PerformanceDonut({ title, segments, chartId, activeSegment, onSegmentClick }: Props) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  if (!total) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex items-center justify-center">
        <p className="text-xs text-slate-400">No data for {title}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-[10px] text-slate-400 mb-3">{total} managers</p>

      <div className="flex flex-col items-center flex-1">
        <div className="relative w-[140px] h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%" cy="50%"
                innerRadius={42} outerRadius={62}
                paddingAngle={2}
                dataKey="count"
                onClick={(_, i) => onSegmentClick(chartId, segments[i].key)}
                style={{ cursor: 'pointer' }}
              >
                {segments.map(s => (
                  <Cell
                    key={s.key}
                    fill={s.color}
                    stroke="white"
                    strokeWidth={2}
                    opacity={activeSegment && activeSegment !== s.key ? 0.35 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900">{total}</span>
          </div>
        </div>

        <div className="w-full mt-3 space-y-1">
          {segments.map(s => (
            <button
              key={s.key}
              onClick={() => onSegmentClick(chartId, s.key)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] transition-colors ${
                activeSegment === s.key ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-bold">{s.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PerformanceHub({
  charts,
  activeChartId,
  activeSegment,
  onSegmentClick,
}: {
  charts: { id: string; title: string; segments: OSSegment[] }[];
  activeChartId: string | null;
  activeSegment: string | null;
  onSegmentClick: (chartId: string, segment: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {charts.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <PerformanceDonut
            title={c.title}
            segments={c.segments}
            chartId={c.id}
            activeSegment={activeChartId === c.id ? activeSegment : null}
            onSegmentClick={onSegmentClick}
          />
        </motion.div>
      ))}
    </div>
  );
}
