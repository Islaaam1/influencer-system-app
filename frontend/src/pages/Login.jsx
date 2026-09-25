import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`أهلاً ${data.user.name}! 👋`);
      navigate(data.user.role === 'admin' ? '/admin' : '/influencer', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#422c26]/10 border border-slate-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-[#717854] rounded-2xl mb-4">
              <img src="/logo.png" alt="Luna Healthy" className="h-36 w-48 object-contain mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              شركاء لونا
               </h1>
            <p className="text-slate-500 text-sm mt-1">سجّل دخولك للمتابعة</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="البريد الإلكتروني أو اسم المستخدم"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#717854] focus:ring-2 focus:ring-[#ede4d7] outline-none transition text-slate-800 text-sm"
                dir="auto"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#717854] focus:ring-2 focus:ring-[#ede4d7] outline-none transition text-slate-800 text-sm"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-[#422c26] hover:bg-[#35221e] text-[#d1bea1] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 text-center">
                {/* حساب الأدمين الافتراضي: <span className="text-[#422c26] font-mono" dir="ltr"></span>
                <br />كلمة المرور: <span className="text-[#422c26] font-mono" dir="ltr"></span> */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
