'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('رابط إعادة التعيين غير صالح. يرجى طلب رابط جديد.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await resetPassword(token, newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(res.error || 'رابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.');
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
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.55) 0%, transparent 100%),
          radial-gradient(1px 1px at 72% 14%, rgba(255,255,255,0.4) 0%, transparent 100%),
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
            {success ? '✅' : '🔒'}
          </div>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px',
            background: 'linear-gradient(90deg, #7dd8ff, #e8f4fd, #b48fff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {success ? 'تم بنجاح! 🎉' : 'كلمة مرور جديدة'}
          </h1>
          <p style={{ color: 'rgba(140,165,195,0.8)', fontSize: '0.9rem', margin: 0 }}>
            {success ? 'سيتم توجيهك لصفحة تسجيل الدخول...' : 'أدخل كلمة المرور الجديدة'}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(200,220,240,0.75)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 24 }}>
              تم إعادة تعيين كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
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
              تسجيل الدخول الآن
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
                كلمة المرور الجديدة
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8 أحرف على الأقل"
                  disabled={!token}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '13px 16px 13px 42px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(79,195,247,0.2)',
                    borderRadius: 12,
                    color: '#e8f4fd',
                    fontSize: '0.97rem',
                    outline: 'none',
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
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', top: '50%', left: 12,
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'rgba(79,195,247,0.5)',
                    cursor: 'pointer', fontSize: '0.85rem', padding: '4px',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block', marginBottom: 8,
                fontSize: '0.88rem', fontWeight: 700,
                color: 'rgba(200,220,240,0.85)',
              }}>
                تأكيد كلمة المرور
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="أعد كتابة كلمة المرور"
                disabled={!token}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${confirmPassword && confirmPassword !== newPassword ? 'rgba(255,80,80,0.5)' : 'rgba(79,195,247,0.2)'}`,
                  borderRadius: 12,
                  color: '#e8f4fd',
                  fontSize: '0.97rem',
                  outline: 'none',
                  direction: 'ltr',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(79,195,247,0.65)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.12)';
                }}
                onBlur={e => {
                  const match = !confirmPassword || confirmPassword === newPassword;
                  e.currentTarget.style.borderColor = match ? 'rgba(79,195,247,0.2)' : 'rgba(255,80,80,0.5)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                marginTop: 4,
                width: '100%',
                padding: '14px',
                background: (loading || !token)
                  ? 'rgba(79,195,247,0.25)'
                  : 'linear-gradient(135deg, #4fc3f7 0%, #7c4dff 100%)',
                border: 'none',
                borderRadius: 14,
                color: '#fff',
                fontSize: '1.02rem',
                fontWeight: 800,
                cursor: (loading || !token) ? 'not-allowed' : 'pointer',
                boxShadow: (loading || !token) ? 'none' : '0 4px 22px rgba(79,195,247,0.35)',
              }}
            >
              {loading ? 'جاري الحفظ…' : 'حفظ كلمة المرور الجديدة'}
            </button>

            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: 18,
              textAlign: 'center',
            }}>
              <Link href="/forgot-password" style={{
                color: 'rgba(140,165,195,0.7)',
                textDecoration: 'none',
                fontSize: '0.88rem',
              }}>
                طلب رابط جديد
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
