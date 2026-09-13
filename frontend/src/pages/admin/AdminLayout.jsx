import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  PlusCircle,
  LogOut,
  Rocket,
} from 'lucide-react';

const navItems = [
  { to: '/admin',            label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/admin/influencers',label: 'الإنفلونسرز',  icon: Users },
  { to: '/admin/orders',     label: 'الأوردرات',    icon: ShoppingBag },
  { to: '/admin/add-order',  label: 'أضف أوردر',    icon: PlusCircle },
];

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Sidebar (right side in RTL) ── */}
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-indigo-700 to-indigo-900 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-indigo-600/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">نظام الإنفلونسرز</p>
              <p className="text-indigo-300 text-xs">لوحة الأدمين</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-indigo-600/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-indigo-300 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
