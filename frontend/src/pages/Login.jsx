import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`أهلًا ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/influencer', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#717854] px-4 py-10 flex items-center justify-center">
      <div className="absolute -top-28 -right-28 h-72 w-72 rounded-full bg-[#d1bea1]/10 blur-2xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#422c26]/20 blur-3xl" />
   

      <section className="border-0 relative w-full max-w-md overflow-hidden rounded-[2rem]  border-[#d1bea1]/35 bg-white shadow-2xl shadow-[#422c26]/25">
        <div className="bg-[#35221E] px-8 pt-5 pb-4 text-center border-b border-[#d1bea1]/25">
          <img
            src="/logo.png"
            alt="Luna Healthy"
            className="mx-auto h-40 w-52 object-contain drop-shadow-sm"
          />
        </div>

        <div className="px-6 py-7 sm:px-9 sm:py-8">
          <div className="mb-7 text-center">
            <p className="mb-2 text-xs font-bold tracking-[0.24em] text-[#717854]">LUNA HEALTHY</p>
            <h1 className="text-2xl font-extrabold text-[#422c26]">تسجيل الدخول </h1>
            <p className="mt-2 text-sm text-slate-500">أدخل بيانات حسابك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-identifier" className="mb-2 block text-sm font-bold text-[#422c26]">
                البريد الإلكتروني 
              </label>
              <div className="relative">
                <UserRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#717854]" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="E-mail"
                  className="w-full rounded-xl border border-[#e1d8cc] bg-white py-3 pr-12 pl-4 text-sm text-[#422c26] outline-none transition placeholder:text-slate-400 focus:border-[#717854] focus:ring-4 focus:ring-[#717854]/10"
                  dir="auto"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-bold text-[#422c26]">
                كلمة المرور
              </label>
              <div className="relative">
                <LockKeyhole className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#717854]" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#e1d8cc] bg-white py-3 pr-12 pl-12 text-sm text-[#422c26] outline-none transition placeholder:text-slate-400 focus:border-[#717854] focus:ring-4 focus:ring-[#717854]/10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#422c26]"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#422c26] px-6 py-3.5 font-bold text-[#d1bea1] shadow-lg shadow-[#422c26]/20 transition hover:bg-[#35221e] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d1bea1]/40 border-b-[#d1bea1]" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          
        </div>
      </section>
    </main>
  );
}

export default Login;
