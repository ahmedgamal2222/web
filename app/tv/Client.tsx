'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { screenConnect } from '@/lib/api';

// ── ثوابت البصريات ────────────────────────────────────────────
const TEAL  = '#4E8D9C';
const MINT  = '#EDF7BD';
const NAVY  = '#281C59';
const GOLD  = '#f5c842';
const BG    = '#0a0618';

// مفتاح sessionStorage لتخطي إعادة المصادقة في صفحة الشاشة
export const TV_PREAUTH_KEY = (id: number) => `hadmaj_tv_preauth_${id}`;
export const TV_PREAUTH_TTL = 8 * 60 * 1000; // 8 دقائق

export default function TVClient() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [stars, setStars]       = useState<{ x: number; y: number; r: number; o: number }[]>([]);

  // نجوم عشوائية للخلفية (client-only)
  useEffect(() => {
    setStars(
      Array.from({ length: 80 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.5 + 0.3,
        o: Math.random() * 0.6 + 0.2,
      }))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const result = await screenConnect(password);

      if (result.valid && result.institution_id) {
        // حفظ مؤقت في sessionStorage لتخطي كلمة المرور في صفحة الشاشة
        sessionStorage.setItem(
          TV_PREAUTH_KEY(result.institution_id),
          JSON.stringify({ verified: true, ts: Date.now() })
        );
        // الانتقال لصفحة الشاشة
        router.push(`/screen/${result.institution_id}/`);
      } else {
        setError(result.message || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال. تحقق من الإنترنت وأعد المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      direction: 'rtl', fontFamily: 'Tajawal, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* نجوم الخلفية */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {stars.map((s, i) => (
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o} />
        ))}
      </svg>

      {/* توهج خلفي */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500,
        background: `radial-gradient(circle, ${TEAL}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* بطاقة الدخول */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1650 0%, #0e0c2e 100%)',
        border: `1.5px solid rgba(78,141,156,0.3)`,
        borderRadius: 28,
        padding: 'clamp(32px,5vw,52px) clamp(28px,5vw,52px)',
        width: '100%', maxWidth: 420,
        boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
        position: 'relative', zIndex: 1,
      }}>
        {/* شعار */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>📺</div>
          <h1 style={{
            margin: '0 0 6px',
            background: `linear-gradient(135deg, ${MINT}, ${TEAL}, #c9b7ff)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900, letterSpacing: 1,
          }}>
            شاشة المجرة الحضارية
          </h1>
          <p style={{ color: '#6e6a99', margin: 0, fontSize: '0.88rem' }}>
            أدخل كلمة مرور الشاشة للمتابعة
          </p>
        </div>

        {/* نموذج كلمة المرور */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: 'block', color: '#8888aa', fontSize: '0.82rem',
              marginBottom: 7, fontWeight: 600,
            }}>
              🔑 كلمة مرور الشاشة
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              disabled={loading}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '13px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${error ? '#f87171' : 'rgba(78,141,156,0.3)'}`,
                borderRadius: 14, outline: 'none',
                color: '#e0dcff', fontSize: '1rem',
                fontFamily: 'Tajawal, sans-serif',
                transition: 'border-color 0.2s',
                direction: 'ltr', textAlign: 'center', letterSpacing: 4,
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.35)',
              borderRadius: 10, padding: '10px 14px',
              color: '#fca5a5', fontSize: '0.85rem',
              marginBottom: 16, textAlign: 'center',
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              width: '100%',
              padding: '14px 0',
              background: loading || !password.trim()
                ? 'rgba(78,141,156,0.3)'
                : `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
              border: 'none', borderRadius: 16,
              cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
              color: '#fff', fontFamily: 'Tajawal, sans-serif',
              fontWeight: 800, fontSize: '1.05rem',
              letterSpacing: 0.5,
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{
                  width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
                جارٍ التحقق…
              </span>
            ) : '🚀 دخول الشاشة'}
          </button>
        </form>

        {/* خط سفلي */}
        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid rgba(78,141,156,0.15)',
          textAlign: 'center',
        }}>
          <div style={{ color: '#6e6a99', fontSize: '0.75rem' }}>
            tv.hadmaj.com
          </div>
          <div style={{
            marginTop: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: TEAL,
              display: 'inline-block',
              animation: 'blink 2s ease-in-out infinite',
            }} />
            <span style={{ color: '#4E8D9C', fontSize: '0.72rem', fontWeight: 600 }}>
              متصل بشبكة المجرة
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        input:focus {
          border-color: ${TEAL} !important;
          box-shadow: 0 0 0 3px rgba(78,141,156,0.15);
        }
      `}</style>
    </div>
  );
}
