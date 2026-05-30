import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkforce, type Employee } from '../../contexts/WorkforceContext';
import {
  ChevronRight, ChevronDown, Building2, MapPin, Globe, User, Briefcase, Target,
  DollarSign, Percent,
} from 'lucide-react';
import { fmt, fmtMoney, totalRevenue } from '../../utils/displayUtils';

const LEVEL_CONFIG: Record<string, { icon: typeof Building2; color: string; label: string }> = {
  division: { icon: Building2, color: 'bg-blue-500', label: 'Division' },
  zone: { icon: Globe, color: 'bg-emerald-500', label: 'Zone' },
  state: { icon: MapPin, color: 'bg-violet-500', label: 'State' },
  hq: { icon: Target, color: 'bg-amber-500', label: 'HQ' },
  dsgn: { icon: Briefcase, color: 'bg-rose-500', label: 'Role' },
};

const LEVEL_ORDER = ['division', 'zone', 'state', 'hq', 'dsgn'];

const DSGN_PRIORITY: Record<string, number> = {
  'BU Head': 1, 'NSM': 2, 'ZM': 3, 'SM': 4, 'RM': 5, 'BM': 6, 'Abolished': 99,
};

function sortChildren(children: { name: string }[]) {
  return [...children].sort((a, b) => {
    const pa = DSGN_PRIORITY[a.name] ?? 50;
    const pb = DSGN_PRIORITY[b.name] ?? 50;
    return pa - pb;
  });
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
  _count?: number;
  _emps?: Employee[];
  _totalRev?: number;
}

export function HierarchyDrilldown() {
  const { hierarchy, setActiveNode, activeNode, openDrawer, showDrilldownPanel, employees, loadingState } = useWorkforce();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (loadingState.hierarchy && !hierarchy) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-48 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Organization Hierarchy</h3>
        <div className="text-center py-6 text-slate-400">
          <p className="text-xs">No hierarchy data available</p>
        </div>
      </div>
    );
  }

  const root = hierarchy as TreeNode;

  const toggleExpand = (path: string) => setExpanded(p => ({ ...p, [path]: !p[path] }));

  const handleNodeClick = (level: string, value: string) => {
    setActiveNode(level, value);
  };

  const renderNode = (node: TreeNode, depth: number, path: string, level: string) => {
    const isExpanded = expanded[path] !== false;
    const isActive = activeNode?.value === node.name;
    const hasChildren = node.children && node.children.length > 0;
    const config = LEVEL_CONFIG[level];
    const Icon = config?.icon || User;
    const children = hasChildren ? sortChildren(node.children!) : [];
    const nodeRev = node._totalRev ?? totalRevenue(node._emps ?? []);
    const totalAllRev = totalRevenue(employees);
    const contribPct = totalAllRev > 0 ? (nodeRev / totalAllRev) * 100 : 0;

    // Show employees as leaf nodes when level is dsgn
    const showEmployeeLeaves = depth >= LEVEL_ORDER.length - 1 && node._emps && node._emps.length > 0 && isExpanded;

    return (
      <div key={path}>
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all cursor-pointer
            ${isActive
              ? 'bg-blue-50 border border-blue-200 shadow-sm'
              : 'hover:bg-slate-50 border border-transparent'
            }`}
          onClick={() => handleNodeClick(level, node.name)}
        >
          {hasChildren || (node._emps && node._emps.length > 0) ? (
            <button
              onClick={e => { e.stopPropagation(); toggleExpand(path); }}
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <div className="w-4 shrink-0" />
          )}

          <div className={`w-5 h-5 rounded-full ${config?.color || 'bg-slate-400'} flex items-center justify-center text-white shrink-0`}>
            <Icon className="w-3 h-3" />
          </div>

          <span className={`text-sm flex-1 truncate ${isActive ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>
            {node.name}
          </span>

          {node._count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
              isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {node._count}
            </span>
          )}
        </div>

        {/* Metrics row for this node */}
        {depth > 0 && node._emps && node._emps.length > 0 && (
          <div className="flex items-center gap-3 ml-10 pr-2 text-[9px] text-slate-400 pb-0.5">
            <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" />{fmtMoney(nodeRev)}</span>
            <span className="flex items-center gap-0.5"><Percent className="w-2.5 h-2.5" />{fmt(contribPct, 1)}%</span>
          </div>
        )}

        {/* Employee leaf nodes with contribution */}
        <AnimatePresence>
          {showEmployeeLeaves && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-8 space-y-0.5 overflow-hidden"
            >
              {node._emps!.slice(0, 10).map((emp, i) => {
                const rev = totalRevenue([emp]);
                const empContrib = totalAllRev > 0 ? (rev / totalAllRev) * 100 : 0;
                return (
                  <div key={i} className="flex items-center group">
                    <button
                      onClick={() => openDrawer(emp)}
                      className="flex-1 flex items-center gap-2 py-0.5 px-2 rounded text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <User className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate max-w-[120px]">{String(emp.name || '-')}</span>
                      {emp.empCode && <span className="text-slate-400 shrink-0 text-[9px]">#{String(emp.empCode)}</span>}
                    </button>
                    <span className="text-[9px] text-slate-400 shrink-0 w-12 text-right">{fmtMoney(rev)}</span>
                    <span className="text-[9px] text-slate-400 shrink-0 w-10 text-right">{fmt(empContrib, 1)}%</span>
                  </div>
                );
              })}
              {node._emps!.length > 10 && (
                <button
                  onClick={() => showDrilldownPanel(node._emps!, `${node.name} Employees`)}
                  className="w-full text-left text-[10px] text-blue-500 hover:text-blue-700 py-0.5 px-2"
                >
                  View all {node._emps!.length} employees →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isExpanded && children.length > 0 && (
          <div className="ml-6 border-l-2 border-slate-100 pl-2 mt-0.5 space-y-0.5">
            {children.map((child, i) => {
              const nextLevel = LEVEL_ORDER[depth + 1];
              return renderNode(child, depth + 1, `${path}-${i}`, nextLevel || 'detail');
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Organization Hierarchy</h3>
        <span className="text-xs text-slate-400">{employees.length} employees</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 pb-2 border-b border-slate-100">
        {LEVEL_ORDER.map(l => {
          const cfg = LEVEL_CONFIG[l];
          if (!cfg) return null;
          return (
            <span key={l} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
              {cfg.label}
            </span>
          );
        })}
      </div>
      <div className="max-h-[500px] overflow-y-auto space-y-0.5">
        {root.children?.map((child, i) =>
          renderNode(child, 0, `root-${i}`, 'division')
        )}
      </div>
    </motion.div>
  );
}