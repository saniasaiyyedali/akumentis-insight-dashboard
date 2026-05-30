import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';
import { workforceAPI } from '../../services/workforce';

interface AIResponse {
  answer: string;
  data?: unknown;
  action?: { type: string; level?: string; segmentType?: string; segment?: string; profileType?: string; name?: string } | null;
}

interface Props {
  onAction?: (action: AIResponse['action']) => void;
}

const SUGGESTIONS = [
  'Best RM',
  'Worst BM',
  'Best zone',
  'Highest growth manager',
  'Lowest achievement manager',
  'Revenue leakage by state',
  'Why is West underperforming?',
  'Show hierarchy summary',
];

export function SalesCopilot({ onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; action?: AIResponse['action'] }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setLoading(true);
    try {
      const res = await workforceAPI.postOSAI(q);
      const { answer, action } = res.data as AIResponse;
      setMessages(prev => [...prev, { role: 'ai', text: answer, action }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Unable to process query. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 font-semibold text-sm"
      >
        <Sparkles className="w-4 h-4" />
        Akumentis AI
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-sm">Akumentis AI</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Ask about performance, risk, or hierarchy — powered by live Excel data.</p>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => ask(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 border border-slate-100">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[90%] px-3 py-2 rounded-xl ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    {m.text}
                  </div>
                  {m.action && (
                    <button onClick={() => { onAction?.(m.action); setOpen(false); }}
                      className="block mt-1 text-xs text-indigo-600 font-medium hover:underline">
                      View in workspace →
                    </button>
                  )}
                </div>
              ))}
              {loading && <p className="text-xs text-slate-400 animate-pulse">Analyzing live data...</p>}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ask(query)}
                placeholder="Ask anything..."
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button onClick={() => ask(query)} disabled={loading}
                className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
