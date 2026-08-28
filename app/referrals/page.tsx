'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE, getStoredReferralCode } from '@/lib/api';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

export default function ReferralsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login?redirect=/referrals'); return; }
    setUser(JSON.parse(u));
    setAuthLoading(false);
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const sid = localStorage.getItem('sessionId') || '';
        const res = await fetch(`${API_BASE}/api/referrals/my`, {
          headers: { 'X-Session-ID': sid },
        });
        const d = await res.json();
        if (!d.success) { setError(d.error || 'تعذّر جلب بيانات الدعوة'); return; }
        setData(d);
      } catch {
        setError('تعذّر الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  const link = data?.link || `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${getStoredReferralCode()}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      alert(link);
    }
  };

  const shareUrl = encodeURIComponent(link);
  const shareText = encodeURIComponent(`📣 أدعو مؤسستك للانضمام إلى المجرة الحضارية — منصة التكامل الحضاري. سجّل الآن واستفد من مكافأة الرصيد الإعلاني!`);
  const waLink = `https://wa.me/?text=${shareText}%20${shareUrl}`;
  const mailLink = `mailto:?subject=${encodeURIComponent('انضمام إلى المجرة الحضارية')}&body=${shareText}%20${shareUrl}`;
  const xLink = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;

  if (authLoading) return loader('جاري التحميل...');
  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 30%, #0d0b2a 0%, #05041a 55%, #020210 100%)',
      color: '#eaf6ff', direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', system-ui, sans-serif",
      padding: '28px 16px 60px',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* رأس الصفحة */}
      <div style={{ maxWidth: 820, margin: '0 auto 22px' }}>
        <Link href="/" style={{ color: C.teal, textDecoration: 'none', fontSize: '0.85rem' }}>
          ← العودة للرئيسية
        </Link>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎁</div>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.7rem', color: C.lightMint, fontWeight: 800 }}>
            ادعُ المؤسسات واكسب رصيد إعلاني
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.8 }}>
            شارك رابطك الخاص، ولكل مؤسسة تنضم وتُعتمد عبر رابطك ستحصل على{' '}
            <span style={{ color: C.softGreen, fontWeight: 800 }}>{data?.reward ?? 10} رصيد إعلاني</span>{' '}
            تُضاف إلى رصيد الإعلانات الخاص بك في المجرة.
          </p>
        </div>

        {error && !data && (
          <div style={{
            background: 'rgba(255,80,80,0.09)', border: '1px solid rgba(255,80,80,0.25)',
            borderRadius: 14, padding: '16px 18px', marginBottom: 18, color: '#ff9a9a',
          }}>
            ⚠️ {error}
            {error.includes('لا تملك') && (
              <div style={{ marginTop: 12 }}>
                <Link href="/institution-request" style={{
                  display: 'inline-block', padding: '10px 22px', borderRadius: 26,
                  background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`,
                  color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
                }}>
                  🏛️ قدّم طلب اعتماد مؤسستك
                </Link>
              </div>
            )}
          </div>
        )}

        {loading && loader('جاري جلب بيانات الدعوة...')}


        {data?.code && (
          <>
            {/* بطاقة الرابط */}
            <div style={{
              background: 'rgba(19,16,58,0.7)', border: '1px solid rgba(78,141,156,0.35)',
              borderRadius: 18, padding: '22px', marginBottom: 18, boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                🔗 رابط الدعوة الخاص بك — كود: <b style={{ color: C.lightMint }}>{data.code}</b>
              </div>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'stretch',
                background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(78,141,156,0.2)',
                borderRadius: 12, padding: 8,
              }}>
                <input readOnly value={link} dir="ltr"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#bcd8e8', fontSize: '0.83rem', padding: '0 6px',
                  }}
                />
                <button onClick={copyLink} style={{
                  padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                  background: copied ? C.softGreen : `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`,
                  border: 'none', color: copied ? '#0a0f14' : '#fff', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {copied ? '✓ تم النسخ' : '📋 نسخ'}
                </button>
              </div>

              {/* أزرار المشاركة */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, justifyContent: 'center' }}>
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  style={shareBtn({ background: 'rgba(37,211,102,0.15)', color: '#5ce08a', borderColor: 'rgba(37,211,102,0.35)' })}>
                  🟢 واتساب
                </a>
                <a href={mailLink}
                  style={shareBtn({ background: 'rgba(79,195,247,0.12)', color: '#7cc9f5', borderColor: 'rgba(79,195,247,0.3)' })}>
                  📧 بريد
                </a>
                <a href={xLink} target="_blank" rel="noopener noreferrer"
                  style={shareBtn({ background: 'rgba(255,255,255,0.08)', color: '#d7e4ee', borderColor: 'rgba(255,255,255,0.18)' })}>
                  🐦 إكس
                </a>
              </div>
            </div>


            {/* الإحصاءات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
              {[
                { icon: '🏛️', label: 'مؤسسات مدعوة', value: data.invited_count ?? 0 },
                { icon: '💰', label: 'إجمالي المكافآت', value: `${data.total_reward ?? 0} رصيد` },
                { icon: '⚡', label: 'رصيد الإعلانات', value: `${data.balance ?? 0} رصيد` },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(19,16,58,0.7)', border: '1px solid rgba(78,141,156,0.25)',
                  borderRadius: 16, padding: '18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: C.lightMint, margin: '6px 0 2px' }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>{s.label}</div>
                </div>
              ))}
            </div>

{/* قائمة المؤسسات المُدعاة */}
            <div style={{
              background: 'rgba(19,16,58,0.55)', border: '1px solid rgba(78,141,156,0.2)',
              borderRadius: 18, padding: '20px', marginBottom: 18,
            }}>
              <h2 style={{ margin: '0 0 14px', fontSize: '1.1rem', color: '#eaf6ff' }}>مؤسساتك المُدعاة</h2>
              {(data.referrals || []).length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', textAlign: 'center', padding: '14px' }}>
                  لم تُعتمد أي مؤسسة عبر رابطك بعد — شارك الرابط الآن!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.referrals.map((r: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(78,141,156,0.15)',
                    }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        🏛️ <b>{r.new_institution_name || `#${r.new_institution_id}`}</b>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {new Date(r.created_at).toLocaleDateString('ar')}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                          background: 'rgba(133,199,154,0.15)', color: C.softGreen,
                        }}>
                          {r.reward} رصيد
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function shareBtn(s: { background: string; color: string; borderColor: string }) {
  return {
    padding: '10px 20px', borderRadius: 24, textDecoration: 'none', fontWeight: 700,
    fontSize: '0.85rem', border: '1px solid', transition: 'opacity 0.2s',
    background: s.background, color: s.color, borderColor: s.borderColor,
  } as React.CSSProperties;
}

function loader(text: string) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.6)', gap: 12,
    }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid rgba(78,141,156,0.3)', borderTopColor: C.teal, animation: 'spin 0.8s linear infinite' }} />
      {text}
    </div>
  );
}

