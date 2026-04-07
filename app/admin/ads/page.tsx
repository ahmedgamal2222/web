'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadImage } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

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
  status: string;
  duration_days?: number;
  cost?: number;
  views?: number;
  clicks?: number;
  approved_at?: string;
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
  const [serverStats, setServerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'active' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');
  const [detectedLocation, setDetectedLocation] = useState<{ country: string | null; city: string | null; region: string | null } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [statsModal, setStatsModal] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setErr('يرجى اختيار ملف صورة صالح'); return; }
    if (file.size > 10 * 1024 * 1024) { setErr('حجم الصورة يجب أن يكون أقل من 10 ميجا'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setImageUploading(true);
    setImageProgress(0);
    setErr('');
    try {
      const result = await uploadImage(file, setImageProgress);
      setForm(prev => ({ ...prev, image_url: result.url }));
    } catch (e: any) {
      setErr('فشل رفع الصورة: ' + e.message);
      setImagePreview('');
    } finally {
      setImageUploading(false);
    }
  };

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
        fetch(`${API_BASE}/api/ads?limit=200&all=true&status=all&auto_location=false`, { headers: authH }),
        fetch(`${API_BASE}/api/institutions?limit=200`, { headers: authH }),
      ]);
      const adsData = await adsRes.json();
      const instData = await instRes.json();
      setAds(adsData.data || []);
      if (adsData.stats) setServerStats(adsData.stats);
      setInstitutions(instData.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetectedLocation = async () => {
    setLocationLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ads/location`, { headers: authH });
      const data = await res.json();
      if (data.success) {
        setDetectedLocation(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLocationLoading(false);
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
      setImagePreview('');
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

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/ads/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccessMsg('✓ تمت الموافقة على الإعلان');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAll();
    } catch { alert('فشل الموافقة'); }
  };

  const handleReject = async (id: number) => {
    if (!confirm('رفض هذا الإعلان؟ سيتم استرداد الرصيد للمؤسسة.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/ads/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({ action: 'reject' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccessMsg('✓ تم رفض الإعلان واسترداد الرصيد');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAll();
    } catch { alert('فشل الرفض'); }
  };

  const handleViewStats = async (ad: Ad) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ads/${ad.id}/stats`, { headers: authH });
      const data = await res.json();
      setStatsModal(data);
    } catch { alert('فشل جلب الإحصائيات'); }
    finally { setStatsLoading(false); }
  };

  const adStatus = (ad: Ad) => {
    if (ad.status === 'pending') return 'pending';
    if (ad.status === 'rejected') return 'rejected';
    const now = new Date();
    const start = new Date(ad.start_date);
    const end = new Date(ad.end_date);
    if (ad.status === 'approved') {
      if (now < start) return 'approved';
      if (now > end) return 'expired';
      return 'active';
    }
    return ad.status;
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

  const stats = serverStats || {
    total: ads.length,
    pending: ads.filter(a => adStatus(a) === 'pending').length,
    active: ads.filter(a => adStatus(a) === 'active').length,
    approved: ads.filter(a => adStatus(a) === 'approved').length,
    rejected: ads.filter(a => adStatus(a) === 'rejected').length,
    expired: ads.filter(a => adStatus(a) === 'expired').length,
    total_revenue: 0,
    total_views: 0,
    total_clicks: 0,
  };

  const fStyle: React.CSSProperties = { color: C.darkNavy };

  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'الإجمالي', val: stats.total, color: C.teal, icon: '📢' },
          { label: 'بانتظار الموافقة', val: stats.pending, color: '#f59e0b', icon: '⏳' },
          { label: 'نشطة الآن', val: stats.active, color: C.softGreen, icon: '✅' },
          { label: 'معتمدة (قادمة)', val: stats.approved, color: '#3b82f6', icon: '📋' },
          { label: 'مرفوضة', val: stats.rejected, color: '#ef4444', icon: '🚫' },
          { label: 'منتهية', val: stats.expired, color: '#9E9E9E', icon: '❌' },
          { label: 'إجمالي الإيرادات', val: `$${(stats.total_revenue || 0).toFixed(0)}`, color: '#10b981', icon: '💰' },
          { label: 'إجمالي المشاهدات', val: stats.total_views || 0, color: '#8b5cf6', icon: '👁️' },
          { label: 'إجمالي النقرات', val: stats.total_clicks || 0, color: '#f97316', icon: '🖱️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', boxShadow: `0 4px 14px ${C.darkNavy}15`, border: `1px solid ${s.color}30` }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '0.83rem', color: C.teal }}>{s.label}</div>
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
        {(['all', 'pending', 'active', 'approved', 'rejected', 'expired'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 30, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: filter === f ? 700 : 400,
            background: filter === f ? (f === 'pending' ? '#f59e0b' : C.teal) : `${C.teal}10`,
            color: filter === f ? 'white' : C.teal,
          }}>
            {f === 'all' ? 'الكل' : f === 'pending' ? '⏳ بانتظار' : f === 'active' ? '✅ نشطة' : f === 'approved' ? '📋 معتمدة' : f === 'rejected' ? '🚫 مرفوضة' : '❌ منتهية'}
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
            const statusColor = st === 'active' ? C.softGreen : st === 'pending' ? '#f59e0b' : st === 'approved' ? '#3b82f6' : st === 'rejected' ? '#ef4444' : '#9E9E9E';
            const statusLabel = st === 'active' ? '✅ نشط' : st === 'pending' ? '⏳ بانتظار الموافقة' : st === 'approved' ? '📋 معتمد (قادم)' : st === 'rejected' ? '🚫 مرفوض' : '❌ منتهي';
            const instName = ad.institution_name_ar || ad.institution_name || `مؤسسة #${ad.institution_id}`;
            return (
              <div key={ad.id} style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: `0 4px 18px ${C.darkNavy}12`, border: `2px solid ${statusColor}30` }}>
                {ad.image_url && (
                  <div style={{ height: 140, background: `url(${ad.image_url}) center/cover no-repeat` }} />
                )}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, color: C.darkNavy, fontSize: '1rem', flex: 1 }}>{ad.title}</h3>
                    <span style={{ background: `${statusColor}20`, color: statusColor, padding: '3px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, marginRight: 8 }}>
                      {statusLabel}
                    </span>
                  </div>
                  {ad.content && <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>{ad.content.substring(0, 100)}{ad.content.length > 100 ? '...' : ''}</p>}
                  <div style={{ fontSize: '0.85rem', color: C.teal, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🏛️</span><span>{instName}</span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: '#888', marginBottom: 6 }}>
                    📅 {new Date(ad.start_date).toLocaleDateString('ar-EG')} ← {new Date(ad.end_date).toLocaleDateString('ar-EG')}
                    {ad.duration_days && <span style={{ marginRight: 8 }}>({ad.duration_days} يوم)</span>}
                  </div>
                  {/* Cost & Views row */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: '0.83rem' }}>
                    {ad.cost != null && <span style={{ background: `${C.darkNavy}08`, padding: '3px 10px', borderRadius: 20, color: C.darkNavy, fontWeight: 600 }}>💰 ${ad.cost}</span>}
                    <span style={{ background: `${C.teal}10`, padding: '3px 10px', borderRadius: 20, color: C.teal, fontWeight: 600 }}>👁 {ad.views || 0} مشاهدة</span>
                  </div>
                  {ad.target_type && ad.target_type !== 'all' && (
                    <div style={{ fontSize: '0.83rem', color: C.teal, background: `${C.teal}10`, padding: '4px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>
                      {ad.target_type === 'country' ? `🏳️ ${ad.target_value}` : `🏙️ ${ad.target_value}`}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {st === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(ad.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: 'none', background: `${C.softGreen}20`, color: '#16a34a', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                          ✓ موافقة
                        </button>
                        <button onClick={() => handleReject(ad.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: 'none', background: '#ef444415', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                          ✕ رفض
                        </button>
                      </>
                    )}
                    <button onClick={() => handleViewStats(ad)} style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: 'none', background: `${C.teal}12`, color: C.teal, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                      📊 إحصائيات
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      style={{ padding: '7px 14px', borderRadius: 20, border: 'none', background: '#ff505015', color: '#ff5050', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال الإحصائيات */}
      {statsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: C.darkNavy }}>📊 إحصائيات الإعلان</h2>
              <button onClick={() => setStatsModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </div>
            {statsModal.ad && (
              <div style={{ background: `${C.teal}08`, borderRadius: 14, padding: 16, marginBottom: 20, border: `1px solid ${C.teal}20` }}>
                <h3 style={{ margin: '0 0 6px', color: C.darkNavy }}>{statsModal.ad.title}</h3>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  🏛️ {statsModal.ad.institution_name_ar || statsModal.ad.institution_name || 'عام'}
                  {statsModal.ad.cost != null && <span style={{ marginRight: 12 }}>💰 التكلفة: ${statsModal.ad.cost}</span>}
                </div>
              </div>
            )}
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: `${C.softGreen}15`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.softGreen }}>{statsModal.stats?.total_views || 0}</div>
                <div style={{ fontSize: '0.82rem', color: '#666' }}>إجمالي المشاهدات</div>
              </div>
              <div style={{ background: `${C.teal}12`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.teal }}>{statsModal.stats?.unique_viewers || 0}</div>
                <div style={{ fontSize: '0.82rem', color: '#666' }}>زوار فريدون</div>
              </div>
            </div>
            {/* Views by country */}
            {statsModal.stats?.views_by_country?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: C.darkNavy, margin: '0 0 10px', fontSize: '0.95rem' }}>🌍 المشاهدات حسب الدولة</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {statsModal.stats.views_by_country.map((c: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: `${C.teal}06`, borderRadius: 8 }}>
                      <span style={{ color: C.darkNavy }}>{c.country || 'غير محدد'}</span>
                      <span style={{ fontWeight: 700, color: C.teal }}>{c.cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Views by city */}
            {statsModal.stats?.views_by_city?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ color: C.darkNavy, margin: '0 0 10px', fontSize: '0.95rem' }}>🏙️ المشاهدات حسب المدينة</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {statsModal.stats.views_by_city.map((c: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: `${C.teal}06`, borderRadius: 8 }}>
                      <span style={{ color: C.darkNavy }}>{c.city || 'غير محدد'} ({c.country})</span>
                      <span style={{ fontWeight: 700, color: C.teal }}>{c.cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Views by day */}
            {statsModal.stats?.views_by_day?.length > 0 && (
              <div>
                <h4 style={{ color: C.darkNavy, margin: '0 0 10px', fontSize: '0.95rem' }}>📅 المشاهدات حسب اليوم</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {statsModal.stats.views_by_day.slice(0, 14).map((d: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', background: i % 2 === 0 ? `${C.teal}04` : 'transparent', borderRadius: 6 }}>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>{d.day}</span>
                      <span style={{ fontWeight: 700, color: C.teal, fontSize: '0.85rem' }}>{d.cnt} مشاهدة</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!statsModal.stats?.total_views) && (
              <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                لا توجد مشاهدات بعد
              </div>
            )}
          </div>
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

              <F label="صورة الإعلان">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(imagePreview || form.image_url) && (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 160 }}>
                      <img src={imagePreview || form.image_url} alt="معاينة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => { setImagePreview(''); setForm(f => ({ ...f, image_url: '' })); }}
                        style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: 20, width: 26, height: 26, cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                    </div>
                  )}
                  {imageUploading && (
                    <div style={{ background: `${C.teal}10`, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.teal}30` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.teal, marginBottom: 6 }}>
                        <span>جاري رفع الصورة...</span><span>{imageProgress}%</span>
                      </div>
                      <div style={{ height: 4, background: `${C.teal}20`, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${imageProgress}%`, background: C.teal, borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${C.teal}08`, border: `1.5px dashed ${C.teal}60`, borderRadius: 10, cursor: 'pointer', fontSize: '0.88rem', color: C.teal }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
                    <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                    <span>{imageUploading ? 'جاري الرفع...' : 'اختر صورة من الجهاز'}</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: `${C.teal}20` }}/>
                    <span style={{ fontSize: '0.82rem', color: '#999' }}>أو</span>
                    <div style={{ flex: 1, height: 1, background: `${C.teal}20` }}/>
                  </div>
                  <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="الصق رابط صورة https://..." style={fStyle} />
                </div>
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
                <F label={form.target_type === 'country' ? 'كود الدولة (ISO)' : 'اسم المدينة'}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* زر اكتشاف الموقع */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={fetchDetectedLocation}
                        disabled={locationLoading}
                        style={{
                          padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${C.teal}`,
                          background: locationLoading ? `${C.teal}10` : `${C.teal}15`,
                          color: C.teal, cursor: locationLoading ? 'default' : 'pointer',
                          fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
                        }}
                      >
                        {locationLoading ? '⏳ جاري الاكتشاف...' : '📍 اكتشاف موقعك'}
                      </button>
                      {detectedLocation && (
                        <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {detectedLocation.country && (
                            <button
                              type="button"
                              onClick={() => form.target_type === 'country'
                                ? setForm(f => ({ ...f, target_value: detectedLocation.country! }))
                                : setForm(f => ({ ...f, target_value: detectedLocation.city || '' }))
                              }
                              style={{
                                padding: '4px 12px', borderRadius: 20, border: `1px solid ${C.softGreen}`,
                                background: `${C.softGreen}15`, color: C.teal,
                                cursor: 'pointer', fontSize: '0.85rem',
                              }}
                            >
                              {form.target_type === 'country'
                                ? `✓ استخدام: ${detectedLocation.country}`
                                : detectedLocation.city
                                  ? `✓ استخدام: ${detectedLocation.city}`
                                  : `لا توجد مدينة مكتشفة`
                              }
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* معلومات الموقع المكتشف */}
                    {detectedLocation && (
                      <div style={{
                        background: `${C.teal}08`, border: `1px solid ${C.teal}30`,
                        borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: C.teal,
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>📡 الموقع المكتشف من Cloudflare:</div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: '#555' }}>
                          {detectedLocation.country && <span>🏳️ <b>كود الدولة:</b> {detectedLocation.country}</span>}
                          {detectedLocation.city && <span>🏙️ <b>المدينة:</b> {detectedLocation.city}</span>}
                          {detectedLocation.region && <span>📍 <b>المنطقة:</b> {detectedLocation.region}</span>}
                        </div>
                        <div style={{ marginTop: 6, color: '#888', fontSize: '0.83rem' }}>
                          ℹ️ يُستخدم هذا الكود للمطابقة مع موقع الزوار عند عرض الإعلانات
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      value={form.target_value}
                      onChange={e => setForm({ ...form, target_value: e.target.value })}
                      placeholder={form.target_type === 'country' ? 'مثال: SA أو EG أو AE (كود ISO)' : 'مثال: Riyadh أو Cairo'}
                      style={fStyle}
                    />
                    <div style={{ fontSize: '0.83rem', color: '#999' }}>
                      {form.target_type === 'country'
                        ? '⚠️ أدخل كود الدولة بالإنجليزية (ISO): SA، EG، AE، IQ...'
                        : '⚠️ أدخل اسم المدينة بالإنجليزية كما تُعرّفه Cloudflare'}
                    </div>
                  </div>
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
