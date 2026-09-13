const STATUS_CONFIG = {
  pending:   { label: 'قيد الانتظار', classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  delivered: { label: 'تم التوصيل',   classes: 'bg-green-100 text-green-700 border border-green-200' },
  cancelled: { label: 'ملغي',         classes: 'bg-red-100 text-red-700 border border-red-200' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
export default StatusBadge;
