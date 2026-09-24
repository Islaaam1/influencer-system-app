const STATUS_CONFIG = {
  pending:   { label: 'قيد الانتظار', classes: 'bg-[#f2eadd] text-[#684b3f] border border-[#e3d4bd]' },
  delivered: { label: 'تم التوصيل',   classes: 'bg-[#e5e9da] text-[#4a5039] border border-[#cdd5ba]' },
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
