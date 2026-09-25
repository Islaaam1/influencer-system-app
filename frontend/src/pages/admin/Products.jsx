import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit3, Package, Plus, Search, Trash2, X } from 'lucide-react';
import api from '../../utils/api';

const emptyForm = { name: '', code: '', price: '', quantity: '' };

function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('تعذر تحميل المنتجات'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => (
      product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query)
    ));
  }, [products, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      code: product.code,
      price: product.price,
      quantity: product.quantity,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code.toUpperCase(),
        price: Number(form.price),
        quantity: Number(form.quantity),
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('تم تحديث المنتج');
      } else {
        await api.post('/products', payload);
        toast.success('تم إضافة المنتج');
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`هل تريد حذف المنتج ${product.name}؟`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      toast.success('تم حذف المنتج');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'تعذر حذف المنتج');
    }
  };

  const formatMoney = (value) => Number(value).toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">المنتجات</h1>
        <p className="text-sm text-slate-500 mt-1">إدارة المنتجات والأسعار والكميات المتاحة</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
          {editingId && <button type="button" onClick={resetForm} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="product-label">اسم المنتج *</label>
            <input className="product-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div>
            <label className="product-label">كود المنتج *</label>
            <input className="product-input font-mono uppercase" dir="ltr" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required />
          </div>
          <div>
            <label className="product-label">السعر *</label>
            <input className="product-input" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
          </div>
          <div>
            <label className="product-label">الكمية المتاحة *</label>
            <input className="product-input" type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
          </div>
        </div>
        <button type="submit" disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#422c26] px-5 py-2.5 font-semibold text-white hover:bg-[#35221e] disabled:opacity-50 sm:w-auto">
          <Plus className="w-4 h-4" /> {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </button>
      </form>

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-slate-700">كل المنتجات ({products.length})</h2>
          <div className="relative sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="product-input pr-9" placeholder="ابحث بالاسم أو الكود" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">جاري تحميل المنتجات...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-right text-slate-500 font-semibold">المنتج</th>
                  <th className="px-5 py-3 text-right text-slate-500 font-semibold">الكود</th>
                  <th className="px-5 py-3 text-right text-slate-500 font-semibold">السعر</th>
                  <th className="px-5 py-3 text-right text-slate-500 font-semibold">المخزون</th>
                  <th className="px-5 py-3 text-right text-slate-500 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-semibold text-slate-800">{product.name}</td>
                    <td className="px-5 py-4"><span className="font-mono bg-[#f7f3ed] text-[#422c26] px-2 py-1 rounded-lg">{product.code}</span></td>
                    <td className="px-5 py-4 font-semibold text-[#5d6446]">{formatMoney(product.price)} جنيه</td>
                    <td className="px-5 py-4"><span className={`font-bold ${product.quantity === 0 ? 'text-red-500' : product.quantity <= 5 ? 'text-[#684b3f]' : 'text-slate-700'}`}>{product.quantity}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(product)} className="p-2 text-[#422c26] hover:bg-[#f7f3ed] rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .product-label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem; }
        .product-input { width: 100%; padding: 0.65rem 0.9rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; font-size: 0.875rem; color: #1e293b; background: white; }
        .product-input:focus { border-color: #717854; box-shadow: 0 0 0 3px rgba(113,120,84,0.14); }
      `}</style>
    </div>
  );
}

export default Products;
