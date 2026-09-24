import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  PackagePlus,
  Plus,
  PlusCircle,
  Search,
  Trash2,
} from 'lucide-react';
import api from '../../utils/api';

const initialForm = {
  customer_name: '',
  customer_phone: '',
  governorate: '',
  address: '',
  promo_code: '',
};

function AddOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [products, setProducts] = useState([]);
  const [orderProducts, setOrderProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [promoStatus, setPromoStatus] = useState(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('تعذر تحميل المنتجات'))
      .finally(() => setLoadingProducts(false));
  }, []);

  const availableProducts = products.filter((product) => (
    product.quantity > 0 && !orderProducts.some((item) => item.product_id === product.id)
  ));

  const orderValue = useMemo(() => orderProducts.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  ), [orderProducts]);
  const discountRate = promoStatus?.valid ? promoStatus.influencer.discount_rate : 0;
  const commissionRate = promoStatus?.valid ? promoStatus.influencer.commission_rate : 0;
  const discountAmount = (orderValue * discountRate) / 100;
  const commissionAmount = (orderValue * commissionRate) / 100;
  const finalValue = orderValue - discountAmount;

  const formatMoney = (value) => Number(value).toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const checkPromo = useCallback(async () => {
    const code = form.promo_code.trim();
    if (!code) {
      setPromoStatus(null);
      return;
    }

    setCheckingPromo(true);
    try {
      const { data } = await api.post('/orders/validate-promo', { promo_code: code });
      setPromoStatus({ valid: true, influencer: data.influencer });
    } catch (error) {
      setPromoStatus({
        valid: false,
        error: error.response?.data?.error || 'البرومو كود غير صحيح',
      });
    } finally {
      setCheckingPromo(false);
    }
  }, [form.promo_code]);

  const addProduct = () => {
    const product = products.find((item) => item.id === selectedProductId);
    if (!product) return;
    setOrderProducts((current) => [...current, {
      product_id: product.id,
      name: product.name,
      code: product.code,
      price: product.price,
      stock: product.quantity,
      quantity: 1,
    }]);
    setSelectedProductId('');
  };

  const updateProductQuantity = (productId, value) => {
    setOrderProducts((current) => current.map((item) => {
      if (item.product_id !== productId) return item;
      const quantity = Math.max(1, Math.min(item.stock, Number(value) || 1));
      return { ...item, quantity };
    }));
  };

  const removeProduct = (productId) => {
    setOrderProducts((current) => current.filter((item) => item.product_id !== productId));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.customer_name || !form.customer_phone || !form.governorate || !form.address) {
      toast.error('يرجى تعبئة بيانات العميل كاملة');
      return;
    }
    if (orderProducts.length === 0) {
      toast.error('اختر منتجًا واحدًا على الأقل');
      return;
    }
    if (form.promo_code && !promoStatus?.valid) {
      toast.error('يرجى التحقق من البرومو كود أولًا');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/orders', {
        ...form,
        products: orderProducts.map(({ product_id, quantity }) => ({ product_id, quantity })),
      });
      toast.success('تم إضافة الأوردر بنجاح 🎉');
      if (!data.google_form_synced) {
        toast.error('تم حفظ الأوردر، لكن تعذر إرساله إلى Google Form');
      }
      navigate('/admin/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء إضافة الأوردر');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-500">
          <ArrowLeft className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إضافة أوردر جديد</h1>
          <p className="text-slate-500 text-sm">أدخل بيانات العميل واختر المنتجات المطلوبة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 text-sm">بيانات العميل</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">الاسم بالكامل *</label>
              <input className="input" value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} required />
            </div>
            <div>
              <label className="label">رقم الهاتف (واتساب) *</label>
              <input className="input" dir="ltr" type="tel" placeholder="01xxxxxxxxx" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} required />
            </div>
            <div>
              <label className="label">المحافظة *</label>
              <input className="input" value={form.governorate} onChange={(event) => setForm({ ...form, governorate: event.target.value })} required />
            </div>
            <div>
              <label className="label">العنوان بالكامل *</label>
              <input className="input" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-700 text-sm">منتجات الأوردر</h2>
              <p className="text-xs text-slate-400 mt-1">السعر يُحسب تلقائيًا من المنتجات والكميات</p>
            </div>
            <PackagePlus className="w-6 h-6 text-[#717854]" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="input flex-1"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              disabled={loadingProducts}
            >
              <option value="">{loadingProducts ? 'جاري تحميل المنتجات...' : 'اختر منتجًا'}</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.code}) — {formatMoney(product.price)} ج — متاح {product.quantity}
                </option>
              ))}
            </select>
            <button type="button" onClick={addProduct} disabled={!selectedProductId} className="px-5 py-2.5 bg-[#422c26] hover:bg-[#35221e] text-white rounded-xl font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>

          {orderProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              لم يتم اختيار منتجات بعد
            </div>
          ) : (
            <div className="space-y-3">
              {orderProducts.map((item) => (
                <div key={item.product_id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.code} · {formatMoney(item.price)} جنيه للوحدة</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">الكمية</label>
                    <input
                      className="input w-24 text-center"
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(event) => updateProductQuantity(item.product_id, event.target.value)}
                    />
                    <span className="text-sm font-bold text-[#5d6446] min-w-24">{formatMoney(item.price * item.quantity)} ج</span>
                    <button type="button" onClick={() => removeProduct(item.product_id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <label className="label">البرومو كود <span className="text-slate-400">(اختياري)</span></label>
          <div className="flex gap-2">
            <input
              className={`input flex-1 font-mono uppercase ${promoStatus?.valid ? 'border-[#8c9e73] bg-[#f4f6f0]' : promoStatus?.valid === false ? 'border-red-400 bg-red-50' : ''}`}
              dir="ltr"
              placeholder="AHMED10"
              value={form.promo_code}
              onChange={(event) => {
                setForm({ ...form, promo_code: event.target.value.toUpperCase() });
                setPromoStatus(null);
              }}
            />
            <button type="button" onClick={checkPromo} disabled={!form.promo_code || checkingPromo} className="px-4 py-2.5 bg-[#422c26] hover:bg-[#35221e] text-white rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center gap-2">
              {checkingPromo ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Search className="w-4 h-4" />}
              تحقق
            </button>
          </div>
          {promoStatus?.valid && (
            <div className="mt-2 flex items-center gap-2 text-[#4a5039] bg-[#f4f6f0] rounded-xl px-3 py-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              كود صحيح: {promoStatus.influencer.name} — خصم {discountRate}% · عمولة {commissionRate}%
            </div>
          )}
          {promoStatus?.valid === false && (
            <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {promoStatus.error}
            </div>
          )}
        </section>

        {orderValue > 0 && (
          <section className="bg-gradient-to-l from-[#f7f3ed] to-[#f4f4ef] rounded-2xl p-5 border border-[#ede4d7] space-y-2">
            <h2 className="font-bold text-[#422c26] text-sm mb-3">ملخص الأوردر</h2>
            <div className="flex justify-between text-sm"><span>إجمالي المنتجات</span><strong>{formatMoney(orderValue)} جنيه</strong></div>
            {discountAmount > 0 && <div className="flex justify-between text-sm text-red-500"><span>الخصم ({discountRate}%)</span><strong>- {formatMoney(discountAmount)} جنيه</strong></div>}
            <div className="border-t border-[#d1bea1] pt-2 flex justify-between"><strong>الإجمالي بعد الخصم</strong><strong className="text-[#5d6446] text-lg">{formatMoney(finalValue)} جنيه</strong></div>
            {commissionAmount > 0 && <div className="flex justify-between text-sm text-[#684b3f] bg-[#faf7f1] rounded-xl px-3 py-2"><span>عمولة الإنفلونسر ({commissionRate}%)</span><strong>{formatMoney(commissionAmount)} جنيه</strong></div>}
          </section>
        )}

        <button type="submit" disabled={saving} className="w-full py-3.5 bg-[#422c26] hover:bg-[#35221e] text-[#d1bea1] font-bold rounded-xl shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <><PlusCircle className="w-5 h-5" /> إضافة الأوردر</>}
        </button>
      </form>

      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem; }
        .input { width: 100%; padding: 0.65rem 0.9rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; font-size: 0.875rem; color: #1e293b; transition: all 0.15s; font-family: 'Cairo', sans-serif; background-color: white; }
        .input:focus { border-color: #717854; box-shadow: 0 0 0 3px rgba(113,120,84,0.14); }
      `}</style>
    </div>
  );
}

export default AddOrder;
