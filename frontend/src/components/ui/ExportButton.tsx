import { useState } from 'react';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
}

export function ExportButton({ data, filename = 'export' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportCSV = () => {
    if (!data.length) return;
    setExporting(true);
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((h) => {
          const val = row[h];
          const str = String(val ?? '');
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 1000);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={exportCSV}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-medium transition-all disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {exporting ? 'Exporting...' : 'Export CSV'}
    </motion.button>
  );
}
