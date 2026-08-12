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

         {/* ── فصل ── */}
         <div style={{
           display: 'flex', alignItems: 'center', gap: 14,
           marginBottom: 20,
         }}>
           <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
           <span style={{ color: 'rgba(140,165,195,0.5)', fontSize: '0.82rem', fontWeight: 600 }}>أو</span>
           <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
         </div>

         {/* زر Google */}
         <button
           type="button"
           onClick={() => {
              window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=489531170664-o83f2l22il51i77i1sqjnm62iiid2pl6.apps.googleusercontent.com&redirect_uri=https://hadmaj.com/api/auth/google&response_type=id_token&scope=profile+email';
           }}
           style={{
             width: '100%',
             padding: '13px',
             background: 'rgba(255,255,255,0.95)',
             border: 'none',
             borderRadius: 14,
             color: '#3c4043',
             fontSize: '0.97rem',
             fontWeight: 700,
             cursor: 'pointer',
             display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
             transition: 'all 0.2s',
             boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
             marginBottom: 20,
           }}
           onMouseEnter={e => {
             (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
             (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.35)';
           }}
           onMouseLeave={e => {
             (e.currentTarget as HTMLButtonElement).style.transform = 'none';
             (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
           }}
         >
           <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
           </svg>
           تسجيل الدخول بحساب Google
         </button>

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