'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setSent(true);
      } else {
        setError('حدث خطأ، يرجى المحاولة لاحقاً.');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم، يرجى المحاولة لاحقاً.');
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
          radial-gradient(2px 2px at 92% 35%, rgba(79,195,247,0.5) 0%, transparent 100%),
          radial-gradient(2px 2px at 18% 90%, rgba(124,77,255,0.4) 0%, transparent 100%)
        `,
      }} />

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
        {/* شعار */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 68, height: 68,
            background: 'linear-gradient(135deg, #EDF7BD, #85C79A, #4E8D9C)',
            borderRadius: '50%',
            margin: '0 auto 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.7rem',
            boxShadow: '0 0 28px rgba(78,141,156,0.5)',
          }}>
            🔑
          </div>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px',
            background: 'linear-gradient(90deg, #7dd8ff, #e8f4fd, #b48fff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            نسيت كلمة المرور؟
          </h1>
          <p style={{ color: 'rgba(140,165,195,0.8)', fontSize: '0.9rem', margin: 0 }}>
            أدخل بريدك الإلكتروني وسنرسل لك رابط الاسترداد
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📧</div>
            <h2 style={{ color: '#EDF7BD', fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>
              تم الإرسال!
            </h2>
            <p style={{ color: 'rgba(200,220,240,0.75)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 28 }}>
              إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور خلال دقائق.
            </p>
            <p style={{ color: 'rgba(140,165,195,0.55)', fontSize: '0.82rem', marginBottom: 28 }}>
              لم تصلك رسالة؟ تحقق من مجلد البريد غير المرغوب (Spam).
            </p>
            <Link href="/login" style={{
              display: 'block',
              textAlign: 'center',
              padding: '13px',
              background: 'linear-gradient(135deg, #4fc3f7 0%, #7c4dff 100%)',
              borderRadius: 14,
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.97rem',
              textDecoration: 'none',
            }}>
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{
                background: 'rgba(255,80,80,0.1)',
                border: '1px solid rgba(255,80,80,0.35)',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#ff9090',
                fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: '0.88rem', fontWeight: 700,
                color: 'rgba(200,220,240,0.85)',
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

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
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
                boxShadow: loading ? 'none' : '0 4px 22px rgba(79,195,247,0.35)',
              }}
            >
              {loading ? 'جاري الإرسال…' : 'إرسال رابط الاسترداد'}
            </button>

            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: 18,
              textAlign: 'center',
            }}>
              <Link href="/login" style={{
                color: 'rgba(140,165,195,0.7)',
                textDecoration: 'none',
                fontSize: '0.88rem',
              }}>
                ← العودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
