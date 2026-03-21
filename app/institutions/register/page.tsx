'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchInstitutions } from '@/lib/api';

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
      const response = await fetch('/api/auth/register', {
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
        const loginResponse = await fetch('/api/auth/login', {
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
        maxWidth: 600,
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
            إنشاء حساب جديد
          </h1>
        </div>

        {/* مؤشر الخطوات */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 30,
        }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: step >= s ? COLORS.teal : `${COLORS.teal}20`,
                color: step >= s ? 'white' : COLORS.teal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              {s}
            </div>
          ))}
        </div>

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

          {/* الخطوة 1: المعلومات الأساسية */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  الاسم (بالعربية) *
                </label>
                <input
                  type="text"
                  name="name_ar"
                  value={formData.name_ar}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: 12,
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  الاسم (بالإنجليزية) *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: 12,
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: 12,
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: 12,
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: COLORS.teal,
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.darkNavy}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.teal}
              >
                التالي
              </button>
            </div>
          )}

          {/* الخطوة 2: كلمة المرور ونوع الحساب */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  نوع الحساب *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: 12,
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                  }}
                >
                  <option value="explorer">مستكشف - متصفح عادي</option>
                  <option value="employee">موظف في مؤسسة</option>
                  <option value="institution_admin">مسؤول مؤسسة</option>
                </select>
              </div>

              {(formData.role === 'employee' || formData.role === 'institution_admin') && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    color: COLORS.darkNavy,
                    fontWeight: 600,
                  }}>
                    اختر المؤسسة *
                  </label>
                  <select
                    name="institution_id"
                    value={formData.institution_id}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${COLORS.teal}40`,
                      borderRadius: 12,
                      fontSize: '1rem',
                      outline: 'none',
                      background: 'white',
                    }}
                  >
                    <option value="">-- اختر مؤسسة --</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name_ar || inst.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: 12,
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 30 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  تأكيد كلمة المرور *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: 12,
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'transparent',
                    color: COLORS.teal,
                    border: `2px solid ${COLORS.teal}`,
                    borderRadius: 40,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = COLORS.teal;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = COLORS.teal;
                  }}
                >
                  السابق
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
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
                  }}
                  onMouseEnter={e => {
                    if (!loading) e.currentTarget.style.background = COLORS.darkNavy;
                  }}
                  onMouseLeave={e => {
                    if (!loading) e.currentTarget.style.background = COLORS.teal;
                  }}
                >
                  {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/login" style={{
              color: COLORS.teal,
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              لديك حساب بالفعل؟ سجل دخولك
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}