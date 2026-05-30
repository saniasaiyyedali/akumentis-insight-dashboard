import { useMemo } from 'react';
import { useWorkforce } from '../contexts/WorkforceContext';
import { DollarSign, Users, Percent, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { fmtMoney, totalRevenue } from '../utils/displayUtils';

function SalesCommandCenter() {
  const { employees, refreshData } = useWorkforce();
  const activeEmployees = useMemo(() => employees.filter(e => e.is_active), [employees]);
  const totalRev = useMemo(() => totalRevenue(activeEmployees), [activeEmployees]);
  const employeeCount = useMemo(() => activeEmployees.length, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Sales Command Center</h1>

      {/* Executive KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Revenue */}
        <div className="flex items-center gap-2 bg-emerald-100 p-3 rounded-lg">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span>Revenue</span>
          <span className="text-sm font-medium">{fmtMoney(totalRev)}</span>
        </div>
        {/* Employees */}
        <div className="flex items-center gap-2 bg-blue-100 p-3 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
          <span>Employees</span>
          <span className="text-sm font-medium">{employeeCount}</span>
        </div>
        {/* NSMs */}
        <div className="flex items-center gap-2 bg-purple-100 p-3 rounded-lg">
          <Users className="w-5 h-5 text-purple-600" />
          <span>NSMs</span>
          <span className="text-sm font-medium">--</span>
        </div>
        {/* ZMs */}
        <div className="flex items-center gap-2 bg-cyan-100 p-3 rounded-lg">
          <Users className="w-5 h-5 text-cyan-600" />
          <span>ZMs</span>
          <span className="text-sm font-medium">--</span>
        </div>
        {/* SMs */}
        <div className="flex items-center gap-2 bg-teal-100 p-3 rounded-lg">
          <Users className="w-5 h-5 text-teal-600" />
          <span>SMs</span>
          <span className="text-sm font-medium">--</span>
        </div>
        {/* RMs */}
        <div className="flex items-center gap-2 bg-rose-100 p-3 rounded-lg">
          <Users className="w-5 h-5 text-rose-600" />
          <span>RMs</span>
          <span className="text-sm font-medium">--</span>
        </div>
        {/* BMs */}
        <div className="flex items-center gap-2 bg-indigo-100 p-3 rounded-lg">
          <Users className="w-5 h-5 text-indigo-600" />
          <span>BMs</span>
          <span className="text-sm font-medium">--</span>
        </div>
        {/* Avg Achievement */}
        <div className="flex items-center gap-2 bg-orange-100 p-3 rounded-lg">
          <Percent className="w-5 h-5 text-orange-600" />
          <span>Avg Achievement</span>
          <span className="text-sm font-medium">--</span>
        </div>
        {/* Avg Growth */}
        <div className="flex items-center gap-2 bg-green-100 p-3 rounded-lg">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <span>Avg Growth</span>
          <span className="text-sm font-medium">--</span>
        </div>
        {/* Avg Coverage */}
        <div className="flex items-center gap-2 bg-blue-100 p-3 rounded-lg">
          <Target className="w-5 h-5 text-blue-600" />
          <span>Avg Coverage</span>
          <span className="text-sm font-medium">--</span>
        </div>
      </div>

      {/* Attention Required Section */}
      <div className="grid grid-cols-2 gap-2 mt-6">
        <div className="flex items-center gap-2 bg-red-100 p-3 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Achievement Risk</span>
        </div>
        <div className="flex items-center gap-2 bg-orange-100 p-3 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <span>Negative Growth</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-100 p-3 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Coverage Risk</span>
        </div>
        <div className="flex items-center gap-2 bg-red-100 p-3 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Inventory Risk</span>
        </div>
      </div>

      {/* Placeholder Command Centers */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Achievement Command Center</h2>
          <p className="text-slate-600">Placeholder content</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Growth Command Center</h2>
          <p className="text-slate-600">Placeholder content</p>
        </div>
      </div>

      <button onClick={refreshData} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
        Refresh Data
      </button>
    </div>
  );
}

export default SalesCommandCenter;