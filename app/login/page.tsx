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
            <div className="alert alert-error" style={{ marginBottom: 22 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label style={{ color: COLORS.darkNavy }}>البريد الإلكتروني</label>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ color: COLORS.darkNavy }}>كلمة المرور</label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1.05rem', marginBottom: 20, borderRadius: 14 }}
          >
            {loading ? '⏳ جاري تسجيل الدخول...' : '✦ تسجيل الدخول'}
          </button>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/register" style={{ color: COLORS.teal, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
              ليس لديك حساب؟ سجل الآن ←
            </Link>
            <Link href="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.88rem' }}>
              العودة للرئيسية
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}