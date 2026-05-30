import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { workforceAPI } from '../../services/workforce';
import type { OSOrgNode } from '../../types/salesOS';
import { fmtMoney, fmtPct } from '../../utils/format';

const ROLE_BORDER: Record<string, string> = {
  'BU Head': 'border-l-indigo-500',
  NSM: 'border-l-purple-500',
  SM: 'border-l-blue-500',
  ZM: 'border-l-teal-500',
  RM: 'border-l-green-500',
  BM: 'border-l-orange-500',
  Employee: 'border-l-slate-400',
};

function OrgNodeRow({
  node,
  depth,
  onExpand,
}: {
  node: OSOrgNode;
  depth: number;
  onExpand: (empCode: string) => Promise<OSOrgNode[]>;
}) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<OSOrgNode[]>(node.children || []);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && node.hasChildren && children.length === 0) {
      setLoading(true);
      try {
        const res = await workforceAPI.getOSOrgTree({ parentEmpCode: node.empCode });
        setChildren(Array.isArray(res.data) ? res.data : []);
      } catch {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  };

  const border = ROLE_BORDER[node.designation] || 'border-l-slate-300';

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <button
        onClick={toggle}
        disabled={!node.hasChildren && depth === 0}
        className={`w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 rounded-xl border-l-4 ${border} bg-white border border-slate-100 hover:shadow-md transition-all mb-1 text-left`}
      >
        {node.hasChildren ? (
          open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        ) : <span className="w-4 shrink-0" />}
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{node.designation}</span>
        <span className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{node.name}</span>
        <span className="text-xs text-emerald-600 font-medium ml-auto">{fmtMoney(node.revenue)}</span>
        <span className={`text-[10px] ${node.achievement >= 90 ? 'text-emerald-600' : node.achievement >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
          {fmtPct(node.achievement)}
        </span>
        <span className="text-[10px] text-slate-400">{node.growth >= 0 ? '+' : ''}{fmtPct(node.growth)}</span>
        <span className="text-[10px] text-slate-400">Team {node.teamSize}</span>
        {(node.contributionPct ?? 0) > 0 && (
          <span className="text-[10px] text-blue-600">{fmtPct(node.contributionPct ?? 0)} contrib</span>
        )}
        {node.atRisk && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        {loading && <span className="text-[10px] text-slate-400">...</span>}
      </button>
      <AnimatePresence>
        {open && children.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {children.map(c => (
              <OrgNodeRow key={c.empCode + c.name} node={c} depth={depth + 1} onExpand={onExpand} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HierarchyAccordion() {
  const [roots, setRoots] = useState<OSOrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workforceAPI.getOSOrgTree();
      setRoots(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRoots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoots(); }, [loadRoots]);

  const expandNode = async (empCode: string) => {
    const res = await workforceAPI.getOSOrgTree({ parentEmpCode: empCode });
    return Array.isArray(res.data) ? res.data : [];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}</div>
      ) : roots.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No hierarchy data available.</p>
      ) : (
        roots.map(r => <OrgNodeRow key={r.empCode} node={r} depth={0} onExpand={expandNode} />)
      )}
    </div>
  );
}
