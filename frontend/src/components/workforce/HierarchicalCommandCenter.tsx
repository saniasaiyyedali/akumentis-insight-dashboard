import { useMemo, useState } from 'react';
import { type Employee } from '../../contexts/WorkforceContext';
import { toNum, fmtMoney, fmtPct, totalRevenue, groupBy, normalizeKey } from '../../utils/displayUtils';

type ViewMode = 'achievement' | 'growth';

const ACH_COLORS: Record<string, string> = {
  '>100%': '#15803d',
  '90-100%': '#86efac',
  '80-90%': '#f59e0b',
  '<80%': '#dc2626',
};

const GROWTH_COLORS: Record<string, string> = {
  '20%+': '#15803d',
  '10-20%': '#eab308',
  '0-10%': '#f97316',
  '<0%': '#dc2626',
};

export { ACH_COLORS as ACH_SLAB_COLORS, GROWTH_COLORS };

function achievementSlab(val: number): string {
  if (val <= 0) return 'N/A';
  if (val >= 100) return '>100%';
  if (val >= 90) return '90-100%';
  if (val >= 80) return '80-90%';
  return '<80%';
}

function growthSlab(val: number): string {
  if (val >= 20) return '20%+';
  if (val >= 10) return '10-20%';
  if (val >= 0) return '0-10%';
  return '<0%';
}

function avgMetric(emps: Employee[], field: string, isPct = false): number {
  const vals = emps.map(e => toNum(e[field]) * (isPct ? 100 : 1)).filter(v => v !== 0);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

interface HierarchyNode {
  name: string;
  emps: Employee[];
  children: HierarchyNode[];
}

function buildHierarchy(emps: Employee[]): HierarchyNode[] {
  const divGroups = groupBy(emps, e => normalizeKey(String(e.division || 'Unknown')));
  return [...divGroups.entries()].map(([name, g]) => ({
    name,
    emps: g,
    children: buildZoneChildren(g),
  })).sort((a, b) => totalRevenue(b.emps) - totalRevenue(a.emps));
}

function buildZoneChildren(emps: Employee[]): HierarchyNode[] {
  const groups = groupBy(emps, e => normalizeKey(String(e.zone || 'Unknown')));
  return [...groups.entries()].map(([name, g]) => ({
    name,
    emps: g,
    children: buildStateChildren(g),
  })).sort((a, b) => totalRevenue(b.emps) - totalRevenue(a.emps));
}

function buildStateChildren(emps: Employee[]): HierarchyNode[] {
  const groups = groupBy(emps, e => normalizeKey(String(e.state || 'Unknown')));
  return [...groups.entries()].map(([name, g]) => ({
    name,
    emps: g,
    children: buildHQChildren(g),
  })).sort((a, b) => totalRevenue(b.emps) - totalRevenue(a.emps));
}

function buildHQChildren(emps: Employee[]): HierarchyNode[] {
  const groups = groupBy(emps, e => normalizeKey(String(e.hq || 'Unknown')));
  return [...groups.entries()].map(([name, g]) => ({
    name,
    emps: g,
    children: [],
  })).sort((a, b) => totalRevenue(b.emps) - totalRevenue(a.emps));
}

interface CommandCenterProps {
  employees: Employee[];
  viewMode: ViewMode;
  onSelect: (node: { name: string; emps: Employee[]; path: string[] }) => void;
}

export function HierarchicalCommandCenter({ employees, viewMode, onSelect }: CommandCenterProps) {
  const [zoomPath, setZoomPath] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ name: string; emps: Employee[] } | null>(null);

  const hierarchy = useMemo(() => buildHierarchy(employees), [employees]);

  const currentLevel = hierarchy;
  let currentNodes = currentLevel;
  for (const step of zoomPath) {
    const found = currentNodes.find(n => n.name === step);
    if (found && found.children.length > 0) {
      currentNodes = found.children;
    } else {
      break;
    }
  }

  const levelLabels = ['Division', 'Zone', 'State', 'HQ'];
  const currentLabel = levelLabels[Math.min(zoomPath.length, 3)] || 'Detail';

  const getSlabColor = (emps: Employee[]) => {
    const ach = avgMetric(emps, 'apr_ach', true);
    const gr = avgMetric(emps, 'growth', true);
    if (viewMode === 'achievement') {
      const slab = achievementSlab(ach);
      return ACH_COLORS[slab] || '#94a3b8';
    } else {
      const slab = growthSlab(gr);
      return GROWTH_COLORS[slab] || '#94a3b8';
    }
  };

  const getSlabLabel = (emps: Employee[]) => {
    const ach = avgMetric(emps, 'apr_ach', true);
    const gr = avgMetric(emps, 'growth', true);
    if (viewMode === 'achievement') return achievementSlab(ach);
    return growthSlab(gr);
  };

  const handleZoom = (node: HierarchyNode) => {
    if (node.children.length > 0) {
      setZoomPath(prev => [...prev, node.name]);
    }
    setSelectedNode({ name: node.name, emps: node.emps });
  };

  const handleBreadcrumb = (index: number) => {
    if (index < 0) {
      setZoomPath([]);
      setSelectedNode(null);
    } else {
      setZoomPath(prev => prev.slice(0, index + 1));
    }
  };

  const handleNodeClick = (node: HierarchyNode) => {
    setSelectedNode({ name: node.name, emps: node.emps });
    onSelect({ name: node.name, emps: node.emps, path: [...zoomPath, node.name] });
  };

  const totalNodes = currentNodes;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => handleBreadcrumb(-1)}
            className={`font-medium px-2 py-1 rounded ${zoomPath.length === 0 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            All
          </button>
          {zoomPath.map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-slate-300">/</span>
              <button
                onClick={() => handleBreadcrumb(i)}
                className={`font-medium px-2 py-1 rounded ${i === zoomPath.length - 1 ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {step}
              </button>
            </span>
          ))}
        </div>
        <span className="text-xs text-slate-400">{totalNodes.length} {currentLabel}s</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {totalNodes.map(node => {
          const rev = totalRevenue(node.emps);
          const ach = avgMetric(node.emps, 'apr_ach', true);
          const gr = avgMetric(node.emps, 'growth', true);
          const color = getSlabColor(node.emps);
          const slabLabel = getSlabLabel(node.emps);
          const canDrill = node.children.length > 0;

          return (
            <button
              key={node.name}
              onClick={() => canDrill ? handleZoom(node) : handleNodeClick(node)}
              className={`relative bg-white border-2 rounded-xl p-4 text-left hover:shadow-lg transition-all group overflow-hidden ${selectedNode?.name === node.name ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: color }} />
              <div className="pl-2">
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-900 truncate pr-1">{node.name}</span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: color + '20', color }}>{slabLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">Revenue</p>
                    <p className="text-xs font-bold text-slate-900">{fmtMoney(rev)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">People</p>
                    <p className="text-xs font-bold text-slate-900">{node.emps.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">Achieve</p>
                    <p className={`text-xs font-bold ${ach >= 90 ? 'text-emerald-600' : ach >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(ach)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">Growth</p>
                    <p className={`text-xs font-bold ${gr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{gr >= 0 ? '+' : ''}{fmtPct(gr)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(ach, 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
                {canDrill && (
                  <p className="text-[9px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to drill down →
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {totalNodes.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">No data at this level</div>
      )}
    </div>
  );
}