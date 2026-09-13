function StatsCard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'bg-green-100' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'bg-amber-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'bg-red-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
  };

  const c = colors[color] || colors.indigo;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
      {Icon && (
        <div className={`${c.icon} p-3 rounded-xl flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
        <p className={`text-2xl font-bold ${c.text} mt-0.5`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default StatsCard;
