'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    const response = await fetch('/api/auth/login', {
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
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      direction: 'rtl',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 30,
        padding: '50px',
        width: '100%',
        maxWidth: 450,
        boxShadow: `0 20px 40px ${COLORS.darkNavy}60`,
      }}>
        {/* الشعار */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 80,
            height: 80,
            background: `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen})`,
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: COLORS.darkNavy,
          }}>
            ✦
          </div>
          <h1 style={{
            fontSize: '2rem',
            color: COLORS.darkNavy,
            margin: 0,
          }}>
            المجرة الحضارية
          </h1>
          <p style={{ color: COLORS.teal, marginTop: 10 }}>
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#ff505020',
              border: '1px solid #ff5050',
              borderRadius: 10,
              padding: '12px',
              marginBottom: 20,
              color: '#ff5050',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              color: COLORS.darkNavy,
              fontWeight: 600,
            }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${COLORS.teal}40`,
                borderRadius: 12,
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = COLORS.teal}
              onBlur={e => e.currentTarget.style.borderColor = `${COLORS.teal}40`}
            />
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              color: COLORS.darkNavy,
              fontWeight: 600,
            }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${COLORS.teal}40`,
                borderRadius: 12,
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = COLORS.teal}
              onBlur={e => e.currentTarget.style.borderColor = `${COLORS.teal}40`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: COLORS.teal,
              color: 'white',
              border: 'none',
              borderRadius: 40,
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s',
              marginBottom: 20,
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.background = COLORS.darkNavy;
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.background = COLORS.teal;
            }}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link href="/register" style={{
              color: COLORS.teal,
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              ليس لديك حساب؟ سجل الآن
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}