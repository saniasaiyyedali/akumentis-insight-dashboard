import { useMemo, useState, type ComponentType } from 'react';
import { useWorkforce, type HierarchyNode } from '../contexts/WorkforceContext';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { DrilldownPanel } from '../components/workforce/DrilldownPanel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, Users, DollarSign, Target, TrendingUp, Clock,
  Building2,
} from 'lucide-react';
import { toNum, fmtMoney, fmtPct, totalRevenue, normalizeKey } from '../utils/displayUtils';

const HIERARCHY_ORDER = ['BU Head', 'NSM', 'ZM', 'SM', 'RM', 'BM'] as const;
const NEXT_ROLE: Record<string, string | null> = { 'BU Head': 'NSM', 'NSM': 'ZM', 'ZM': 'SM', 'SM': 'RM', 'RM': 'BM', 'BM': null };

const ROLE_COLORS: Record<string, string> = {
  'BU Head': 'bg-indigo-500',
  'NSM': 'bg-violet-500',
  'ZM': 'bg-blue-500',
  'SM': 'bg-cyan-500',
  'RM': 'bg-emerald-500',
  'BM': 'bg-teal-500',
};

const ROLE_ICONS: Record<string, string> = {
  'BU Head': '🏢',
  'NSM': '👔',
  'ZM': '🌎',
  'SM': '📍',
  'RM': '🎯',
  'BM': '👨‍💼',
};

function HierarchyCard({ node, depth, onDrill }: { node: HierarchyNode; depth: number; onDrill: (node: HierarchyNode) => void }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;
  const roleColor = ROLE_ICONS[node.designation] || '👤';

  const ach = node.avgAchievement || node.achievement || 0;
  const gr = node.avgGrowth || node.growth || 0;

  return (
    <div className="ml-0">
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onDrill(node);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left group ${
          depth === 0
            ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white border-slate-600 hover:from-slate-700 hover:to-slate-600'
            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
        }`}
      >
        <span className="text-base shrink-0">{roleColor}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${depth === 0 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {node.designation}
            </span>
            <span className={`text-sm font-semibold truncate ${depth === 0 ? 'text-white' : 'text-slate-900'}`}>
              {node.name}
            </span>
            {node.zone && <span className={`text-[10px] ${depth === 0 ? 'text-slate-300' : 'text-slate-400'}`}>{node.zone}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs ${depth === 0 ? 'text-slate-300' : 'text-slate-500'}`}>
              <Users className="w-3 h-3 inline mr-0.5" />{node.totalCount}
            </span>
            <span className={`text-xs font-medium ${depth === 0 ? 'text-emerald-300' : 'text-emerald-600'}`}>
              {fmtMoney(node.totalRevenue)}
            </span>
            <span className={`text-xs font-medium ${ach >= 90 ? (depth === 0 ? 'text-emerald-300' : 'text-emerald-600') : ach >= 80 ? (depth === 0 ? 'text-amber-300' : 'text-amber-600') : (depth === 0 ? 'text-red-300' : 'text-red-600')}`}>
              {fmtPct(ach)} ach
            </span>
            <span className={`text-xs ${gr >= 0 ? (depth === 0 ? 'text-emerald-300' : 'text-emerald-600') : (depth === 0 ? 'text-red-300' : 'text-red-600')}`}>
              {gr >= 0 ? '+' : ''}{fmtPct(gr)} gr
            </span>
          </div>
        </div>
        {hasChildren && (
          <div className={`shrink-0 ${depth === 0 ? 'text-white' : 'text-slate-400'}`}>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 border-l-2 border-slate-200 pl-2 mt-1 overflow-hidden"
          >
            {node.children.map((child, i) => (
              <HierarchyCard key={`${child.designation}-${child.name}-${i}`} node={child} depth={depth + 1} onDrill={onDrill} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Hierarchy() {
  const { employees, salesHierarchy, openDrawer, showDrilldownPanel } = useWorkforce();
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);

  const activeEmps = useMemo(() => employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name), [employees]);

  const hierarchyData = useMemo(() => {
    if (salesHierarchy && salesHierarchy.length > 0) return salesHierarchy;
    return [];
  }, [salesHierarchy]);

  const handleDrill = (node: HierarchyNode) => {
    setSelectedNode(node);
  };

  const getEmployeesForNode = (node: HierarchyNode) => {
    return activeEmps.filter(e => {
      const matchName = String(e.name || '').trim() === node.name.trim();
      const matchDsgn = String(e.dsgn || '').toUpperCase() === node.designation.toUpperCase();
      if (matchDsgn && matchName) return true;
      if (matchDsgn && node.zone && normalizeKey(String(e.zone)) === normalizeKey(node.zone)) return true;
      if (matchDsgn && node.hq && normalizeKey(String(e.hq)) === normalizeKey(node.hq)) return true;
      return false;
    });
  };

  const selectedEmps = selectedNode ? getEmployeesForNode(selectedNode) : [];

  return (
    <div className="space-y-5 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Hierarchy Analysis</h1>
          <p className="text-xs text-slate-400">BU Head → NSM → ZM → SM → RM → BM</p>
        </div>
      </motion.div>

      <GlobalFilterBar visibleKeys={['division', 'zone', 'state', 'hq', 'dsgn']} />

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
        {HIERARCHY_ORDER.map(role => (
          <span key={role} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[role]?.replace('bg-', '') || '#6366f1' }} />
            <span>{ROLE_ICONS[role]} {role}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hierarchy Tree */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Organization Structure</h3>
            {hierarchyData.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No hierarchy data available</p>
                <p className="text-xs mt-1">Try adjusting filters</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {hierarchyData.map((node, i) => (
                  <HierarchyCard key={`${node.designation}-${node.name}-${i}`} node={node} depth={0} onDrill={handleDrill} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedNode ? (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  {selectedNode.designation}: {selectedNode.name}
                </h3>
                <div className="space-y-3">
                  <MetricRow icon={Users} label="Team Size" value={selectedNode.totalCount.toString()} color="text-blue-600" />
                  <MetricRow icon={DollarSign} label="Revenue" value={fmtMoney(selectedNode.totalRevenue)} color="text-emerald-600" />
                  <MetricRow icon={Target} label="Achievement" value={fmtPct(selectedNode.avgAchievement || selectedNode.achievement)} color="text-indigo-600" />
                  <MetricRow icon={TrendingUp} label="Growth" value={fmtPct(selectedNode.avgGrowth || selectedNode.growth)} color="text-emerald-600" />
                  <MetricRow icon={Clock} label="Coverage" value={fmtPct(selectedNode.coverage)} color="text-amber-600" />
                </div>
                {selectedNode.children.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Direct Reports ({selectedNode.children.length})</p>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {selectedNode.children.slice(0, 10).map((child, i) => {
                        const nextRole = NEXT_ROLE[selectedNode.designation];
                        const isLeaf = !nextRole;
                        return (
                          <div key={i} onClick={() => isLeaf ? null : handleDrill(child)}
                            className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 cursor-pointer text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-400 w-4 shrink-0">{i + 1}</span>
                              <span className="text-slate-700 truncate max-w-[120px]">{child.name}</span>
                              <span className="text-[10px] bg-slate-100 px-1 rounded">{child.designation}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-500">{fmtMoney(child.totalRevenue)}</span>
                              {!isLeaf && <ChevronRight className="w-3 h-3 text-slate-300" />}
                            </div>
                          </div>
                        );
                      })}
                      {selectedNode.children.length > 10 && (
                        <button onClick={() => showDrilldownPanel(selectedEmps, selectedNode.name)}
                          className="w-full text-xs text-blue-600 py-1">
                          View all {selectedNode.children.length} →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Matching employees */}
              {selectedEmps.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-slate-900 mb-2">
                    Matching Records ({selectedEmps.length})
                  </h4>
                  <div className="max-h-[240px] overflow-y-auto space-y-0.5">
                    {selectedEmps.slice(0, 20).map((emp, i) => {
                      const rev = totalRevenue([emp]);
                      return (
                        <div key={i} onClick={() => openDrawer(emp)}
                          className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <span className="truncate max-w-[120px] text-slate-700">{emp.name}</span>
                          <span className="text-slate-500">{fmtMoney(rev)}</span>
                          <span className="text-slate-400">{fmtPct(toNum(emp.apr_ach))}</span>
                        </div>
                      );
                    })}
                    {selectedEmps.length > 20 && (
                      <button onClick={() => showDrilldownPanel(selectedEmps, selectedNode.name)}
                        className="w-full text-xs text-blue-600 py-1">
                        View all {selectedEmps.length} →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-8 text-center"
            >
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p className="text-sm text-slate-500 font-medium">Click a node</p>
              <p className="text-xs text-slate-400 mt-1">Select any role in the hierarchy to see details</p>
            </motion.div>
          )}
        </div>
      </div>

      <RecordDrawer />
      <DrilldownPanel />
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, color }: {
  icon: ComponentType<{ className?: string }>; label: string; value: string; color: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500 flex items-center gap-1.5">
        <Icon className={`w-3 h-3 ${color}`} />
        {label}
      </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}