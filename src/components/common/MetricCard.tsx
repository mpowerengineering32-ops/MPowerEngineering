import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose' | 'purple' | 'cyan' | 'slate';
  badge?: string;
}

const colorMap = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    valueText: 'text-slate-900',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    valueText: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    valueText: 'text-amber-700',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    valueText: 'text-blue-700',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    valueText: 'text-rose-700',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    valueText: 'text-purple-700',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  cyan: {
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    valueText: 'text-cyan-700',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    valueText: 'text-slate-900',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtext,
  icon: Icon,
  colorScheme = 'indigo',
  badge
}) => {
  const styles = colorMap[colorScheme] || colorMap.indigo;

  return (
    <div id={id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-center gap-3.5">
        <div className={`p-2.5 rounded-xl border ${styles.iconBg} shrink-0 shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</div>
          <div className={`text-base sm:text-xl font-black font-mono tracking-tight ${styles.valueText}`}>
            {value}
          </div>
          {subtext && (
            <div className="text-[11px] text-slate-500 mt-0.5">{subtext}</div>
          )}
        </div>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badgeBg} shrink-0`}>
          {badge}
        </span>
      )}
    </div>
  );
};
