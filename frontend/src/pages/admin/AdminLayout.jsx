import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  ShoppingBag,
  Users,
  X,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white md:flex">
      <header className="fixed inset-x-0 top-0 z-40 flex flex-row-reverse h-20 items-center justify-between border-b border-[#d1bea1]/30 bg-[#717854] px-4 shadow-md md:hidden">
        <img src="/logo.png" alt="Luna Healthy" className="h-16 w-24 object-contain scale-[1.3]" />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-xl bg-[#422c26] p-2.5 text-[#d1bea1]"
          aria-label="فتح القائمة"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(82vw,19rem)] flex-col bg-[#717854] text-[#d1bea1] shadow-2xl transition-transform duration-300 md:sticky md:top-0 md:z-20 md:h-screen md:w-64 md:flex-shrink-0 md:translate-x-0 md:shadow-xl ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="relative flex justify-center border-b border-[#d1bea1]/30 px-4 py-3">
          <img src="/logo.png" alt="Luna Healthy" className="h-32 w-44 object-contain md:h-36" />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute left-3 top-3 rounded-lg bg-[#422c26]/70 p-2 text-[#d1bea1] md:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#422c26] text-[#d1bea1] shadow-md'
                  : 'text-[#d1bea1]/85 hover:bg-[#422c26]/30 hover:text-[#d1bea1]'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#d1bea1]/30 px-4 py-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#422c26]/25 text-xs font-bold text-[#d1bea1]">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#d1bea1]">{user?.name}</p>
              <p className="truncate text-xs text-[#d1bea1]/70">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[#d1bea1] transition hover:bg-[#422c26]/30">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-white pt-20 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
