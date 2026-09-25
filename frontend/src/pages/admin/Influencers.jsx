import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, Trash2, DollarSign, X, Check, ChevronDown } from 'lucide-react';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', promo_code: '', discount_rate: 10, commission_rate: 10 };

function Influencers() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState(null); // { id, name, pending }
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fmt = (n) => Number(n || 0).toLocaleString('ar-EG');

  const fetchInfluencers = () => {
    setLoading(true);
    api.get('/influencers')
      .then(({ data }) => setInfluencers(data))
      .catch(() => toast.error('تعذر تحميل  شركاء لونا'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInfluencers(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (inf) => {
    setEditTarget(inf);
    setForm({ name: inf.name, email: inf.email, phone: inf.phone || '', password: '', promo_code: inf.promo_code, discount_rate: inf.discount_rate, commission_rate: inf.commission_rate });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/influencers/${editTarget.id}`, payload);
        toast.success('تم التحديث بنجاح ✅');
      } else {
        await api.post('/influencers', form);
        toast.success('تم إضافة شريك لونا بنجاح 🎉');
      }
      setShowModal(false);
      fetchInfluencers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (inf) => {
    try {
      await api.put(`/influencers/${inf.id}`, { is_active: inf.is_active ? 0 : 1 });
      toast.success(inf.is_active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
      fetchInfluencers();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/influencers/${id}`);
      toast.success('تم الحذف');
      setDeleteConfirm(null);
      fetchInfluencers();
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handlePay = async () => {
    if (!payAmount || Number(payAmount) <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return; }
    try {
      await api.post(`/influencers/${payModal.id}/pay-commission`, { amount: Number(payAmount), notes: payNotes });
      toast.success('تم تسجيل الدفع ✅');
      setPayModal(null); setPayAmount(''); setPayNotes('');
      fetchInfluencers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800"> شركاء لونا</h1>
          <p className="text-slate-500 text-sm mt-0.5">{influencers.length} شريك  مسجل</p>
        </div>
        <button onClick={openAdd} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#422c26] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#35221e] sm:w-auto">
          <UserPlus className="w-4 h-4" />
          إضافة شريك 
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#422c26]" />
          </div>
        ) : influencers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>لا يوجد شريك لوناز بعد</p>
            <button onClick={openAdd} className="text-[#422c26] font-semibold text-sm mt-1 hover:underline">أضف أول شريك لونا</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">شريك لونا</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">البرومو كود</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">الأوردرات</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">المبيعات</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">الكوميشن المعلق</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-right text-slate-500 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {influencers.map((inf) => {
                  const pending = (inf.total_commission || 0) - (inf.paid_commission || 0);
                  return (
                    <tr key={inf.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#717854] to-[#422c26] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {inf.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{inf.name}</p>
                            <p className="text-xs text-slate-400">{inf.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-bold bg-[#f7f3ed] text-[#422c26] px-2 py-1 rounded-lg">
                          {inf.promo_code}
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">خصم {inf.discount_rate}% • كوميشن {inf.commission_rate}%</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{inf.total_orders}</td>
                      <td className="px-4 py-3 font-semibold text-[#5d6446]">{fmt(inf.total_sales)} ج</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${pending > 0 ? 'text-[#684b3f]' : 'text-slate-400'}`}>
                          {fmt(pending)} ج
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(inf)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                            inf.is_active
                              ? 'bg-[#e5e9da] text-[#4a5039] border-[#cdd5ba] hover:bg-[#cdd5ba]'
                              : 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200'
                          }`}
                        >
                          {inf.is_active ? <><Check className="w-3 h-3" /> نشط</> : <><X className="w-3 h-3" /> معطل</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {pending > 0 && (
                            <button
                              onClick={() => { setPayModal({ id: inf.id, name: inf.name, pending }); setPayAmount(''); setPayNotes(''); }}
                              title="تسجيل دفع كوميشن"
                              className="p-1.5 rounded-lg text-[#5d6446] hover:bg-[#f4f6f0] transition"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openEdit(inf)} title="تعديل" className="p-1.5 rounded-lg text-[#422c26] hover:bg-[#f7f3ed] transition">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(inf)} title="حذف" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-4">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6">
              <h2 className="font-bold text-slate-800 text-lg">
                {editTarget ? 'تعديل شريك لونا' : 'إضافة شريك لونا جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="label">الاسم *</label>
                  <input className="input" placeholder="أحمد محمد" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <label className="label">البريد الإلكتروني *</label>
                  <input className="input" type="email" dir="ltr" placeholder="ahmed@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label className="label">رقم التليفون</label>
                  <input className="input" dir="ltr" placeholder="01xxxxxxxxx" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">كلمة المرور {editTarget && <span className="text-xs text-slate-400">(اتركه فارغ للإبقاء)</span>}</label>
                  <input className="input" type="password" dir="ltr" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editTarget} />
                </div>
                <div className="col-span-2">
                  <label className="label">البرومو كود <span className="text-xs text-slate-400">(يُولَّد تلقائياً)</span></label>
                  <input className="input font-mono uppercase" dir="ltr" placeholder="AHMED10" value={form.promo_code} onChange={e => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="label">نسبة الخصم %</label>
                  <input className="input" type="number" min="0" max="100" value={form.discount_rate} onChange={e => setForm({ ...form, discount_rate: e.target.value })} />
                </div>
                <div>
                  <label className="label">نسبة الكوميشن %</label>
                  <input className="input" type="number" min="0" max="100" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#422c26] text-white font-bold rounded-xl hover:bg-[#35221e] transition disabled:opacity-60">
                  {saving ? 'جار الحفظ...' : (editTarget ? 'حفظ التعديلات' : 'إضافة شريك لونا')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Pay Commission Modal ── */}
      {payModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-4">
          <div className="my-auto w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">تسجيل دفع كوميشن</h2>
              <button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              الكوميشن المعلق لـ <span className="font-bold text-slate-700">{payModal.name}</span>:
              <span className="text-[#684b3f] font-bold mr-1">{fmt(payModal.pending)} جنيه</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">المبلغ المدفوع (جنيه)</label>
                <input className="input" type="number" min="1" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" dir="ltr" />
              </div>
              <div>
                <label className="label">ملاحظات (اختياري)</label>
                <input className="input" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="تحويل بنكي..." />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button onClick={handlePay} className="flex-1 py-2.5 bg-[#422c26] text-white font-bold rounded-xl hover:bg-[#35221e] transition">
                تأكيد الدفع
              </button>
              <button onClick={() => setPayModal(null)} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-4">
          <div className="my-auto w-full max-w-sm rounded-2xl bg-white p-4 text-center shadow-2xl sm:p-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg mb-2">تأكيد الحذف</h2>
            <p className="text-slate-500 text-sm mb-6">
              هل أنت متأكد من حذف <span className="font-bold text-slate-700">{deleteConfirm.name}</span>؟
              <br /><span className="text-red-500 text-xs">هذا الإجراء لا يمكن التراجع عنه</span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition">
                نعم، احذف
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for form inputs */}
      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.25rem; }
        .input { width: 100%; padding: 0.6rem 0.85rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; font-size: 0.875rem; color: #1e293b; transition: border 0.15s; }
        .input:focus { border-color: #717854; box-shadow: 0 0 0 3px rgba(113,120,84,0.14); }
      `}</style>
    </div>
  );
}

export default Influencers;
