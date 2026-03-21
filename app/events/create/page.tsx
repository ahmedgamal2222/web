'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchInstitutions, createEvent } from '@/lib/api';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  darkCard: '#1e1650',
  border: 'rgba(255,255,255,0.1)',
};

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'lecture',    label: '🎤 محاضرة' },
  { value: 'conference', label: '🏛️ مؤتمر' },
  { value: 'workshop',   label: '🛠️ ورشة عمل' },
  { value: 'seminar',    label: '📚 ندوة' },
  { value: 'course',     label: '🎓 دورة تدريبية' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    institution_id: '',
    title: '',
    description: '',
    type: 'lecture' as string,
    start_datetime: '',
    end_datetime: '',
    location: '',
    is_online: false,
    online_url: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/events/create');
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

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.institution_id) { setError('يرجى اختيار المؤسسة'); return; }
    if (!form.title.trim())   { setError('عنوان الفعالية مطلوب'); return; }
    if (!form.start_datetime) { setError('تاريخ البداية مطلوب'); return; }
    if (form.is_online && !form.online_url.trim()) {
      setError('رابط الفعالية الإلكترونية مطلوب عند اختيار "عبر الإنترنت"');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await createEvent({
        institution_id: Number(form.institution_id),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type as any,
        start_datetime: form.start_datetime,
        end_datetime: form.end_datetime || undefined,
        location: form.location.trim() || undefined,
        is_online: form.is_online,
        online_url: form.online_url.trim() || undefined,
      });
      setSuccess(`تم إنشاء الفعالية بنجاح (رقم ${result.id})`);
      setTimeout(() => router.push('/events'), 1500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإنشاء');
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
            <h1 style={{ margin: 0, fontSize: '1.6rem', color: COLORS.lightMint }}>🗓️ إنشاء فعالية جديدة</h1>
            <p style={{ margin: '4px 0 0', color: COLORS.softGreen, fontSize: '0.85rem' }}>
              ستظهر الفعالية على الشاشات الحضارية فور إنشائها
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
                <select value={form.institution_id} onChange={set('institution_id')} required style={selectStyle}>
                  <option value="">-- اختر مؤسسة --</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name_ar || inst.name}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* Title */}
            <Field label="عنوان الفعالية *">
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="أدخل عنوان الفعالية"
                required
                maxLength={250}
                style={inputStyle}
              />
            </Field>

            {/* Type */}
            <Field label="نوع الفعالية *">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EVENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: `1px solid ${form.type === t.value ? COLORS.teal : COLORS.border}`,
                      background: form.type === t.value ? COLORS.teal + '30' : 'transparent',
                      color: form.type === t.value ? COLORS.lightMint : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s',
                    }}
                  >{t.label}</button>
                ))}
              </div>
            </Field>

            {/* Datetime row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="تاريخ البداية *">
                <input
                  type="datetime-local"
                  value={form.start_datetime}
                  onChange={set('start_datetime')}
                  required
                  style={inputStyle}
                />
              </Field>
              <Field label="تاريخ النهاية">
                <input
                  type="datetime-local"
                  value={form.end_datetime}
                  onChange={set('end_datetime')}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Description */}
            <Field label="وصف الفعالية">
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="أدخل وصفاً تفصيلياً للفعالية..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </Field>

            {/* Online toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_online: !f.is_online }))}
                style={{
                  width: 44, height: 24,
                  borderRadius: 12,
                  border: 'none',
                  background: form.is_online ? COLORS.teal : 'rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  right: form.is_online ? 3 : 'auto',
                  left: form.is_online ? 'auto' : 3,
                  width: 18, height: 18,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'all 0.2s',
                }} />
              </button>
              <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                فعالية عبر الإنترنت
              </span>
            </div>

            {/* Conditional fields */}
            {form.is_online ? (
              <Field label="رابط الفعالية الإلكترونية *">
                <input
                  type="url"
                  value={form.online_url}
                  onChange={set('online_url')}
                  placeholder="https://meet.example.com/..."
                  style={inputStyle}
                />
              </Field>
            ) : (
              <Field label="مكان الفعالية">
                <input
                  type="text"
                  value={form.location}
                  onChange={set('location')}
                  placeholder="اسم القاعة أو العنوان"
                  style={inputStyle}
                />
              </Field>
            )}

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
              {submitting ? 'جاري الإنشاء...' : '✦ إنشاء الفعالية'}
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
  border: `1px solid rgba(255,255,255,0.1)`,
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
