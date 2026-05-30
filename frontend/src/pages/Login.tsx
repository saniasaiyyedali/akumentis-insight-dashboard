import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('admin@akumentis.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showToast('Welcome back!', 'success');
    } catch {
      showToast('Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* LEFT BRAND AREA */}
      <div className="hidden lg:flex flex-1 items-start justify-start p-10">
        <div>
          {/* BIG GIF LOGO */}
          <img
            src="/home_01.gif"
            alt="Akumentis Logo"
            className="w-[280px] h-[280px] object-contain"
          />

          <h1 className="text-3xl font-bold text-black mt-6">
            Akumentis Sales Dashboard
          </h1>

          <p className="text-gray-600 mt-2 max-w-md">
            Enterprise sales analytics platform for real-time business insights and performance tracking.
          </p>
        </div>
      </div>

      {/* RIGHT LOGIN CARD */}
      <div className="flex-1 flex items-center justify-center p-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

            <h2 className="text-2xl font-bold text-black mb-1">
              Sign In
            </h2>

            <p className="text-gray-500 text-sm mb-6">
              Access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <div>
                <label className="text-sm text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm text-gray-700">Password</label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black pr-10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* SIGNUP */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-black font-medium">
                Create one
              </Link>
            </p>

            {/* MADE BY */}
            <p className="text-center text-xs text-gray-400 mt-6">
              Made by <span className="text-black">Sania Saiyyed Ali</span>
            </p>

          </div>

        </motion.div>

      </div>
    </div>
  );
}