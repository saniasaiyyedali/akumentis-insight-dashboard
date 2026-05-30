import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Network,
  BarChart3,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/overview', label: 'Sales Command', icon: LayoutDashboard },
  { path: '/organization', label: 'Organization', icon: Network },
  { path: '/performance', label: 'Performance', icon: BarChart3 },
  { path: '/employee-explorer', label: 'People', icon: Users },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  return (
    <motion.aside
      initial={{ width: collapsed ? 72 : 260 }}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-white border-r border-slate-200 shadow-sm"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold text-slate-900 whitespace-nowrap"
            >
              Akumentis Insight
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-red-50 hover:text-red-600 w-full text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-slate-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-600" />
        )}
      </button>
    </motion.aside>
  );
}