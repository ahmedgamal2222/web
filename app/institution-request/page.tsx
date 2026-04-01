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

// ── Countries data ──────────────────────────────────────────────────────────────
const COUNTRIES: { name: string; nameAr: string; dial: string; cities: string[] }[] = [
  { name: 'Saudi Arabia',   nameAr: 'المملكة العربية السعودية', dial: '+966', cities: ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الأحساء','تبوك','أبها','القصيم','حائل','الجوف','نجران','جازان','ينبع'] },
  { name: 'UAE',            nameAr: 'الإمارات العربية المتحدة', dial: '+971', cities: ['دبي','أبوظبي','الشارقة','عجمان','رأس الخيمة','الفجيرة','أم القيوين'] },
  { name: 'Kuwait',         nameAr: 'الكويت',                  dial: '+965', cities: ['الكويت','حولي','الفروانية','مبارك الكبير','الجهراء','الأحمدي'] },
  { name: 'Qatar',          nameAr: 'قطر',                     dial: '+974', cities: ['الدوحة','الريان','الوكرة','الخور','الشمال','أم صلال'] },
  { name: 'Bahrain',        nameAr: 'البحرين',                 dial: '+973', cities: ['المنامة','المحرق','الرفاع','مدينة عيسى','مدينة حمد','سترة'] },
  { name: 'Oman',           nameAr: 'عُمان',                   dial: '+968', cities: ['مسقط','صلالة','نزوى','صور','عبري','البريمي','ولاية بوشر'] },
  { name: 'Yemen',          nameAr: 'اليمن',                   dial: '+967', cities: ['صنعاء','عدن','تعز','الحديدة','إب','مأرب','المكلا'] },
  { name: 'Jordan',         nameAr: 'الأردن',                  dial: '+962', cities: ['عمّان','الزرقاء','إربد','العقبة','السلط','المفرق','جرش'] },
  { name: 'Iraq',           nameAr: 'العراق',                  dial: '+964', cities: ['بغداد','البصرة','أربيل','الموصل','كربلاء','النجف','كركوك','السليمانية'] },
  { name: 'Syria',          nameAr: 'سوريا',                   dial: '+963', cities: ['دمشق','حلب','حمص','اللاذقية','حماة','دير الزور','الرقة'] },
  { name: 'Lebanon',        nameAr: 'لبنان',                   dial: '+961', cities: ['بيروت','طرابلس','صيدا','صور','زحلة','بعلبك'] },
  { name: 'Palestine',      nameAr: 'فلسطين',                  dial: '+970', cities: ['رام الله','غزة','القدس','نابلس','الخليل','جنين','طولكرم'] },
  { name: 'Egypt',          nameAr: 'مصر',                     dial: '+20',  cities: ['القاهرة','الإسكندرية','الجيزة','الإسماعيلية','بورسعيد','الأقصر','أسوان','شرم الشيخ','طنطا','المنصورة'] },
  { name: 'Libya',          nameAr: 'ليبيا',                   dial: '+218', cities: ['طرابلس','بنغازي','مصراتة','سبها','البيضاء','الزاوية'] },
  { name: 'Tunisia',        nameAr: 'تونس',                    dial: '+216', cities: ['تونس','صفاقس','سوسة','قفصة','بنزرت','نابل'] },
  { name: 'Algeria',        nameAr: 'الجزائر',                 dial: '+213', cities: ['الجزائر','وهران','قسنطينة','عنابة','بجاية','بليدة','تلمسان'] },
  { name: 'Morocco',        nameAr: 'المغرب',                  dial: '+212', cities: ['الرباط','الدار البيضاء','فاس','مراكش','طنجة','أكادير','مكناس','وجدة'] },
  { name: 'Sudan',          nameAr: 'السودان',                 dial: '+249', cities: ['الخرطوم','أم درمان','الخرطوم بحري','بورتسودان','كسلا','الفاشر'] },
  { name: 'Somalia',        nameAr: 'الصومال',                 dial: '+252', cities: ['مقديشو','هرجيسا','بربرة','كيسمايو','بوساسو'] },
  { name: 'Mauritania',     nameAr: 'موريتانيا',               dial: '+222', cities: ['نواكشوط','نواذيبو','كيفه','روصو','أطار'] },
  { name: 'Comoros',        nameAr: 'جزر القمر',               dial: '+269', cities: ['موروني','موتسامودو','فومبوني'] },
  { name: 'Djibouti',       nameAr: 'جيبوتي',                  dial: '+253', cities: ['جيبوتي','علي صبيح','ديخيل'] },
  { name: 'Turkey',         nameAr: 'تركيا',                   dial: '+90',  cities: ['إسطنبول','أنقرة','إزمير','بورصة','أنطاليا','طرابزون'] },
  { name: 'United Kingdom', nameAr: 'المملكة المتحدة',         dial: '+44',  cities: ['لندن','برمنغهام','مانشستر','ليدز','غلاسكو'] },
  { name: 'United States',  nameAr: 'الولايات المتحدة',        dial: '+1',   cities: ['نيويورك','لوس أنجلوس','شيكاغو','هيوستن','فينيكس','فيلادلفيا'] },
  { name: 'Germany',        nameAr: 'ألمانيا',                 dial: '+49',  cities: ['برلين','هامبورغ','ميونيخ','كولونيا','فرانكفورت'] },
  { name: 'France',         nameAr: 'فرنسا',                   dial: '+33',  cities: ['باريس','مرسيليا','ليون','تولوز','بوردو'] },
  { name: 'Canada',         nameAr: 'كندا',                    dial: '+1',   cities: ['تورنتو','مونتريال','كالغاري','فانكوفر','أوتاوا'] },
  { name: 'Australia',      nameAr: 'أستراليا',                dial: '+61',  cities: ['سيدني','ملبورن','بريزبين','بيرث','أديلايد'] },
];

export default function InstitutionRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

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
    dialCode: '+966',
    logo_url: '',
    description: '',
    employees_count: '',
    projects_count: '',
    beneficiaries_count: '',
    screen_email: '',
  });

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/institution-request');
      return;
    }
    const parsed = JSON.parse(userStr);
    setUser(parsed);
  }, [router]);

  const isEmailVerified = !!user?.email_verified;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const country = COUNTRIES.find(c => c.nameAr === selectedName);
    setFormData(prev => ({
      ...prev,
      country: selectedName,
      city: '',
      dialCode: country?.dial ?? prev.dialCode,
      phone: country ? country.dial + ' ' : prev.phone,
    }));
  };

  const selectedCountry = COUNTRIES.find(c => c.nameAr === formData.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isEmailVerified) {
        setError('يجب التحقق من بريدك الإلكتروني أولاً قبل تقديم طلب الاعتماد');
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE}/api/institution-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        body: JSON.stringify({
          name: formData.name,
          name_ar: formData.name_ar,
          name_en: formData.name_en || undefined,
          type: formData.type,
          sub_type: formData.sub_type || undefined,
          country: formData.country,
          city: formData.city,
          address: formData.address || undefined,
          registration_number: formData.registration_number || undefined,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : undefined,
          website: formData.website || undefined,
          email: formData.email,
          phone: formData.phone || undefined,
          logo_url: formData.logo_url || undefined,
          description: formData.description || undefined,
          employees_count: formData.employees_count ? parseInt(formData.employees_count) : 0,
          projects_count: formData.projects_count ? parseInt(formData.projects_count) : 0,
          beneficiaries_count: formData.beneficiaries_count ? parseInt(formData.beneficiaries_count) : 0,
          screen_email: formData.screen_email || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
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
        background: 'linear-gradient(135deg, #0a0618 0%, #13103a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        direction: 'rtl',
        fontFamily: 'Tajawal, sans-serif',
      }}>
        <div style={{
          background: '#13103a',
          border: '1px solid rgba(78,141,156,0.3)',
          borderRadius: 24,
          padding: '50px 44px',
          maxWidth: 520,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 80, height: 80,
            background: 'linear-gradient(135deg,#4E8D9C,#281C59)',
            borderRadius: '50%', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem',
          }}>🏛️</div>
          <h2 style={{ color: '#EDF7BD', marginBottom: 16 }}>تم تقديم طلب الاعتماد!</h2>
          <p style={{ color: '#8888aa', marginBottom: 12, lineHeight: 1.7 }}>
            سيتم مراجعة طلبك من قبل الإدارة والرد عليك في أقرب وقت ممكن.
          </p>
          <div style={{
            background: 'rgba(78,141,156,0.1)',
            border: '1px solid rgba(78,141,156,0.3)',
            borderRadius: 12, padding: '14px 18px',
            color: '#4E8D9C', fontSize: '0.88rem',
            lineHeight: 1.65, marginBottom: 28,
          }}>
            📧 عند الموافقة ستصلك رسالة بريدية تحتوي على <strong>كلمة مرور الشاشة الحضارية</strong> الخاصة بمؤسستك.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/my-institution-request" style={{
              display: 'inline-block', padding: '12px 24px',
              background: 'linear-gradient(135deg,#4E8D9C,#281C59)',
              color: 'white', textDecoration: 'none',
              borderRadius: 40, fontWeight: 700, fontSize: '0.9rem',
            }}>
              متابعة حالة الطلب
            </Link>
            <Link href="/" style={{
              display: 'inline-block', padding: '12px 24px',
              border: '1px solid rgba(78,141,156,0.4)',
              color: '#8888aa', textDecoration: 'none',
              borderRadius: 40, fontSize: '0.9rem',
            }}>
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* الهيدر */}
        <div className="page-hero" style={{ marginBottom: 24 }}>
          <h1>✦ طلب اعتماد مؤسسة</h1>
          <p>املأ النموذج التالي لتقديم طلب اعتماد مؤسستك في المجرة الحضارية</p>
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

          {/* تحذير: البريد غير مفعّل */}
          {!isEmailVerified && (
            <div style={{
              background: 'rgba(245,200,66,0.1)',
              border: '1px solid rgba(245,200,66,0.4)',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 24,
              color: '#f5c842',
              fontSize: '0.88rem',
              lineHeight: 1.65,
            }}>
              ⚠️ <strong>بريدك الإلكتروني غير مُفعَّل.</strong> يجب التحقق من بريدك أولاً لتتمكن من تقديم طلب الاعتماد.
              {' '}<Link href="/profile" style={{ color: '#4E8D9C', fontWeight: 700 }}>تفعيل البريد ←</Link>
            </div>
          )}

          {/* ── المعلومات الأساسية ── */}
          <SectionTitle>المعلومات الأساسية</SectionTitle>

          <div style={grid2}>
            <Field label="الاسم بالعربية *">
              <input type="text" name="name_ar" value={formData.name_ar} onChange={handleChange} required style={inputStyle} />
            </Field>
            <Field label="الاسم بالإنجليزية *">
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
            </Field>
          </div>

          <div style={{ ...grid2, marginBottom: 30 }}>
            <Field label="نوع المؤسسة *">
              <select name="type" value={formData.type} onChange={handleChange} required style={inputStyle}>
                <option value="">-- اختر النوع --</option>
                <option value="educational">تعليمية</option>
                <option value="research">بحثية</option>
                <option value="cultural">ثقافية</option>
                <option value="charitable">خيرية</option>
                <option value="media">إعلامية</option>
                <option value="developmental">تنموية</option>
              </select>
            </Field>
            <Field label="النوع الفرعي">
              <input type="text" name="sub_type" value={formData.sub_type} onChange={handleChange} style={inputStyle} placeholder="اختياري" />
            </Field>
          </div>

          {/* ── الموقع ── */}
          <SectionTitle>الموقع</SectionTitle>

          <div style={grid2}>
            <Field label="الدولة *">
              <select name="country" value={formData.country} onChange={handleCountryChange} required style={inputStyle}>
                <option value="">-- اختر الدولة --</option>
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.nameAr}>{c.nameAr}</option>
                ))}
              </select>
            </Field>
            <Field label="المدينة *">
              {selectedCountry ? (
                <select name="city" value={formData.city} onChange={handleChange} required style={inputStyle}>
                  <option value="">-- اختر المدينة --</option>
                  {selectedCountry.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              ) : (
                <input type="text" name="city" value={formData.city} onChange={handleChange} required style={{ ...inputStyle, background: '#f5f5f5', cursor: 'not-allowed' }} placeholder="اختر الدولة أولا" disabled />
              )}
            </Field>
          </div>

          <div style={{ marginBottom: 30 }}>
            <Field label="العنوان">
              <input type="text" name="address" value={formData.address} onChange={handleChange} style={inputStyle} placeholder="اختياري" />
            </Field>
          </div>

          {/* ── معلومات الاتصال ── */}
          <SectionTitle>معلومات الاتصال</SectionTitle>

          <div style={grid2}>
            <Field label="البريد الإلكتروني *">
              <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} placeholder="contact@institution.com" />
            </Field>
            <Field label="رقم الهاتف *">
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 12px',
                  background: `${COLORS.teal}15`,
                  border: `2px solid ${COLORS.teal}`,
                  borderRadius: 10,
                  fontWeight: 600,
                  color: COLORS.teal,
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  minWidth: 64,
                }}>
                  {formData.dialCode}
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="5XXXXXXXX"
                />
              </div>
            </Field>
          </div>

          <div style={{ marginBottom: 30 }}>
            <Field label="الموقع الإلكتروني">
              <input type="url" name="website" value={formData.website} onChange={handleChange} style={inputStyle} placeholder="https://institution.com" />
            </Field>
          </div>

          {/* ── معلومات إضافية ── */}
          <SectionTitle>معلومات إضافية</SectionTitle>

          <div style={grid2}>
            <Field label="رقم التسجيل">
              <input type="text" name="registration_number" value={formData.registration_number} onChange={handleChange} style={inputStyle} placeholder="اختياري" />
            </Field>
            <Field label="سنة التأسيس">
              <input
                type="number"
                name="founded_year"
                value={formData.founded_year}
                onChange={handleChange}
                min="1800"
                max={new Date().getFullYear()}
                style={inputStyle}
                placeholder="مثال: 2010"
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 30 }}>
            <Field label="عدد الموظفين">
              <input type="number" name="employees_count" value={formData.employees_count} onChange={handleChange} min="0" placeholder="0" style={inputStyle} />
            </Field>
            <Field label="عدد المشاريع">
              <input type="number" name="projects_count" value={formData.projects_count} onChange={handleChange} min="0" placeholder="0" style={inputStyle} />
            </Field>
            <Field label="عدد المستفيدين">
              <input type="number" name="beneficiaries_count" value={formData.beneficiaries_count} onChange={handleChange} min="0" placeholder="0" style={inputStyle} />
            </Field>
          </div>

          <div style={{ marginBottom: 30 }}>
            <Field label="وصف المؤسسة">
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="اكتب وصفاً موجزاً للمؤسسة..." />
            </Field>
          </div>

          {/* ── شاشة العرض ── */}
          <SectionTitle>شاشة العرض الحضارية</SectionTitle>

          <div style={{ marginBottom: 30 }}>
            <Field label="البريد الإلكتروني للشاشة (اختياري)">
              <input
                type="email"
                name="screen_email"
                value={formData.screen_email}
                onChange={handleChange}
                style={inputStyle}
                placeholder="سيُرسَل إليه باسورد الشاشة عند الموافقة"
              />
            </Field>
            <p style={{ color: '#888', fontSize: '0.8rem', marginTop: 6 }}>
              🔑 ستصلك كلمة مرور الشاشة على هذا البريد تلقائياً عند الموافقة على طلبك
            </p>
          </div>

          {/* ── أزرار التحكم ── */}
          <div style={{ display: 'flex', gap: 15, marginTop: 40 }}>
            <button
              type="submit"
              disabled={loading || !isEmailVerified}
              style={{
                flex: 2,
                padding: '15px',
                background: (loading || !isEmailVerified) ? `${COLORS.teal}50` : COLORS.teal,
                color: 'white',
                border: 'none',
                borderRadius: 40,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: (loading || !isEmailVerified) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'جاري تقديم الطلب...' : !isEmailVerified ? '⚠️ تفعيل البريد أولاً' : 'تقديم طلب الاعتماد'}
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

// ── Helpers ─────────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      color: COLORS.teal,
      fontSize: '1.2rem',
      marginBottom: 20,
      paddingBottom: 8,
      borderBottom: `2px solid ${COLORS.lightMint}`,
    }}>
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: COLORS.darkNavy, fontSize: '0.9rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: `2px solid ${COLORS.teal}`,
  borderRadius: 10,
  fontSize: '0.95rem',
  outline: 'none',
  background: '#fff',
  color: '#1a1a2e',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
