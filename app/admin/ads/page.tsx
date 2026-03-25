'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface Ad {
  id: number;
  institution_id: number;
  institution_name?: string;
  institution_name_ar?: string;
  title: string;
  content?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  target_type?: 'all' | 'country' | 'city';
  target_value?: string;
  is_active?: boolean;
  created_at: string;
}

const emptyForm = {
  institution_id: '',
  title: '',
  content: '',
  image_url: '',
  start_date: '',
  end_date: '',
  target_type: 'all' as 'all' | 'country' | 'city',
  target_value: '',
};

export default function AdminAdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'upcoming'>('all');
  const [search, setSearch] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH = { 'X-Session-ID': sid };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/ads');
      return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [adsRes, instRes] = await Promise.all([
        fetch(`${API_BASE}/api/ads?limit=200`, { headers: authH }),
        fetch(`${API_BASE}/api/institutions?limit=200`, { headers: authH }),
      ]);
      const adsData = await adsRes.json();
      const instData = await instRes.json();
      setAds(adsData.data || []);
      setInstitutions(instData.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.end_date) { setErr('يرجى ملء الحقول المطلوبة'); return; }
    setSubmitting(true); setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({
          ...form,
          institution_id: form.institution_id ? Number(form.institution_id) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل إنشاء الإعلان');
      setShowCreate(false);
      setForm(emptyForm);
      setSuccessMsg('✓ تم إنشاء الإعلان بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAll();
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await fetch(`${API_BASE}/api/ads/${id}`, { method: 'DELETE', headers: authH });
      setAds(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('فشل الحذف');
    }
  };

  const adStatus = (ad: Ad) => {
    const now = new Date();
    const start = new Date(ad.start_date);
    const end = new Date(ad.end_date);
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  const filtered = ads.filter(ad => {
    const st = adStatus(ad);
    if (filter !== 'all' && st !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (ad.title.toLowerCase().includes(q) ||
        (ad.institution_name_ar || ad.institution_name || '').toLowerCase().includes(q));
    }
    return true;
  });

  const stats = {
    total: ads.length,
    active: ads.filter(a => adStatus(a) === 'active').length,
    upcoming: ads.filter(a => adStatus(a) === 'upcoming').length,
    expired: ads.filter(a => adStatus(a) === 'expired').length,
  };

  const fStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px',
    border: `1.5px solid ${C.teal}40`,
    borderRadius: 10, background: 'white',
    color: C.darkNavy, fontSize: '0.92rem',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, direction: 'rtl', padding: 20 }}>
      {/* هيدر */}
      <div style={{ background: C.darkNavy, borderRadius: 20, padding: '28px 32px', marginBottom: 28, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>📢 إدارة الإعلانات</h1>
          <p style={{ opacity: 0.7, margin: '6px 0 0', fontSize: '0.9rem' }}>عرض وإنشاء وإدارة جميع الإعلانات على المنصة</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/admin" style={{ padding: '10px 20px', borderRadius: 30, background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            ← لوحة الأدمن
          </Link>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', borderRadius: 30, background: C.softGreen, color: C.darkNavy, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
            + إنشاء إعلان
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: `${C.softGreen}20`, border: `1px solid ${C.softGreen}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: C.softGreen, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* إحصائيات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'إجمالي الإعلانات', val: stats.total, color: C.teal, icon: '📢' },
          { label: 'نشطة الآن', val: stats.active, color: C.softGreen, icon: '✅' },
          { label: 'قادمة', val: stats.upcoming, color: '#FFC107', icon: '⏳' },
          { label: 'منتهية', val: stats.expired, color: '#9E9E9E', icon: '❌' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', boxShadow: `0 4px 14px ${C.darkNavy}15`, border: `1px solid ${s.color}30` }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '0.75rem', color: C.teal }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* فلتر + بحث */}
      <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: `0 4px 14px ${C.darkNavy}10`, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 بحث بالعنوان أو المؤسسة..."
          style={{ flex: 1, padding: '10px 15px', borderRadius: 30, border: `2px solid ${C.teal}40`, fontSize: '0.9rem', outline: 'none', minWidth: 180 }}
        />
        {(['all', 'active', 'upcoming', 'expired'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 30, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: filter === f ? 700 : 400,
            background: filter === f ? C.teal : `${C.teal}10`,
            color: filter === f ? 'white' : C.teal,
          }}>
            {f === 'all' ? 'الكل' : f === 'active' ? '✅ نشطة' : f === 'upcoming' ? '⏳ قادمة' : '❌ منتهية'}
            {f !== 'all' && <span style={{ marginRight: 4, opacity: 0.7 }}>({stats[f]})</span>}
          </button>
        ))}
      </div>

      {/* قائمة الإعلانات */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.teal }}>جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 20, color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <div>لا توجد إعلانات مطابقة</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map(ad => {
            const st = adStatus(ad);
            const statusColor = st === 'active' ? C.softGreen : st === 'upcoming' ? '#FFC107' : '#9E9E9E';
            const statusLabel = st === 'active' ? '✅ نشط' : st === 'upcoming' ? '⏳ قادم' : '❌ منتهي';
            const instName = ad.institution_name_ar || ad.institution_name || `مؤسسة #${ad.institution_id}`;
            return (
              <div key={ad.id} style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: `0 4px 18px ${C.darkNavy}12`, border: `1px solid ${statusColor}30` }}>
                {ad.image_url && (
                  <div style={{ height: 140, background: `url(${ad.image_url}) center/cover no-repeat` }} />
                )}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, color: C.darkNavy, fontSize: '1rem', flex: 1 }}>{ad.title}</h3>
                    <span style={{ background: `${statusColor}20`, color: statusColor, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginRight: 8 }}>
                      {statusLabel}
                    </span>
                  </div>
                  {ad.content && <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>{ad.content.substring(0, 100)}{ad.content.length > 100 ? '...' : ''}</p>}
                  <div style={{ fontSize: '0.78rem', color: C.teal, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🏛️</span><span>{instName}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 8 }}>
                    📅 {new Date(ad.start_date).toLocaleDateString('ar-EG')} ← {new Date(ad.end_date).toLocaleDateString('ar-EG')}
                  </div>
                  {ad.target_type && ad.target_type !== 'all' && (
                    <div style={{ fontSize: '0.75rem', color: C.teal, background: `${C.teal}10`, padding: '4px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>
                      {ad.target_type === 'country' ? `🏳️ ${ad.target_value}` : `🏙️ ${ad.target_value}`}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: 'none', background: '#ff505015', color: '#ff5050', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      🗑 حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال إنشاء إعلان */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              📢 إنشاء إعلان جديد
              <button onClick={() => { setShowCreate(false); setErr(''); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            {err && <div style={{ background: '#ff505015', border: '1px solid #ff5050', borderRadius: 8, padding: '10px 14px', color: '#ff5050', fontSize: '0.85rem', marginBottom: 16 }}>{err}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <F label="المؤسسة">
                <select value={form.institution_id} onChange={e => setForm({ ...form, institution_id: e.target.value })} style={fStyle}>
                  <option value="">— بدون مؤسسة (إعلان عام) —</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>)}
                </select>
              </F>

              <F label="عنوان الإعلان *">
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="اكتب عنوان الإعلان" style={fStyle} />
              </F>

              <F label="نص الإعلان">
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} placeholder="تفاصيل الإعلان..." style={{ ...fStyle, resize: 'vertical' }} />
              </F>

              <F label="رابط الصورة">
                <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." style={fStyle} />
              </F>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <F label="تاريخ البداية *"><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required style={fStyle} /></F>
                <F label="تاريخ النهاية *"><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required style={fStyle} /></F>
              </div>

              <F label="الاستهداف الجغرافي (اختياري)">
                <select value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value as any, target_value: '' })} style={fStyle}>
                  <option value="all">🌍 جميع المناطق</option>
                  <option value="country">🏳️ دولة محددة</option>
                  <option value="city">🏙️ مدينة محددة</option>
                </select>
              </F>

              {form.target_type !== 'all' && (
                <F label={form.target_type === 'country' ? 'اسم الدولة (بالإنجليزية)' : 'اسم المدينة (بالإنجليزية)'}>
                  <input
                    type="text"
                    value={form.target_value}
                    onChange={e => setForm({ ...form, target_value: e.target.value })}
                    placeholder={form.target_type === 'country' ? 'مثال: Saudi Arabia' : 'مثال: Riyadh'}
                    style={fStyle}
                  />
                </F>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', background: C.darkNavy, color: 'white', border: 'none', borderRadius: 30, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, fontSize: '1rem' }}>
                  {submitting ? 'جاري الإنشاء...' : '✦ نشر الإعلان'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setErr(''); }} style={{ padding: '12px 28px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 30, cursor: 'pointer' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.83rem', color: C.teal, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}
