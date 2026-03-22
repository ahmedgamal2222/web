'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  darkCard: '#1e1650',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const EVENT_TYPE_LABELS: Record<string, string> = {
  lecture: '🎤 محاضرة',
  conference: '🏛️ مؤتمر',
  workshop: '🛠️ ورشة عمل',
  seminar: '📚 ندوة',
  course: '🎓 دورة تدريبية',
};

// ─── Ad Modal (same as news page) ─────────────────────────────────────────────
function AdModal({ institutionId, coins, onClose, onSuccess }: {
  institutionId: number; coins: number; onClose: () => void; onSuccess: () => void;
}) {
  const AD_COST = 20;
  const [form, setForm] = useState({ title: '', content: '', image_url: '', start_date: '', end_date: '', target_type: 'all' as 'all' | 'country' | 'city', target_value: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const canAfford = coins >= AD_COST;

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.title || !form.start_date || !form.end_date) { setErr('يرجى ملء الحقول المطلوبة'); return; }
    setSubmitting(true); setErr('');
    try {
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify({ ...form, institution_id: institutionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل إنشاء الإعلان');
      onSuccess();
    } catch (e: any) { setErr(e.message); } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, direction: 'rtl' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: COLORS.darkCard, borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, color: 'white', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: COLORS.lightMint }}>📢 إنشاء إعلان جديد</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>رصيدك الحالي</span>
          <span style={{ color: coins >= AD_COST ? COLORS.softGreen : '#ff6b6b', fontWeight: 700, fontSize: '1rem' }}>{coins} كوين</span>
        </div>
        {!canAfford ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#ff8080', marginBottom: 20 }}>رصيدك غير كافٍ ({coins} / {AD_COST} كوين مطلوب)</p>
            <a href="https://paypal.me/hadmaj?amount=30" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', background: '#0070ba', color: 'white', padding: '12px 28px', borderRadius: 30, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
              💳 تجديد الاشتراك — 30$ شهرياً عبر PayPal
            </a>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>بعد الدفع سيتم إضافة 500 كوين لحسابك خلال 24 ساعة</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {err && <div style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid #ff5050', borderRadius: 8, padding: '10px 14px', color: '#ff8080', fontSize: '0.85rem' }}>{err}</div>}
            <AdField label="عنوان الإعلان *"><input type="text" value={form.title} onChange={set('title')} required placeholder="اكتب عنوان الإعلان" style={iStyle} /></AdField>
            <AdField label="نص الإعلان"><textarea value={form.content} onChange={set('content')} placeholder="تفاصيل الإعلان..." rows={3} style={{ ...iStyle, resize: 'vertical' }} /></AdField>
            <AdField label="رابط الصورة"><input type="url" value={form.image_url} onChange={set('image_url')} placeholder="https://..." style={iStyle} /></AdField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AdField label="تاريخ البداية *"><input type="date" value={form.start_date} onChange={set('start_date')} required style={iStyle} /></AdField>
              <AdField label="تاريخ النهاية *"><input type="date" value={form.end_date} onChange={set('end_date')} required style={iStyle} /></AdField>
            </div>
            <AdField label="نطاق الاستهداف">
              <select value={form.target_type} onChange={set('target_type')} style={iStyle}>
                <option value="all">🌍 الكل</option>
                <option value="country">🏳️ دولة محددة</option>
                <option value="city">🏙️ مدينة محددة</option>
              </select>
            </AdField>
            {form.target_type !== 'all' && (
              <AdField label={form.target_type === 'country' ? 'اسم الدولة' : 'اسم المدينة'}>
                <input type="text" value={form.target_value} onChange={set('target_value')} placeholder={form.target_type === 'country' ? 'مثال: Saudi Arabia' : 'مثال: Riyadh'} style={iStyle} />
              </AdField>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,215,0,0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,215,0,0.2)' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>تكلفة الإعلان</span>
              <span style={{ color: '#FFD700', fontWeight: 700 }}>{AD_COST} كوين → يتبقى {coins - AD_COST} كوين</span>
            </div>
            <button type="submit" disabled={submitting} style={{ padding: '13px', background: submitting ? COLORS.teal + '80' : COLORS.teal, color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: submitting ? 'default' : 'pointer' }}>
              {submitting ? 'جاري الإنشاء...' : `✦ نشر الإعلان (${AD_COST} كوين)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AdField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.82rem', color: COLORS.softGreen, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

const iStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 9, color: 'white', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
};

// ─── Status helpers ────────────────────────────────────────────────────────────
function getEventStatus(start: string, end?: string) {
  const now = new Date();
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  if (now < s) return { label: '⏳ قادم', color: COLORS.teal };
  if (e && now <= e) return { label: '🔴 جاري الآن', color: COLORS.softGreen };
  return { label: '✅ منتهي', color: '#9E9E9E' };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const id = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
    : 'default';
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [coins, setCoins] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adSuccess, setAdSuccess] = useState(false);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setCoins(u.coins ?? 500);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/api/events/${id}`, {
      headers: { 'X-Session-ID': typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '' },
    })
      .then(r => r.json())
      .then(d => {
        const ev = d.data ?? d;
        setItem(ev);
        if (ev?.institution_id) {
          fetch(`${API_BASE}/api/events?institution_id=${ev.institution_id}&limit=4`)
            .then(r => r.json())
            .then(rd => setRelated((rd.data || []).filter((e: any) => String(e.id) !== String(id)).slice(0, 3)));
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdSuccess = () => {
    setShowAdModal(false);
    setAdSuccess(true);
    setCoins(c => c - 20);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      u.coins = (u.coins ?? 500) - 20;
      localStorage.setItem('user', JSON.stringify(u));
    }
    setTimeout(() => setAdSuccess(false), 4000);
  };

  const canManage = user?.role === 'admin' || (user?.institution_id && item && user.institution_id === item.institution_id);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: COLORS.darkNavy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>جاري التحميل...</div>
  );

  if (!item) return (
    <div style={{ minHeight: '100vh', background: COLORS.darkNavy, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 16 }}>
      <span style={{ fontSize: '3rem' }}>📭</span>
      <p>الفعالية غير موجودة</p>
      <Link href="/news" style={{ color: COLORS.softGreen }}>← العودة للأخبار والفعاليات</Link>
    </div>
  );

  const status = getEventStatus(item.start_datetime, item.end_datetime);
  const fmt = (d: string) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: COLORS.darkNavy, color: 'white', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>

      {/* Hero banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal}80 100%)`,
        padding: '60px 20px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, background: 'radial-gradient(circle at 30% 50%, white 0%, transparent 60%)' }} />
        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 18px', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
              ← رجوع
            </button>
            {canManage && (
              <button onClick={() => setShowAdModal(true)} style={{ background: COLORS.teal, border: 'none', borderRadius: 10, padding: '8px 20px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                📢 إنشاء إعلان
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 8px', fontSize: '0.75rem' }}>{coins} كوين</span>
              </button>
            )}
          </div>

          {adSuccess && (
            <div style={{ background: 'rgba(133,199,154,0.15)', border: '1px solid #85C79A', borderRadius: 10, padding: '12px 16px', marginBottom: 24, color: COLORS.softGreen }}>
              ✓ تم نشر الإعلان بنجاح! سيظهر على الشاشات الحضارية قريباً.
            </div>
          )}

          {/* Status + type */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: status.color + '25', color: status.color, border: `1px solid ${status.color}50`, padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
              {status.label}
            </span>
            {item.type && (
              <span style={{ background: 'rgba(255,255,255,0.08)', color: COLORS.lightMint, padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem' }}>
                {EVENT_TYPE_LABELS[item.type] || item.type}
              </span>
            )}
            {item.is_online && (
              <span style={{ background: 'rgba(78,141,156,0.2)', color: COLORS.softGreen, border: `1px solid ${COLORS.teal}`, padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem' }}>
                🌐 عبر الإنترنت
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.4, margin: '0 0 20px', color: COLORS.lightMint }}>
            {item.title}
          </h1>

          {/* Date + location row */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              📅 {fmt(item.start_datetime)}
              {item.end_datetime && ` — ${fmt(item.end_datetime)}`}
            </span>
            {item.location && (
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                📍 {item.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}>

        {/* Institution */}
        {(item.institution_name_ar || item.institution_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {(item.institution_name_ar || item.institution_name).charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.institution_name_ar || item.institution_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>المؤسسة المنظِّمة</div>
            </div>
          </div>
        )}

        {/* Online link */}
        {item.is_online && item.online_url && (
          <div style={{ background: 'rgba(78,141,156,0.1)', border: `1px solid ${COLORS.teal}50`, borderRadius: 14, padding: '18px 20px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4, color: COLORS.lightMint }}>🌐 رابط الفعالية الإلكترونية</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>انضم عبر الرابط أدناه</div>
            </div>
            <a href={item.online_url} target="_blank" rel="noopener noreferrer"
              style={{ background: COLORS.teal, color: 'white', padding: '10px 24px', borderRadius: 30, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              انضم الآن ←
            </a>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', marginBottom: 48 }}>
            {item.description}
          </div>
        )}

        {/* Related events */}
        {related.length > 0 && (
          <div>
            <h3 style={{ color: COLORS.lightMint, marginBottom: 20, fontSize: '1.2rem' }}>📅 فعاليات ذات صلة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {related.map((e: any) => {
                const s = getEventStatus(e.start_datetime, e.end_datetime);
                return (
                  <Link key={e.id} href={`/events/${e.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: COLORS.darkCard, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s' }}
                      onMouseEnter={ev => (ev.currentTarget.style.transform = 'translateY(-3px)')}
                      onMouseLeave={ev => (ev.currentTarget.style.transform = 'none')}>
                      <div style={{ background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`, padding: '12px', textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{new Date(e.start_datetime).toLocaleDateString('ar-EG', { day: 'numeric' })}</div>
                        <div style={{ fontSize: '0.8rem' }}>{new Date(e.start_datetime).toLocaleDateString('ar-EG', { month: 'long' })}</div>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.72rem', color: s.color, marginBottom: 6, display: 'block' }}>{s.label}</span>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: COLORS.lightMint, fontWeight: 600, lineHeight: 1.4 }}>
                          {e.title.length > 70 ? e.title.slice(0, 70) + '...' : e.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAdModal && (
        <AdModal institutionId={item.institution_id} coins={coins} onClose={() => setShowAdModal(false)} onSuccess={handleAdSuccess} />
      )}
    </div>
  );
}
