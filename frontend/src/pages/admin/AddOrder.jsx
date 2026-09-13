import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PlusCircle, Search, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

function AddOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    order_value: '',
    promo_code: '',
    notes: '',
  });
  const [promoStatus, setPromoStatus] = useState(null); // null | { valid, influencer, error }
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [saving, setSaving] = useState(false);

  const orderValue = Number(form.order_value) || 0;
  const discountRate = promoStatus?.valid ? promoStatus.influencer.discount_rate : 0;
  const commissionRate = promoStatus?.valid ? promoStatus.influencer.commission_rate : 0;
  const discountAmount = (orderValue * discountRate) / 100;
  const commissionAmount = (orderValue * commissionRate) / 100;
  const finalValue = orderValue - discountAmount;

  const fmt = (n) => Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const checkPromo = useCallback(async () => {
    const code = form.promo_code.trim();
    if (!code) { setPromoStatus(null); return; }
    setCheckingPromo(true);
    try {
      const { data } = await api.post('/orders/validate-promo', { promo_code: code });
      setPromoStatus({ valid: true, influencer: data.influencer });
    } catch (err) {
      setPromoStatus({ valid: false, error: err.response?.data?.error || 'كود غير صحيح' });
    } finally {
      setCheckingPromo(false);
    }
  }, [form.promo_code]);

  const handlePromoChange = (e) => {
    setForm({ ...form, promo_code: e.target.value.toUpperCase() });
    setPromoStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.order_value) {
      toast.error('يرجى تعبئة البيانات المطلوبة');
      return;
    }
    if (form.promo_code && !promoStatus?.valid) {
      toast.error('يرجى التحقق من البرومو كود أولاً');
      return;
    }
    setSaving(true);
    try {
      await api.post('/orders', form);
      toast.success('تم إضافة الأوردر بنجاح 🎉');
      navigate('/admin/orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-500">
          <ArrowLeft className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إضافة أوردر جديد</h1>
          <p className="text-slate-500 text-sm">أدخل بيانات الأوردر القادم</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">بيانات العميل</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">اسم العميل *</label>
              <input
                className="input"
                placeholder="مثال: سارة أحمد"
                value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">رقم التليفون</label>
              <input
                className="input"
                dir="ltr"
                placeholder="01xxxxxxxxx"
                value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">بيانات الأوردر</h2>

          {/* Order Value */}
          <div>
            <label className="label">قيمة الأوردر (جنيه) *</label>
            <input
              className="input text-lg font-bold"
              type="number"
              min="0"
              step="0.01"
              dir="ltr"
              placeholder="0.00"
              value={form.order_value}
              onChange={e => setForm({ ...form, order_value: e.target.value })}
              required
            />
          </div>

          {/* Promo Code */}
          <div>
            <label className="label">البرومو كود <span className="text-slate-400">(اختياري)</span></label>
            <div className="flex gap-2">
              <input
                className={`input flex-1 font-mono uppercase text-base ${
                  promoStatus?.valid ? 'border-green-400 bg-green-50' :
                  promoStatus?.valid === false ? 'border-red-400 bg-red-50' : ''
                }`}
                dir="ltr"
                placeholder="AHMED10"
                value={form.promo_code}
                onChange={handlePromoChange}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), checkPromo())}
              />
              <button
                type="button"
                onClick={checkPromo}
                disabled={!form.promo_code || checkingPromo}
                className="px-4 py-2.5 bg-slate-700 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
              >
                {checkingPromo ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : <Search className="w-4 h-4" />}
                تحقق
              </button>
            </div>

            {/* Promo feedback */}
            {promoStatus?.valid && (
              <div className="mt-2 flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-3 py-2 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  ✅ كود صحيح! الإنفلونسر: <strong>{promoStatus.influencer.name}</strong> —
                  خصم {promoStatus.influencer.discount_rate}% • كوميشن {promoStatus.influencer.commission_rate}%
                </span>
              </div>
            )}
            {promoStatus?.valid === false && (
              <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{promoStatus.error}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="أي تفاصيل إضافية عن الأوردر..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Summary */}
        {orderValue > 0 && (
          <div className="bg-gradient-to-l from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
            <h2 className="font-bold text-indigo-800 text-sm mb-4">ملخص الأوردر</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">القيمة الأصلية</span>
                <span className="font-bold text-slate-800">{fmt(orderValue)} جنيه</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-500">خصم ({discountRate}%)</span>
                  <span className="font-bold text-red-500">- {fmt(discountAmount)} جنيه</span>
                </div>
              )}
              <div className="border-t border-indigo-200 pt-2 flex justify-between">
                <span className="font-bold text-slate-700">القيمة بعد الخصم</span>
                <span className="font-bold text-green-700 text-lg">{fmt(finalValue)} جنيه</span>
              </div>
              {commissionAmount > 0 && (
                <div className="flex justify-between text-sm bg-amber-50 rounded-xl px-3 py-2 mt-1">
                  <span className="text-amber-600 font-semibold">كوميشن الإنفلونسر ({commissionRate}%)</span>
                  <span className="font-bold text-amber-700">{fmt(commissionAmount)} جنيه</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 text-base"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              إضافة الأوردر
            </>
          )}
        </button>
      </form>

      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem; }
        .input { width: 100%; padding: 0.65rem 0.9rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; font-size: 0.875rem; color: #1e293b; transition: all 0.15s; font-family: 'Cairo', sans-serif; }
        .input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>
    </div>
  );
}

export default AddOrder;
