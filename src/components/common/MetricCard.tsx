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
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    valueText: 'text-white',
    badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800'
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    valueText: 'text-emerald-400',
    badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    valueText: 'text-amber-400',
    badgeBg: 'bg-amber-950 text-amber-300 border-amber-800'
  },
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    valueText: 'text-blue-400',
    badgeBg: 'bg-blue-950 text-blue-300 border-blue-800'
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    valueText: 'text-rose-400',
    badgeBg: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    valueText: 'text-purple-400',
    badgeBg: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    valueText: 'text-cyan-400',
    badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-800'
  },
  slate: {
    iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
    valueText: 'text-white',
    badgeBg: 'bg-slate-800 text-slate-400 border-slate-700'
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
    <div id={id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all hover:border-slate-700">
      <div className="flex items-center gap-3.5">
        <div className={`p-2.5 rounded-xl border ${styles.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-400">{title}</div>
          <div className={`text-base sm:text-xl font-black font-mono tracking-tight ${styles.valueText}`}>
            {value}
          </div>
          {subtext && (
            <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>
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
