'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchInstitutions, createNews } from '@/lib/api';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  darkCard: '#1e1650',
  border: 'rgba(255,255,255,0.1)',
};

const CATEGORIES = ['سياسة', 'اقتصاد', 'علوم', 'ثقافة', 'رياضة', 'تقنية', 'تعليم', 'صحة', 'أخرى'];

export default function CreateNewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    institution_id: '',
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    category: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/news/create');
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);

    if (userData.role === 'admin') {
      fetchInstitutions()
        .then(setInstitutions)
        .catch(() => setError('فشل جلب المؤسسات'));
    } else if (userData.institution_id) {
      setForm(f => ({ ...f, institution_id: String(userData.institution_id) }));
    }
  }, [router]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.institution_id) { setError('يرجى اختيار المؤسسة'); return; }
    if (!form.title.trim()) { setError('عنوان الخبر مطلوب'); return; }

    setSubmitting(true);
    setError('');
    try {
      const result = await createNews({
        institution_id: Number(form.institution_id),
        title: form.title.trim(),
        content: form.content.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
        video_url: form.video_url.trim() || undefined,
        category: form.category || undefined,
      });
      setSuccess(`تم نشر الخبر بنجاح (رقم ${result.id})`);
      setTimeout(() => router.push('/news'), 1500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء النشر');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.darkNavy,
      color: 'white',
      direction: 'rtl',
      fontFamily: 'Arial, sans-serif',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >← رجوع</button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', color: COLORS.lightMint }}>📰 نشر خبر جديد</h1>
            <p style={{ margin: '4px 0 0', color: COLORS.softGreen, fontSize: '0.85rem' }}>
              سيُنشر الخبر فوراً على الشاشات الحضارية
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: 'rgba(255,80,80,0.12)', border: '1px solid #ff5050',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            color: '#ff8080', fontSize: '0.9rem',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            background: 'rgba(133,199,154,0.15)', border: '1px solid #85C79A',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            color: COLORS.softGreen, fontSize: '0.9rem',
          }}>{success}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: COLORS.darkCard,
            borderRadius: 16,
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>

            {/* Institution (admin only) */}
            {user?.role === 'admin' && (
              <Field label="المؤسسة *">
                <select
                  value={form.institution_id}
                  onChange={set('institution_id')}
                  required
                  style={selectStyle}
                >
                  <option value="">-- اختر مؤسسة --</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name_ar || inst.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Title */}
            <Field label="عنوان الخبر *">
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="أدخل عنوان الخبر"
                required
                maxLength={250}
                style={inputStyle}
              />
            </Field>

            {/* Category */}
            <Field label="التصنيف">
              <select value={form.category} onChange={set('category')} style={selectStyle}>
                <option value="">-- بدون تصنيف --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            {/* Content */}
            <Field label="محتوى الخبر">
              <textarea
                value={form.content}
                onChange={set('content')}
                placeholder="اكتب تفاصيل الخبر هنا..."
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </Field>

            {/* Image URL */}
            <Field label="رابط الصورة">
              <input
                type="url"
                value={form.image_url}
                onChange={set('image_url')}
                placeholder="https://..."
                style={inputStyle}
              />
            </Field>

            {/* Video URL */}
            <Field label="رابط الفيديو">
              <input
                type="url"
                value={form.video_url}
                onChange={set('video_url')}
                placeholder="https://..."
                style={inputStyle}
              />
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 8,
                padding: '14px',
                background: submitting ? COLORS.teal + '80' : COLORS.teal,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {submitting ? 'جاري النشر...' : '✦ نشر الخبر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.85rem', color: COLORS.softGreen, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  color: 'white',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};
