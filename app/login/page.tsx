'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('sessionId', data.sessionId);

        switch (data.user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'institution_admin':
          case 'employee':
            router.push(`/institutions/${data.user.institution_id}`);
            break;
          default:
            router.push('/');
        }
      } else {
        setError(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 30% 20%, #0f1f4a 0%, #08091e 60%, #000010 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      direction: 'rtl',
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* خلفية نجوم */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.55) 0%, transparent 100%),
          radial-gradient(1px 1px at 72% 14%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 42% 68%, rgba(255,255,255,0.45) 0%, transparent 100%),
          radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.35) 0%, transparent 100%),
          radial-gradient(1px 1px at 5% 80%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 60% 88%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 30% 50%, rgba(255,255,255,0.25) 0%, transparent 100%),
          radial-gradient(2px 2px at 92% 35%, rgba(79,195,247,0.5) 0%, transparent 100%),
          radial-gradient(2px 2px at 18% 90%, rgba(124,77,255,0.4) 0%, transparent 100%)
        `,
      }} />

      {/* الكارت */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'linear-gradient(160deg, rgba(18,22,56,0.97) 0%, rgba(10,14,36,0.98) 100%)',
        borderRadius: 28,
        border: '1px solid rgba(79,195,247,0.18)',
        boxShadow: '0 0 60px rgba(79,195,247,0.08), 0 30px 80px rgba(0,0,0,0.7)',
        padding: 'clamp(32px, 6vw, 52px)',
        backdropFilter: 'blur(24px)',
        position: 'relative',
      }}>
        {/* توهج خلفي علوي */}
        <div aria-hidden style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(79,195,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── الشعار ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 68, height: 68,
            background: 'linear-gradient(135deg, #EDF7BD, #85C79A, #4E8D9C)',
            borderRadius: '50%',
            margin: '0 auto 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.7rem',
            boxShadow: '0 0 28px rgba(78,141,156,0.5), 0 8px 20px rgba(0,0,0,0.4)',
          }}>
            ✦
          </div>
          <h1 style={{
            fontSize: '1.65rem', fontWeight: 800, margin: '0 0 6px',
            background: 'linear-gradient(90deg, #7dd8ff, #e8f4fd, #b48fff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.01em',
          }}>
            المجرة الحضارية
          </h1>
          <p style={{ color: 'rgba(140,165,195,0.9)', fontSize: '0.92rem', margin: 0 }}>
            أدخل بياناتك للدخول إلى حسابك
          </p>
        </div>

        {/* ── رسالة الخطأ ── */}
        {error && (
          <div style={{
            background: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.35)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 24,
            color: '#ff9090',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
            {error}
          </div>
        )}

        {/* ── النموذج ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* البريد الإلكتروني */}
          <div>
            <label style={{
              display: 'block', marginBottom: 8,
              fontSize: '0.88rem', fontWeight: 700,
              color: 'rgba(200,220,240,0.85)',
              letterSpacing: '0.01em',
            }}>
              البريد الإلكتروني
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', top: '50%', right: 14,
                transform: 'translateY(-50%)',
                fontSize: '1rem', color: 'rgba(79,195,247,0.6)',
                pointerEvents: 'none',
              }}>
                ✉
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="example@email.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 42px 13px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1.5px solid rgba(79,195,247,0.2)',
                  borderRadius: 12,
                  color: '#e8f4fd',
                  fontSize: '0.97rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  direction: 'ltr', textAlign: 'right',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(79,195,247,0.65)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.12)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(79,195,247,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* كلمة المرور */}
          <div>
            <label style={{
              display: 'block', marginBottom: 8,
              fontSize: '0.88rem', fontWeight: 700,
              color: 'rgba(200,220,240,0.85)',
            }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', top: '50%', right: 14,
                transform: 'translateY(-50%)',
                fontSize: '1rem', color: 'rgba(79,195,247,0.6)',
                pointerEvents: 'none',
              }}>
                🔒
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 42px 13px 42px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1.5px solid rgba(79,195,247,0.2)',
                  borderRadius: 12,
                  color: '#e8f4fd',
                  fontSize: '0.97rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  direction: 'ltr',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(79,195,247,0.65)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.12)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(79,195,247,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {/* زر إظهار/إخفاء */}
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', top: '50%', left: 12,
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(79,195,247,0.5)',
                  cursor: 'pointer', fontSize: '0.85rem',
                  padding: '4px', lineHeight: 1,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(79,195,247,1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(79,195,247,0.5)')}
                title={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '14px',
              background: loading
                ? 'rgba(79,195,247,0.25)'
                : 'linear-gradient(135deg, #4fc3f7 0%, #7c4dff 100%)',
              border: 'none',
              borderRadius: 14,
              color: '#fff',
              fontSize: '1.02rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
              boxShadow: loading ? 'none' : '0 4px 22px rgba(79,195,247,0.35)',
              transition: 'all 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 30px rgba(79,195,247,0.5)';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 22px rgba(79,195,247,0.35)';
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                جاري تسجيل الدخول…
              </>
            ) : (
              <>✦ تسجيل الدخول</>
            )}
          </button>

          {/* روابط أسفل */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingTop: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
            textAlign: 'center',
          }}>
            <Link
              href="/register"
              style={{
                color: '#7dd8ff',
                textDecoration: 'none',
                fontSize: '0.92rem',
                fontWeight: 700,
                transition: 'color 0.2s',
              }}
            >
              ليس لديك حساب؟{' '}
              <span style={{ color: '#b48fff' }}>سجّل الآن ←</span>
            </Link>
            <Link
              href="/forgot-password"
              style={{
                color: 'rgba(140,165,195,0.7)',
                textDecoration: 'none',
                fontSize: '0.88rem',
                transition: 'color 0.2s',
              }}
            >
              نسيت كلمة المرور؟
            </Link>
            <Link
              href="/"
              style={{
                color: 'rgba(140,165,195,0.6)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.2s',
              }}
            >
              ← العودة للرئيسية
            </Link>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(138,164,188,0.5) !important; }
      `}</style>
    </div>
  );
}