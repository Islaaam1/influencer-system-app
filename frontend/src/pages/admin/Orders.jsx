import { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { ShoppingBag, Search, Trash2, ChevronDown, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fmt = (n) => Number(n || 0).toLocaleString('ar-EG');

  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders')
      .then(({ data }) => { setOrders(data); setFiltered(data); })
      .catch(() => toast.error('تعذر تحميل الأوردرات'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  // Filter logic
  useEffect(() => {
    let result = orders;
    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.promo_code?.toLowerCase().includes(q) ||
        o.influencer_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, orders]);

  const handleStatusChange = async (order, newStatus) => {
    try {
      await api.put(`/orders/${order.id}`, { status: newStatus });
      toast.success('تم تحديث الحالة ✅');
      fetchOrders();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/orders/${id}`);
      toast.success('تم حذف الأوردر');
      setDeleteConfirm(null);
      fetchOrders();
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const formatDate = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">الأوردرات</h1>
        <p className="text-slate-500 text-sm mt-0.5">{filtered.length} أوردر</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
            placeholder="بحث بالعميل أو البرومو كود..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                statusFilter === opt.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>لا توجد أوردرات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">#</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">العميل</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">البرومو كود</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">القيمة</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">الخصم</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">الكوميشن</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">#{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{order.customer_name}</p>
                      {order.customer_phone && <p className="text-xs text-slate-400 font-mono">{order.customer_phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {order.promo_code ? (
                        <div>
                          <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{order.promo_code}</span>
                          {order.influencer_name && <p className="text-xs text-slate-400 mt-0.5">{order.influencer_name}</p>}
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-700">{fmt(order.order_value)} ج</td>
                    <td className="px-4 py-3 text-red-500 font-medium">{order.discount_amount > 0 ? `-${fmt(order.discount_amount)} ج` : '—'}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">{order.commission_amount > 0 ? `${fmt(order.commission_amount)} ج` : '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer bg-white hover:border-indigo-300 transition"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="delivered">تم التوصيل</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteConfirm(order)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg mb-2">تأكيد حذف الأوردر</h2>
            <p className="text-slate-500 text-sm mb-6">
              أوردر رقم <span className="font-bold">#{deleteConfirm.id}</span> للعميل <span className="font-bold text-slate-700">{deleteConfirm.customer_name}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition">حذف</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
