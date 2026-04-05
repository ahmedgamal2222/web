'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchInstitutions, createNews, uploadImage } from '@/lib/api';
import Link from 'next/link';

const C = {
  bg:        '#07091e',
  bgCard:    'rgba(10,16,42,0.92)',
  border:    'rgba(78,141,156,0.18)',
  borderAcc: 'rgba(78,141,156,0.45)',
  teal:      '#4E8D9C',
  tealDim:   'rgba(78,141,156,0.12)',
  mint:      '#EDF7BD',
  green:     '#85C79A',
  navy:      '#281C59',
  cyan:      '#4fc3f7',
  purple:    '#7c4dff',
  text:      '#e2eaf2',
  textMuted: '#7a96aa',
  danger:    '#ff6b6b',
  success:   '#66bb6a',
};

const COLORS = { lightMint: C.mint, softGreen: C.green, teal: C.teal, darkNavy: C.navy, darkCard: 'rgba(10,16,42,0.92)', border: C.border };

const CATEGORIES = ['سياسة', 'اقتصاد', 'علوم', 'ثقافة', 'رياضة', 'تقنية', 'تعليم', 'صحة', 'أخرى'];

function Stars() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {[...Array(60)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%', background: 'white',
          opacity: Math.random() * 0.35 + 0.05,
          width: Math.random() * 2 + 0.5, height: Math.random() * 2 + 0.5,
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
        }} />
      ))}
    </div>
  );
}

export default function CreateNewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillInstitution = searchParams?.get('institution_id') || '';
  const [user, setUser] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');

  const [form, setForm] = useState({
    institution_id: prefillInstitution,
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
    } else if (userData.institution_id && !prefillInstitution) {
      setForm(f => ({ ...f, institution_id: String(userData.institution_id) }));
    }
  }, [router, prefillInstitution]);

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
      setSuccess(`✅ تم نشر الخبر بنجاح (#${result.id})`);
      setTimeout(() => {
        if (prefillInstitution) router.push(`/institutions/${prefillInstitution}`);
        else router.push('/news');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء النشر');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, direction: 'rtl', fontFamily: "'Tajawal', sans-serif", position: 'relative' }}>
      <Stars />

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200, height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px',
        background: 'rgba(7,9,30,0.96)', backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 24px rgba(0,0,0,0.5)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 54 54" fill="none">
            <defs><radialGradient id="rg_news" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD" /><stop offset="42%" stopColor="#85C79A" /><stop offset="100%" stopColor="#4E8D9C" /></radialGradient></defs>
            <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
            <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_news)" />
            <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.9" />
          </svg>
          <span style={{ fontSize: '1rem', fontWeight: 800, background: `linear-gradient(90deg, ${C.cyan}, #fff, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>المجرة الحضارية</span>
        </Link>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '7px 18px', borderRadius: 30,
          background: C.tealDim, border: `1px solid ${C.borderAcc}`, color: C.teal,
          cursor: 'pointer', fontSize: '0.83rem', fontWeight: 700, transition: 'all 0.2s', fontFamily: "'Tajawal', sans-serif",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.tealDim; e.currentTarget.style.color = C.teal; }}
        >← رجوع</button>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── Title ── */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 68, height: 68, borderRadius: 20, marginBottom: 16, fontSize: '2rem',
            background: 'linear-gradient(135deg, rgba(133,199,154,0.18), rgba(78,141,156,0.18))',
            border: `1.5px solid ${C.borderAcc}`, boxShadow: '0 8px 32px rgba(133,199,154,0.18)',
          }}>📰</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem,4vw,2.1rem)', fontWeight: 900, color: C.text }}>نشر خبر جديد</h1>
          <p style={{ margin: 0, color: C.textMuted, fontSize: '0.9rem' }}>سيُنشر الخبر فوراً على شاشات وصفحات المؤسسة</p>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: `1px solid rgba(255,107,107,0.32)`, borderRadius: 14, padding: '13px 18px', marginBottom: 22, color: C.danger, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(102,187,106,0.12)', border: `1px solid rgba(102,187,106,0.35)`, borderRadius: 14, padding: '13px 18px', marginBottom: 22, color: C.success, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Content Card ── */}
          <div style={{ background: C.bgCard, borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', backdropFilter: 'blur(16px)', boxShadow: '0 8px 40px rgba(0,0,0,0.35)' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(133,199,154,0.06)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${C.green}22`, border: `1px solid ${C.green}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>📝</div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text }}>محتوى الخبر</h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {user?.role === 'admin' && (
                <Field label="المؤسسة" required>
                  <select value={form.institution_id} onChange={set('institution_id')} required style={selectStyle}>
                    <option value="">— اختر مؤسسة —</option>
                    {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name_ar || inst.name}</option>)}
                  </select>
                </Field>
              )}

              <Field label="عنوان الخبر" required>
                <input type="text" value={form.title} onChange={set('title')} placeholder="أدخل عنوان الخبر..." required maxLength={250}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = 'rgba(133,199,154,0.07)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(78,141,156,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </Field>

              <Field label="التصنيف">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['بدون', ...CATEGORIES].map(cat => {
                    const val = cat === 'بدون' ? '' : cat;
                    const active = form.category === val;
                    return (
                      <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: val }))} style={{
                        padding: '7px 16px', borderRadius: 30, cursor: 'pointer',
                        border: `1.5px solid ${active ? C.green : C.border}`,
                        background: active ? `linear-gradient(135deg, ${C.green}28, rgba(78,141,156,0.14))` : 'rgba(255,255,255,0.04)',
                        color: active ? C.mint : C.textMuted,
                        fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s', fontFamily: "'Tajawal', sans-serif",
                        boxShadow: active ? `0 0 12px ${C.green}35` : 'none',
                      }}>{cat}</button>
                    );
                  })}
                </div>
              </Field>

              <Field label="محتوى الخبر">
                <textarea value={form.content} onChange={set('content')} placeholder="اكتب تفاصيل الخبر هنا..." rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8 }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = 'rgba(133,199,154,0.07)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(78,141,156,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </Field>
            </div>
          </div>

          {/* ── Media Card ── */}
          <div style={{ background: C.bgCard, borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', backdropFilter: 'blur(16px)', boxShadow: '0 8px 40px rgba(0,0,0,0.35)' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(133,199,154,0.06)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${C.green}22`, border: `1px solid ${C.green}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>🎞️</div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text }}>الصور والوسائط</h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Image preview */}
              {(imagePreview || form.image_url) && (
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 200, border: `1px solid ${C.border}` }}>
                  <img src={imagePreview || form.image_url} alt="معاينة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                  <button type="button" onClick={() => { setImagePreview(''); setForm(f => ({ ...f, image_url: '' })); }}
                    style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>معاينة الصورة</span>
                </div>
              )}

              {imageUploading && (
                <div style={{ background: 'rgba(133,199,154,0.07)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.green, marginBottom: 8 }}>
                    <span>⏳ جاري رفع الصورة...</span><span>{imageProgress}%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${imageProgress}%`, background: `linear-gradient(90deg, ${C.green}, ${C.teal})`, borderRadius: 10, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              <Field label="صورة الخبر">
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '24px 16px', background: 'rgba(133,199,154,0.04)',
                  border: `2px dashed ${C.borderAcc}`, borderRadius: 16, cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(133,199,154,0.09)'; e.currentTarget.style.borderColor = C.green; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(133,199,154,0.04)'; e.currentTarget.style.borderColor = C.borderAcc; }}
                >
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
                  <span style={{ fontSize: '2rem' }}>🖼️</span>
                  <span style={{ color: C.textMuted, fontSize: '0.85rem', fontWeight: 600 }}>{imageUploading ? 'جاري الرفع...' : 'اسحب وأفلت الصورة هنا، أو انقر للاختيار'}</span>
                  <span style={{ color: C.textMuted, fontSize: '0.73rem' }}>PNG, JPG, WEBP · حتى 10 ميجا</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: '0.78rem', color: C.textMuted }}>أو</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
                <input type="url" value={form.image_url} onChange={set('image_url')} placeholder="ألصق رابط الصورة مباشرة https://..." style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = 'rgba(133,199,154,0.07)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(78,141,156,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </Field>

              <Field label="رابط الفيديو">
                <input type="url" value={form.video_url} onChange={set('video_url')} placeholder="https://youtube.com/..." style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = 'rgba(133,199,154,0.07)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(78,141,156,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </Field>
            </div>
          </div>

          {/* ── Submit ── */}
          <button type="submit" disabled={submitting} style={{
            padding: '16px 32px', borderRadius: 40, border: 'none',
            cursor: submitting ? 'default' : 'pointer',
            background: submitting ? 'rgba(133,199,154,0.3)' : `linear-gradient(135deg, ${C.green}, ${C.teal})`,
            color: submitting ? C.textMuted : C.bg, fontSize: '1.05rem', fontWeight: 800,
            boxShadow: submitting ? 'none' : '0 8px 28px rgba(133,199,154,0.35)',
            transition: 'all 0.25s', fontFamily: "'Tajawal', sans-serif",
          }}
            onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(133,199,154,0.5)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = submitting ? 'none' : '0 8px 28px rgba(133,199,154,0.35)'; }}
          >
            {submitting ? '⏳ جاري النشر...' : '✦ نشر الخبر'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.78rem', color: C.teal, fontWeight: 700, display: 'block', letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: C.danger, marginRight: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: `1.5px solid rgba(78,141,156,0.25)`,
  borderRadius: 14, color: C.text, fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Tajawal', sans-serif", transition: 'border-color 0.2s, background 0.2s',
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(40,28,89,0.55)',
  border: `1.5px solid rgba(78,141,156,0.25)`,
  borderRadius: 14, color: C.text, fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box',
  cursor: 'pointer', fontFamily: "'Tajawal', sans-serif",
};
