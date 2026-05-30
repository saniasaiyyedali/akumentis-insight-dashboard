import { useWorkforce } from '../../contexts/WorkforceContext';
import { ChevronRight, Home } from 'lucide-react';

export function BreadcrumbNav() {
  const { breadcrumbs, navigateBreadcrumb, clearActiveNode } = useWorkforce();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500 flex-wrap">
      <button
        onClick={clearActiveNode}
        className="flex items-center gap-1 hover:text-slate-700 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
      >
        <Home className="w-3.5 h-3.5" />
        <span>All</span>
      </button>
      {breadcrumbs.map((crumb, i) => (
        <div key={crumb.level + crumb.value} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            onClick={() => navigateBreadcrumb(i)}
            className={`px-2 py-1 rounded-lg transition-colors ${
              i === breadcrumbs.length - 1
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {crumb.label}
          </button>
        </div>
      ))}
    </nav>
  );
}
