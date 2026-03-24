'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchInstitutions, API_BASE } from '@/lib/api';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);

  // نموذج التسجيل
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    name_ar: '',
    role: 'explorer',
    institution_id: '',
    phone: '',
  });

  // جلب قائمة المؤسسات للموظفين
  useEffect(() => {
    if (formData.role === 'employee' || formData.role === 'institution_admin') {
      fetchInstitutions().then(data => {
        setInstitutions(data);
      }).catch(err => {
        console.error('Error fetching institutions:', err);
      });
    }
  }, [formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من تطابق كلمات المرور
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          name_ar: formData.name_ar || undefined,
          role: formData.role,
          institution_id: formData.institution_id ? parseInt(formData.institution_id) : undefined,
          phone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // تسجيل الدخول تلقائياً
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const loginData = await loginResponse.json();
        if (loginData.success) {
          localStorage.setItem('user', JSON.stringify(loginData.user));
          localStorage.setItem('sessionId', loginData.sessionId);
          router.push('/');
        } else {
          router.push('/login');
        }
      } else {
        setError(data.error || 'فشل إنشاء الحساب');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // Shared input style
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: `2px solid ${COLORS.teal}40`, borderRadius: 12,
    fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s',
    color: COLORS.darkNavy, background: 'white',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 7,
    color: COLORS.darkNavy, fontWeight: 600, fontSize: '0.92rem',
  };

  return (
    <div className="auth-wrapper" style={{
      background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal} 100%)`,
      direction: 'rtl', paddingTop: '30px', paddingBottom: '30px',
    }}>
      <div className="auth-card" style={{ maxWidth: 560 }}>
        {/* الشعار */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 36px)' }}>
          <div style={{
            width: 68, height: 68,
            background: `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen})`,
            borderRadius: '50%', margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.7rem', color: COLORS.darkNavy,
            boxShadow: `0 8px 24px ${COLORS.teal}40`,
          }}>
            ✦
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: COLORS.darkNavy, margin: 0, fontWeight: 800 }}>
            إنشاء حساب جديد
          </h1>
        </div>

        {/* مؤشر الخطوات */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
          {[1, 2].map((s, idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: step >= s ? `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})` : `${COLORS.teal}18`,
                color: step >= s ? 'white' : COLORS.teal,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.95rem',
                boxShadow: step >= s ? `0 4px 12px ${COLORS.teal}50` : 'none',
                transition: 'all 0.3s',
              }}>
                {s}
              </div>
              {idx < 1 && (
                <div style={{ width: 48, height: 2, background: step >= 2 ? COLORS.teal : `${COLORS.teal}20` }} />
              )}
            </div>
          ))}
        </div>

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

          {/* الخطوة 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>الاسم بالعربية *</label>
                <input type="text" name="name_ar" value={formData.name_ar} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>الاسم بالإنجليزية *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>البريد الإلكتروني *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>رقم الهاتف</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
              </div>
              <button type="button" onClick={() => setStep(2)} style={{
                width: '100%', padding: '13px',
                background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
                color: 'white', border: 'none', borderRadius: 40,
                fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: `0 6px 20px ${COLORS.teal}50`, marginTop: 6,
              }}>
                التالي ←
              </button>
            </div>
          )}

          {/* الخطوة 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>نوع الحساب *</label>
                <select name="role" value={formData.role} onChange={handleChange} required style={inputStyle}>
                  <option value="explorer">مستكشف — متصفح عادي</option>
                  <option value="employee">موظف في مؤسسة</option>
                  <option value="institution_admin">مسؤول مؤسسة</option>
                </select>
              </div>

              {(formData.role === 'employee' || formData.role === 'institution_admin') && (
                <div>
                  <label style={labelStyle}>المؤسسة *</label>
                  <select name="institution_id" value={formData.institution_id} onChange={handleChange} required style={inputStyle}>
                    <option value="">-- اختر مؤسسة --</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name_ar || inst.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>كلمة المرور *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>تأكيد كلمة المرور *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: 1, padding: '13px', background: 'transparent',
                  color: COLORS.teal, border: `2px solid ${COLORS.teal}`,
                  borderRadius: 40, fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  ← السابق
                </button>
                <button type="submit" disabled={loading} style={{
                  flex: 2, padding: '13px',
                  background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
                  color: 'white', border: 'none', borderRadius: 40,
                  fontSize: '1rem', fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.75 : 1,
                  boxShadow: `0 6px 20px ${COLORS.teal}50`,
                }}>
                  {loading ? 'جاري الإنشاء...' : 'إنشاء حساب ✓'}
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/login" style={{ color: COLORS.teal, textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem' }}>
              لديك حساب؟ سجل دخولك
            </Link>
            <Link href="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.82rem' }}>
              ← العودة للرئيسية
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}