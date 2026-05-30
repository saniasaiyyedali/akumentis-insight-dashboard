import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { OSSegment, SegmentType } from '../../types/salesOS';
import { SEGMENT_TYPES } from '../../types/salesOS';

interface Props {
  title: string;
  segments: OSSegment[];
  segmentType: SegmentType;
  onSegmentTypeChange: (t: SegmentType) => void;
  onSegmentClick: (segment: string) => void;
  activeSegment?: string;
}

export function DynamicDonut({ title, segments, segmentType, onSegmentTypeChange, onSegmentClick, activeSegment }: Props) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  if (!total) return null;

  return (
    <motion.div
      key={title + segmentType}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="flex gap-1">
          {SEGMENT_TYPES.map(st => (
            <button
              key={st.key}
              onClick={() => onSegmentTypeChange(st.key)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${segmentType === st.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative w-[220px] h-[220px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%" cy="50%"
                innerRadius={65} outerRadius={95}
                paddingAngle={3}
                dataKey="count"
                onClick={(_, i) => onSegmentClick(segments[i].key)}
                style={{ cursor: 'pointer' }}
              >
                {segments.map(s => (
                  <Cell key={s.key} fill={s.color} stroke="white" strokeWidth={2}
                    opacity={activeSegment && activeSegment !== s.key ? 0.35 : 1} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{total}</p>
              <p className="text-xs text-slate-500">people</p>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2 w-full">
          {segments.map(s => (
            <button
              key={s.key}
              onClick={() => onSegmentClick(s.key)}
              className={`rounded-xl p-3 text-left border transition-all hover:shadow-md ${activeSegment === s.key ? 'border-slate-900 bg-slate-50 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-semibold text-slate-700">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{s.count}</p>
              <p className="text-[10px] text-slate-400">{s.achievement.toFixed(0)}% ach · {s.revenue.toLocaleString()} rev</p>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
