import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { ShoppingBag, DollarSign, Clock, Users, Trophy, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/stats')
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('تعذر تحميل الإحصائيات'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#422c26]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">لوحة التحكم</h1>
          <p className="text-slate-500 text-sm mt-0.5">نظرة عامة على أداء  شركاء لونا</p>
        </div>
        <Link
          to="/admin/add-order"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#422c26] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#35221e] sm:w-auto"
        >
          <PlusCircle className="w-4 h-4" />
          أضف أوردر
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي الأوردرات"
          value={stats?.totalOrders ?? 0}
          subtitle={`${stats?.pendingOrders ?? 0} قيد الانتظار`}
          icon={ShoppingBag}
          color="indigo"
        />
        <StatsCard
          title="إجمالي المبيعات"
          value={`${fmt(stats?.totalRevenue)} جنيه`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="كوميشن معلق"
          value={`${fmt(stats?.pendingCommission)} جنيه`}
          subtitle={`من ${fmt(stats?.totalCommission)} جنيه إجمالي`}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title=" الشركاء النشطين"
          value={stats?.totalInfluencers ?? 0}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Top Influencer + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Influencer */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-[#717854]" />
            <h2 className="font-bold text-slate-800">أفضل شريك لونا</h2>
          </div>
          {stats?.topInfluencer ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#717854] to-[#422c26] flex items-center justify-center mx-auto mb-3 shadow-md">
                <span className="text-white font-bold text-xl">
                  {stats.topInfluencer.name?.charAt(0)}
                </span>
              </div>
              <p className="font-bold text-slate-800 text-lg">{stats.topInfluencer.name}</p>
              <p className="text-slate-500 text-sm font-mono mt-1">{stats.topInfluencer.promo_code}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">أوردرات</p>
                  <p className="font-bold text-slate-700 text-lg">{stats.topInfluencer.order_count}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">مبيعات</p>
                  <p className="font-bold text-slate-700 text-sm">{fmt(stats.topInfluencer.total_sales)} ج</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا يوجد بيانات بعد</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">آخر الأوردرات</h2>
            <Link to="/admin/orders" className="text-[#422c26] text-sm font-semibold hover:underline">
              عرض الكل
            </Link>
          </div>
          {stats?.recentOrders?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-right text-slate-500 font-medium">العميل</th>
                    <th className="pb-3 text-right text-slate-500 font-medium">شريك لونا</th>
                    <th className="pb-3 text-right text-slate-500 font-medium">القيمة</th>
                    <th className="pb-3 text-right text-slate-500 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-800">{order.customer_name}</td>
                      <td className="py-3 text-slate-500">
                        {order.influencer_name ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="bg-[#ede4d7] text-[#422c26] text-xs px-1.5 py-0.5 rounded font-mono">{order.promo_code}</span>
                            <span className="text-xs">{order.influencer_name}</span>
                          </span>
                        ) : <span className="text-slate-300 text-xs">بدون كود</span>}
                      </td>
                      <td className="py-3 font-semibold text-[#5d6446]">{fmt(order.order_value)} ج</td>
                      <td className="py-3"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد أوردرات بعد</p>
              <Link to="/admin/add-order" className="text-[#422c26] text-sm font-semibold hover:underline mt-1 inline-block">
                أضف أول أوردر
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
