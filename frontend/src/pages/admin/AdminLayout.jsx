import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/admin/influencers', label: 'شركاء لونا', icon: Users },
  { to: '/admin/products', label: 'المنتجات', icon: Package },
  { to: '/admin/orders', label: 'الأوردرات', icon: ShoppingBag },
  { to: '/admin/add-order', label: 'أضف أوردر', icon: PlusCircle },
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
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 flex-shrink-0 bg-[#717854] text-[#d1bea1] flex flex-col shadow-xl shadow-[#422c26]/10">
        <div className="px-4 py-3 border-b border-[#d1bea1]/30 flex justify-center">
          <img src="/logo.png" alt="Luna Healthy" className="h-36 w-44 object-contain" />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#422c26] text-[#d1bea1] shadow-md'
                  : 'text-[#d1bea1]/85 hover:bg-[#422c26]/30 hover:text-[#d1bea1]'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[#d1bea1]/30">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#422c26]/25 flex items-center justify-center text-[#d1bea1] font-bold text-xs flex-shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[#d1bea1] text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[#d1bea1]/70 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-[#d1bea1] hover:bg-[#422c26]/30 transition text-sm font-medium">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
