function StatsCard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: { bg: 'bg-[#f7f3ed]', text: 'text-[#422c26]', icon: 'bg-[#ede4d7]' },
    green:  { bg: 'bg-[#f4f6f0]', text: 'text-[#5d6446]', icon: 'bg-[#e5e9da]' },
    amber:  { bg: 'bg-[#faf7f1]', text: 'text-[#684b3f]', icon: 'bg-[#f2eadd]' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'bg-red-100' },
    purple: { bg: 'bg-[#f4f4ef]', text: 'text-[#717854]', icon: 'bg-[#e7e8dc]' },
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
