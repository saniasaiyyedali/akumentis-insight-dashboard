import { useAuth } from '../../contexts/AuthContext';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export function TopNav() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 h-16">
      <div className="absolute inset-0 backdrop-blur-xl border-b bg-white/80 border-slate-200" />
      <div className="relative h-full px-6 flex items-center justify-end gap-4">
        {user && (
          <span className="text-xs text-slate-500">
            {user.name} <span className="text-slate-300">|</span>{' '}
            <span className="capitalize">{user.role}</span>
          </span>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        </motion.button>
      </div>
    </header>
  );
}
