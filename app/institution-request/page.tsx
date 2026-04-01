'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

export default function InstitutionRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [screenPassword, setScreenPassword] = useState('');
  const [user, setUser] = useState<any>(null);

  // نموذج الطلب
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    name_en: '',
    type: '',
    sub_type: '',
    country: '',
    city: '',
    address: '',
    registration_number: '',
    founded_year: '',
    website: '',
    email: '',
    phone: '',
    logo_url: '',
    description: '',
    employees_count: '',
    projects_count: '',
    beneficiaries_count: '',
    screen_email: ''
  });

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/institution-request');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/institution-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        body: JSON.stringify({
          ...formData,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : undefined,
          employees_count: formData.employees_count ? parseInt(formData.employees_count) : 0,
          projects_count: formData.projects_count ? parseInt(formData.projects_count) : 0,
          beneficiaries_count: formData.beneficiaries_count ? parseInt(formData.beneficiaries_count) : 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScreenPassword(data.screen_password);
        setSuccess(true);
      } else {
        setError(data.error || 'فشل تقديم الطلب');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        جاري التحميل...
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
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
          maxWidth: 500,
          textAlign: 'center',
          boxShadow: `0 20px 40px ${COLORS.darkNavy}20`,
        }}>
          <div style={{
            width: 80,
            height: 80,
            background: COLORS.softGreen,
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: 'white',
          }}>
            ✓
          </div>
          
          <h2 style={{ color: COLORS.darkNavy, marginBottom: 20 }}>
            تم تقديم الطلب بنجاح!
          </h2>
          
          <p style={{ color: COLORS.teal, marginBottom: 30 }}>
            سيتم مراجعة طلبك من قبل الإدارة والرد عليك في أقرب وقت
          </p>

          <div style={{
            background: `${COLORS.lightMint}40`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 30,
            border: `2px dashed ${COLORS.teal}`,
          }}>
            <p style={{ color: COLORS.darkNavy, fontWeight: 600, marginBottom: 10 }}>
              كلمة مرور الشاشة (احتفظ بها):
            </p>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: COLORS.teal,
              letterSpacing: '5px',
              fontFamily: 'monospace',
            }}>
              {screenPassword}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 10 }}>
              ستستخدم هذه الكلمة لتشغيل شاشة العرض بعد الموافقة على طلبك
            </p>
          </div>

          <Link href="/" style={{
            display: 'inline-block',
            padding: '12px 30px',
            background: COLORS.teal,
            color: 'white',
            textDecoration: 'none',
            borderRadius: 40,
            fontWeight: 600,
          }}>
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* الهيدر */}
        <div className="page-hero" style={{ marginBottom: 24 }}>
          <h1>✦ طلب إنشاء مؤسسة جديدة</h1>
          <p>املأ النموذج التالي لتقديم طلب إنشاء مؤسسة جديدة في المجرة الحضارية</p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          borderRadius: 'clamp(16px, 2.5vw, 28px)',
          padding: 'clamp(20px, 4vw, 40px)',
          boxShadow: `0 10px 30px ${COLORS.darkNavy}20`,
        }}>
          {error && (
            <div style={{
              background: '#ff505020',
              border: '1px solid #ff5050',
              borderRadius: 10,
              padding: '12px',
              marginBottom: 30,
              color: '#ff5050',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* معلومات أساسية */}
          <h2 style={{
            color: COLORS.teal,
            fontSize: '1.3rem',
            marginBottom: 20,
            paddingBottom: 10,
            borderBottom: `2px solid ${COLORS.lightMint}`,
          }}>
            المعلومات الأساسية
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                الاسم (بالعربية) *
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                الاسم (بالإنجليزية) *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

        

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                نوع المؤسسة *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">-- اختر النوع --</option>
                <option value="educational">تعليمية</option>
                <option value="research">بحثية</option>
                <option value="cultural">ثقافية</option>
                <option value="charitable">خيرية</option>
                <option value="media">إعلامية</option>
                <option value="developmental">تنموية</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                النوع الفرعي
              </label>
              <input
                type="text"
                name="sub_type"
                value={formData.sub_type}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          {/* الموقع */}
          <h2 style={{
            color: COLORS.teal,
            fontSize: '1.3rem',
            marginBottom: 20,
            paddingBottom: 10,
            borderBottom: `2px solid ${COLORS.lightMint}`,
          }}>
            الموقع
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                الدولة *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                المدينة *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
              العنوان
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* معلومات الاتصال */}
          <h2 style={{
            color: COLORS.teal,
            fontSize: '1.3rem',
            marginBottom: 20,
            paddingBottom: 10,
            borderBottom: `2px solid ${COLORS.lightMint}`,
          }}>
            معلومات الاتصال
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                رقم الهاتف *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
              الموقع الإلكتروني
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* معلومات إضافية */}
          <h2 style={{
            color: COLORS.teal,
            fontSize: '1.3rem',
            marginBottom: 20,
            paddingBottom: 10,
            borderBottom: `2px solid ${COLORS.lightMint}`,
          }}>
            معلومات إضافية
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                رقم التسجيل
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                سنة التأسيس
              </label>
              <input
                type="number"
                name="founded_year"
                value={formData.founded_year}
                onChange={handleChange}
                min="1800"
                max={new Date().getFullYear()}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 30 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                عدد الموظفين
              </label>
              <input
                type="number"
                name="employees_count"
                value={formData.employees_count}
                onChange={handleChange}
                min="0"
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                عدد المشاريع
              </label>
              <input
                type="number"
                name="projects_count"
                value={formData.projects_count}
                onChange={handleChange}
                min="0"
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
                عدد المستفيدين
              </label>
              <input
                type="number"
                name="beneficiaries_count"
                value={formData.beneficiaries_count}
                onChange={handleChange}
                min="0"
                placeholder="0"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
              وصف المؤسسة
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* إعدادات الشاشة */}
          <h2 style={{
            color: COLORS.teal,
            fontSize: '1.3rem',
            marginBottom: 20,
            paddingBottom: 10,
            borderBottom: `2px solid ${COLORS.lightMint}`,
          }}>
            إعدادات الشاشة
          </h2>

          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: COLORS.darkNavy }}>
              بريد إلكتروني مخصص للشاشة (اختياري)
            </label>
            <input
              type="email"
              name="screen_email"
              value={formData.screen_email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="screen@institution.com"
            />
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 5 }}>
              إذا لم يتم الإدخال، سيتم استخدام البريد الإلكتروني الرئيسي
            </p>
          </div>

          {/* أزرار التحكم */}
          <div style={{ display: 'flex', gap: 15, marginTop: 40 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '15px',
                background: COLORS.teal,
                color: 'white',
                border: 'none',
                borderRadius: 40,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'جاري تقديم الطلب...' : 'تقديم الطلب'}
            </button>

            <Link href="/" style={{
              flex: 1,
              padding: '15px',
              background: 'transparent',
              color: COLORS.teal,
              border: `2px solid ${COLORS.teal}`,
              borderRadius: 40,
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
            }}>
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: `2px solid ${COLORS.teal}40`,
  borderRadius: 12,
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.3s',
  boxSizing: 'border-box' as const,
};