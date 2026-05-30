import { useState, useMemo } from 'react';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { Download, ChevronUp, ChevronDown, Search } from 'lucide-react';

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export function MasterDataGrid() {
  const { employees, allColumns, loadingState, openDrawer } = useWorkforce();
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const filtered = useMemo(() => {
    let data = [...employees];
    if (localSearch) {
      const q = localSearch.toLowerCase();
      data = data.filter(e =>
        Object.values(e).some(v => v !== null && String(v).toLowerCase().includes(q))
      );
    }
    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = String(a[sortConfig.key] ?? '');
        const bVal = String(b[sortConfig.key] ?? '');
        const cmp = aVal.localeCompare(bVal);
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [employees, localSearch, sortConfig]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const exportCSV = () => {
    if (!employees.length) return;
    const keys = allColumns.length > 0 ? allColumns : Object.keys(employees[0]);
    const csv = [
      keys.join(','),
      ...employees.map(row =>
        keys.map(k => {
          const val = row[k];
          const str = String(val ?? '');
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workforce_data_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayKeys = useMemo(() => {
    if (allColumns.length > 0) return allColumns;
    if (employees.length > 0) return Object.keys(employees[0]);
    return [];
  }, [allColumns, employees]);

  if (loadingState.employees && employees.length === 0) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-8 bg-slate-100 rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-50 rounded mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 p-3 border-b border-slate-200">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={e => { setLocalSearch(e.target.value); setPage(0); }}
            placeholder="Filter rows..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{filtered.length} of {employees.length} rows</span>
          <span className="text-slate-300">|</span>
          <span>{displayKeys.length} columns</span>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left font-medium text-slate-500 p-2 w-8">#</th>
              {displayKeys.slice(0, 12).map(key => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="text-left font-medium text-slate-500 p-2 cursor-pointer hover:text-slate-700 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{key}</span>
                    {sortConfig?.key === key && (
                      sortConfig.direction === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {displayKeys.length > 12 && (
                <th className="text-left font-medium text-slate-400 p-2">+{displayKeys.length - 12}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.map((emp, i) => (
              <tr
                key={i}
                onClick={() => openDrawer(emp)}
                className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                <td className="p-2 text-slate-400">{page * pageSize + i + 1}</td>
                {displayKeys.slice(0, 12).map(key => (
                  <td key={key} className="p-2 text-slate-700 max-w-[200px] truncate">
                    {String(emp[key] ?? '-')}
                  </td>
                ))}
                {displayKeys.length > 12 && (
                  <td className="p-2 text-slate-400">...</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 text-xs rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 text-xs rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
