'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // ✅ تخزين بيانات المستخدم
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('sessionId', data.sessionId);
      
      console.log('✅ تم تسجيل الدخول بنجاح، sessionId:', data.sessionId);
      
      // التحقق من التخزين
      console.log('📦 localStorage بعد التسجيل:', {
        user: localStorage.getItem('user'),
        sessionId: localStorage.getItem('sessionId')
      });

      // توجيه المستخدم حسب دوره
      switch(data.user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'institution_admin':
          router.push(`/institutions/${data.user.institution_id}`);
          break;
        case 'employee':
          router.push(`/institutions/${data.user.institution_id}`);
          break;
        default:
          router.push('/');
      }
    } else {
      setError(data.error || 'خطأ في تسجيل الدخول');
    }
  } catch (err: any) {
    setError(err.message || 'حدث خطأ في الاتصال');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-wrapper" style={{
      background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal} 100%)`,
      direction: 'rtl',
    }}>
      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* الشعار */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 5vw, 40px)' }}>
          <div style={{
            width: 72, height: 72,
            background: `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen})`,
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', color: COLORS.darkNavy,
            boxShadow: `0 8px 24px ${COLORS.teal}40`,
          }}>
            ✦
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: COLORS.darkNavy, margin: 0, fontWeight: 800 }}>
            المجرة الحضارية
          </h1>
          <p style={{ color: COLORS.teal, marginTop: 8, fontSize: '0.95rem' }}>
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#ff505015', border: '1px solid #ff5050',
              borderRadius: 10, padding: '12px', marginBottom: 20,
              color: '#ff5050', textAlign: 'center', fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 7, color: COLORS.darkNavy, fontWeight: 600, fontSize: '0.92rem' }}>
              البريد الإلكتروني
            </label>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px',
                border: `2px solid ${COLORS.teal}40`, borderRadius: 12,
                fontSize: '1rem', outline: 'none', transition: 'all 0.3s',
                color: COLORS.darkNavy,
              }}
              onFocus={e => e.currentTarget.style.borderColor = COLORS.teal}
              onBlur={e => e.currentTarget.style.borderColor = `${COLORS.teal}40`}
            />
          </div>

          <div style={{ marginBottom: 26 }}>
            <label style={{ display: 'block', marginBottom: 7, color: COLORS.darkNavy, fontWeight: 600, fontSize: '0.92rem' }}>
              كلمة المرور
            </label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px',
                border: `2px solid ${COLORS.teal}40`, borderRadius: 12,
                fontSize: '1rem', outline: 'none', transition: 'all 0.3s',
                color: COLORS.darkNavy,
              }}
              onFocus={e => e.currentTarget.style.borderColor = COLORS.teal}
              onBlur={e => e.currentTarget.style.borderColor = `${COLORS.teal}40`}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
              color: 'white', border: 'none', borderRadius: 40,
              fontSize: '1.05rem', fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.75 : 1, transition: 'all 0.3s',
              marginBottom: 18, boxShadow: `0 6px 20px ${COLORS.teal}50`,
            }}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/register" style={{ color: COLORS.teal, textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem' }}>
              ليس لديك حساب؟ سجل الآن
            </Link>
            <Link href="/" style={{ color: '#999', textDecoration: 'none', fontSize: '0.82rem' }}>
              ← العودة للرئيسية
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}