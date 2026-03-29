'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const COLORS = { lightMint: '#EDF7BD', softGreen: '#85C79A', teal: '#4E8D9C', darkNavy: '#281C59' };

const CATEGORIES = [
  { id: 'erp',          label: 'ERP',              icon: '🏭' },
  { id: 'crm',          label: 'CRM',              icon: '🤝' },
  { id: 'hr',           label: 'HR',               icon: '👥' },
  { id: 'funnel',       label: 'Funnels',          icon: '🌪️' },
  { id: 'landing_page', label: 'Landing Pages',    icon: '🖥️' },
  { id: 'form',         label: 'Registration Forms', icon: '📋' },
  { id: 'tool',         label: 'أدوات أخرى',      icon: '🛠️' },
];

const PRICING_AR: Record<string, string> = {
  free: 'مجاني', subscription: 'اشتراك', one_time: 'دفعة واحدة',
};

export default function AdminSaas() {
  const router = useRouter();
  const [apps, setApps]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage]         = useState(1);
  const [form, setForm]         = useState({
    name: '', name_ar: '', slug: '', category: 'erp', description_ar: '',
    pricing_model: 'subscription', price_monthly: '', price_yearly: '',
    external_url: '', is_featured: false, features: [] as string[],
    sort_order: '',
  });
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving]     = useState(false);
  const limit = 20;

  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const headers   = { 'X-Session-ID': sessionId, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') { router.push('/'); return; }
    fetchApps();
  }, [page]);

  const fetchApps = async () => {
    setLoading(true);
    const res  = await fetch(`${API_BASE}/api/saas?page=${page}&limit=${limit}`, { headers });
    const data = await res.json();
    setApps(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (i: number) => {
    setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert('اسم التطبيق مطلوب');
    setSaving(true);
    const body = {
      ...form,
      price_monthly: parseFloat(form.price_monthly) || 0,
      price_yearly:  parseFloat(form.price_yearly)  || 0,
      sort_order:    parseInt(form.sort_order) || 0,
    };
    const res = await fetch(`${API_BASE}/api/saas`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setShowForm(false);
      setForm({ name: '', name_ar: '', slug: '', category: 'erp', description_ar: '', pricing_model: 'subscription', price_monthly: '', price_yearly: '', external_url: '', is_featured: false, features: [], sort_order: '' });
      fetchApps();
    } else {
      alert(data.error || 'حدث خطأ');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1px solid ${COLORS.teal}40`, outline: 'none',
    fontSize: '0.9rem', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box',
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 6 }}>☁️ الخدمات السحابية SAAS</h1>
          <p style={{ opacity: 0.7 }}>إدارة كتالوج تطبيقات SAAS والاشتراكات</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: COLORS.teal, color: 'white',
            border: 'none', padding: '10px 22px', borderRadius: 40,
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
            fontFamily: 'Cairo, sans-serif',
          }}>
            {showForm ? '✕ إلغاء' : '+ إضافة تطبيق'}
          </button>
          <Link href="/admin" style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', padding: '10px 20px', borderRadius: 40, textDecoration: 'none',
          }}>← لوحة التحكم</Link>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 20, padding: '24px', marginBottom: 24, boxShadow: `0 4px 20px ${COLORS.darkNavy}12` }}>
          <h2 style={{ color: COLORS.darkNavy, margin: '0 0 20px', fontSize: '1.1rem' }}>إضافة تطبيق SAAS جديد</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>اسم التطبيق (EN) *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="مثال: ERP Pro" />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>الاسم بالعربية</label>
                <input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} style={inputStyle} placeholder="مثال: نظام تخطيط الموارد" />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>التصنيف</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', backgroundSize: '14px', paddingLeft: 36 }}>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>نموذج التسعير</label>
                <select value={form.pricing_model} onChange={e => setForm(f => ({ ...f, pricing_model: e.target.value }))} style={{ ...inputStyle, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', backgroundSize: '14px', paddingLeft: 36 }}>
                  <option value="free">مجاني</option>
                  <option value="subscription">اشتراك</option>
                  <option value="one_time">دفعة واحدة</option>
                </select>
              </div>
              {form.pricing_model !== 'free' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>السعر الشهري ($)</label>
                    <input type="number" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>السعر السنوي ($)</label>
                    <input type="number" value={form.price_yearly} onChange={e => setForm(f => ({ ...f, price_yearly: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                </>
              )}
              <div>
                <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>الرابط الخارجي</label>
                <input value={form.external_url} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>ترتيب العرض</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} style={inputStyle} placeholder="0" />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 6 }}>الوصف بالعربية</label>
              <textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="وصف مختصر للتطبيق..." />
            </div>

            {/* Features */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: '0.85rem', color: '#555', display: 'block', marginBottom: 8 }}>المميزات</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={featureInput} onChange={e => setFeatureInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                  style={{ ...inputStyle, flex: 1 }} placeholder="أضف ميزة واضغط Enter"
                />
                <button type="button" onClick={addFeature} style={{
                  background: COLORS.teal, color: 'white', border: 'none', borderRadius: 10,
                  padding: '10px 18px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                }}>+</button>
              </div>
              {form.features.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {form.features.map((f, i) => (
                    <span key={i} style={{
                      background: `${COLORS.teal}12`, color: COLORS.teal,
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      ✓ {f}
                      <button type="button" onClick={() => removeFeature(i)} style={{
                        background: 'none', border: 'none', color: '#999',
                        cursor: 'pointer', fontSize: '1rem', padding: '0 2px',
                      }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_featured}
                  onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                تطبيق مميز
              </label>
              <button type="submit" disabled={saving} style={{
                background: COLORS.darkNavy, color: 'white', border: 'none',
                borderRadius: 40, padding: '12px 28px', cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Cairo, sans-serif',
                marginRight: 'auto', opacity: saving ? 0.6 : 1,
              }}>
                {saving ? '...' : 'حفظ التطبيق'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
        {CATEGORIES.map(cat => {
          const count = apps.filter(a => a.category === cat.id).length;
          return (
            <div key={cat.id} style={{
              background: 'white', borderRadius: 16, padding: '14px 18px',
              boxShadow: `0 2px 8px ${COLORS.darkNavy}10`, textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{cat.icon}</div>
              <div style={{ fontWeight: 700, color: COLORS.darkNavy, fontSize: '1.2rem' }}>{count}</div>
              <div style={{ color: '#888', fontSize: '0.8rem' }}>{cat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Apps Table */}
      <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: `0 4px 14px ${COLORS.darkNavy}12` }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>جاري التحميل...</div>
        ) : apps.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#ccc' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>☁️</div>
            <div>لا توجد تطبيقات بعد</div>
            <div style={{ fontSize: '0.85rem', marginTop: 8, color: '#bbb' }}>استخدم زر "إضافة تطبيق" لإضافة أول تطبيق SAAS</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: `${COLORS.darkNavy}08`, borderBottom: `2px solid ${COLORS.teal}20` }}>
                {['#', 'التطبيق', 'التصنيف', 'التسعير', 'السعر', 'مميز', 'الاشتراكات'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: COLORS.darkNavy, fontWeight: 700, fontSize: '0.88rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app: any, i) => (
                <tr key={app.id} style={{ borderBottom: `1px solid ${COLORS.teal}10` }}
                  onMouseEnter={e => e.currentTarget.style.background = `${COLORS.teal}06`}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '0.85rem' }}>{(page - 1) * limit + i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: COLORS.darkNavy, fontSize: '0.95rem' }}>
                      {app.name_ar || app.name}
                    </div>
                    {app.name_ar && <div style={{ fontSize: '0.75rem', color: '#999' }}>{app.name}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{CATEGORIES.find(c => c.id === app.category)?.icon}</span>
                    {' '}
                    <span style={{ fontSize: '0.82rem', color: '#666' }}>{CATEGORIES.find(c => c.id === app.category)?.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: app.pricing_model === 'free' ? '#10b98115' : `${COLORS.teal}15`,
                      color: app.pricing_model === 'free' ? '#10b981' : COLORS.teal,
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem',
                    }}>
                      {PRICING_AR[app.pricing_model] || app.pricing_model}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: COLORS.darkNavy, fontSize: '0.88rem' }}>
                    {app.pricing_model === 'free' ? '—' : (
                      app.price_monthly > 0 ? `$${app.price_monthly}/شهر` : `$${app.price_yearly}/سنة`
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {app.is_featured ? '⭐' : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: '0.88rem' }}>
                    {app.active_subscriptions ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {Math.ceil(total / limit) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: page === p ? COLORS.teal : 'white',
              color: page === p ? 'white' : COLORS.darkNavy,
              border: `1px solid ${page === p ? COLORS.teal : '#ddd'}`,
              cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
