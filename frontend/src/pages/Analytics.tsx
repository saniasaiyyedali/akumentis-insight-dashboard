import { VacancyIntelligence } from '../components/workforce/VacancyIntelligence';
import { StateAnalysis } from '../components/workforce/StateAnalysis';
import { DesignationAnalysis } from '../components/workforce/DesignationAnalysis';
import { HiringTrend } from '../components/workforce/HiringTrend';
import { DynamicInsights } from '../components/workforce/DynamicInsights';
import { TreemapChart } from '../components/workforce/TreemapChart';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export function Analytics() {
  return (
    <div className="space-y-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Analytics</h1>
          <p className="text-xs text-slate-400">Business performance analysis from Excel data</p>
        </div>
      </motion.div>

      <BreadcrumbNav />
      <GlobalFilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <VacancyIntelligence />
        <StateAnalysis />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DesignationAnalysis />
        <TreemapChart />
      </div>

      <HiringTrend />

      <DynamicInsights />
    </div>
  );
}
