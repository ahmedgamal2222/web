'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchInstitutions, createNews, uploadImage } from '@/lib/api';

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
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');

  const [form, setForm] = useState({
    institution_id: '',
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    category: '',
  });

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('يرجى اختيار ملف صورة صالح'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('حجم الصورة يجب أن يكون أقل من 10 ميجا'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setImageUploading(true);
    setImageProgress(0);
    setError('');
    try {
      const result = await uploadImage(file, setImageProgress);
      setForm(f => ({ ...f, image_url: result.url }));
    } catch (e: any) {
      setError('فشل رفع الصورة: ' + e.message);
      setImagePreview('');
    } finally {
      setImageUploading(false);
    }
  };

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

            {/* Image Upload */}
            <Field label="صورة الخبر">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(imagePreview || form.image_url) && (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 180 }}>
                    <img src={imagePreview || form.image_url} alt="معاينة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => { setImagePreview(''); setForm(f => ({ ...f, image_url: '' })); }}
                      style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: 20, width: 28, height: 28, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                )}
                {imageUploading && (
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: COLORS.softGreen, marginBottom: 6 }}>
                      <span>جاري رفع الصورة...</span><span>{imageProgress}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${imageProgress}%`, background: COLORS.teal, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'rgba(255,255,255,0.06)', border: `1.5px dashed ${COLORS.teal}70`, borderRadius: 10, cursor: 'pointer', fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', transition: 'border-color 0.2s' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
                  <span style={{ fontSize: '1.3rem' }}>🖼️</span>
                  <span>{imageUploading ? 'جاري الرفع...' : 'اختر صورة من الجهاز'}</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}/>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>أو</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}/>
                </div>
                <input type="url" value={form.image_url} onChange={set('image_url')} placeholder="أو ألصق رابط صورة مباشرة https://..." style={inputStyle} />
              </div>
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
  background: 'rgba(255,255,255,0.07)',
  border: `1px solid ${COLORS.teal}50`,
  borderRadius: 10,
  color: 'white',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: COLORS.darkNavy,
  border: `1px solid ${COLORS.teal}60`,
  borderRadius: 10,
  color: 'white',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
  appearance: 'auto',
};
