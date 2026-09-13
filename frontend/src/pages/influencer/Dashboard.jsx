import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import StatsCard from '../../components/StatsCard';
import toast from 'react-hot-toast';
import {
  Copy, Check, LogOut, ShoppingBag, DollarSign, Clock, TrendingUp,
  Search, Filter, Rocket
} from 'lucide-react';

const STATUS_TABS = [
  { value: '', label: 'الكل' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
];

function InfluencerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fmt = (n) => Number(n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/orders/my-stats'),
          api.get('/orders'),
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data);
        setFiltered(ordersRes.data);
      } catch {
        toast.error('تعذر تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Filter
  useEffect(() => {
    let result = orders;
    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o => o.customer_name?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [statusFilter, search, orders]);

  const copyCode = () => {
    const code = stats?.user?.promo_code || user?.promo_code;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        toast.success('تم نسخ البرومو كود!');
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج');
    navigate('/login', { replace: true });
  };

  const formatDate = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">جار تحميل داشبوردك...</p>
        </div>
      </div>
    );
  }

  const promoCode = stats?.user?.promo_code || user?.promo_code;
  const influencerName = stats?.user?.name || user?.name;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-l from-indigo-700 to-purple-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">نظام الإنفلونسرز</p>
              <p className="text-indigo-200 text-xs">داشبورد الإنفلونسر</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <p className="text-white font-semibold text-sm">{influencerName}</p>
              <p className="text-indigo-200 text-xs">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Welcome + Promo Code */}
        <div className="max-w-5xl mx-auto px-6 pb-8 pt-2">
          <h1 className="text-2xl font-bold mb-1">أهلاً، {influencerName}! 👋</h1>
          <p className="text-indigo-200 text-sm mb-6">إليك نظرة على أداء برومو كودك</p>

          {/* Promo Code Card */}
          {promoCode && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border border-white/20 max-w-md">
              <div>
                <p className="text-indigo-200 text-xs font-medium mb-1">برومو كودك الخاص</p>
                <p className="text-3xl font-black tracking-widest font-mono text-white">{promoCode}</p>
                <p className="text-indigo-200 text-xs mt-1">
                  خصم {stats?.user?.discount_rate}% للعميل • كوميشن {stats?.user?.commission_rate}% ليك
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex flex-col items-center gap-1 p-3 bg-white/20 hover:bg-white/30 rounded-xl transition"
                title="انسخ الكود"
              >
                {copied ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5 text-white" />}
                <span className="text-xs text-white/80">{copied ? 'تم!' : 'انسخ'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="إجمالي الأوردرات"
            value={stats?.totalOrders ?? 0}
            icon={ShoppingBag}
            color="indigo"
          />
          <StatsCard
            title="إجمالي المبيعات"
            value={`${fmt(stats?.totalSales)} ج`}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="كوميشن معلق"
            value={`${fmt(stats?.pendingCommission)} ج`}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="كوميشن مدفوع"
            value={`${fmt(stats?.paidCommission)} ج`}
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-bold text-slate-800 text-lg">أوردراتي</h2>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="pr-9 pl-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm w-48"
                  placeholder="بحث..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    statusFilter === tab.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {tab.label}
                  {tab.value === '' && orders.length > 0 && (
                    <span className="mr-1 bg-white/30 text-current rounded-full px-1.5">{orders.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا توجد أوردرات</p>
              <p className="text-sm mt-1">شارك برومو كودك وانتظر الأوردرات! 🚀</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-right text-slate-500 font-semibold">#</th>
                    <th className="px-4 py-3 text-right text-slate-500 font-semibold">العميل</th>
                    <th className="px-4 py-3 text-right text-slate-500 font-semibold">قيمة الأوردر</th>
                    <th className="px-4 py-3 text-right text-slate-500 font-semibold">كوميشنك</th>
                    <th className="px-4 py-3 text-right text-slate-500 font-semibold">الحالة</th>
                    <th className="px-4 py-3 text-right text-slate-500 font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">#{order.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{order.customer_name}</p>
                        {order.customer_phone && (
                          <p className="text-xs text-slate-400 font-mono">{order.customer_phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-700">
                        {Number(order.order_value).toLocaleString('ar-EG')} ج
                      </td>
                      <td className="px-4 py-3">
                        {order.commission_amount > 0 ? (
                          <span className={`font-bold ${order.status === 'cancelled' ? 'text-slate-300 line-through' : 'text-amber-600'}`}>
                            {Number(order.commission_amount).toLocaleString('ar-EG')} ج
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-400 text-xs pb-4">
          الكوميشن الخاص بالأوردرات الملغية لا يُحتسب • تواصل مع الأدمين لاستلام الكوميشن
        </p>
      </div>
    </div>
  );
}

export default InfluencerDashboard;
