import { motion } from 'framer-motion';

export const PERFORMANCE_LEVELS = [
  { level: 'BU HEAD', short: 'BU' },
  { level: 'NSM', short: 'NSM' },
  { level: 'SM', short: 'SM' },
  { level: 'ZM', short: 'ZM' },
  { level: 'RM', short: 'RM' },
  { level: 'BM', short: 'BM' },
] as const;

interface Props {
  activeLevel: string;
  onChange: (level: string) => void;
}

export function PerformanceHierarchySwitcher({ activeLevel, onChange }: Props) {
  const activeIndex = PERFORMANCE_LEVELS.findIndex(l => l.level === activeLevel);

  return (
    <div
      className="relative rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white/95 to-slate-50/90 backdrop-blur-md p-1 shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
      role="group"
      aria-label="Hierarchy level"
    >
      <div className="relative grid grid-cols-6 gap-0">
        {activeIndex >= 0 && (
          <motion.div
            layoutId="perf-hierarchy-indicator"
            className="absolute inset-y-1 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-500/30"
            style={{
              left: `calc(${activeIndex} * (100% / 6) + 4px)`,
              width: `calc(100% / 6 - 8px)`,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
        {PERFORMANCE_LEVELS.map(({ level, short }) => {
          const active = activeLevel === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`
                relative z-10 py-3 px-1 text-center transition-colors duration-200 rounded-xl
                ${active ? 'text-white' : 'text-slate-600 hover:text-slate-900'}
              `}
            >
              <span className={`block text-xs sm:text-sm font-bold tracking-wide ${active ? '' : 'opacity-80'}`}>
                {short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
