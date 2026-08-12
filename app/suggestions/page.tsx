'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
  bg: '#07091e',
  card: '#0d1129',
  border: '#1a1f3d',
  teal: '#4E8D9C',
  mint: '#EDF7BD',
  gold: '#FFD700',
  text: '#e2eaf2',
  muted: '#7a96aa',
};

export default function SuggestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    video_url: '',
    lecture_id: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/suggestions');
      return;
    }
    const userData = JSON.parse(userStr);
    if (userData.role === 'admin') {
      router.push('/admin/suggestions');
      return;
    }
    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const institutionId = user?.institution_id || user?.institutionId;
      if (!institutionId) {
        setError('يجب أن تكون مرتبطاً بمؤسسة لإرسال الاقتراحات');
        setSubmitting(false);
        return;
      }

      const payload: any = {
        institution_id: Number(institutionId),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        video_url: form.video_url.trim(),
      };

      if (form.lecture_id && !isNaN(Number(form.lecture_id))) {
        payload.lecture_id = Number(form.lecture_id);
      }

      const res = await fetch(`${API_BASE}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إرسال الاقتراح');
      }

      setSuccess(true);
      setForm({ title: '', description: '', video_url: '', lecture_id: '' });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        جاري التحميل...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Tajawal', sans-serif", direction: 'rtl' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${C.card} 0%, #131842 100%)`,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: '32px 36px',
          marginBottom: 28,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
        }}>
          <Link href="/" style={{ color: C.teal, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, display: 'inline-block' }}>
            → المجرة الحضارية
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: C.text, margin: '12px 0 8px' }}>
            💡 اقتراحاتي
          </h1>
          <p style={{ color: C.muted, fontSize: '0.95rem', lineHeight: 1.7 }}>
            أرسل اقتراحاتك لتحسين المحتوى الحضاري — يمكنك اقتراح فيديوهات جديدة للمحاضرات والفعاليات
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: '32px 36px',
          boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
        }}>
          {success && (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 24,
              color: '#22c55e',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}>
              ✅ تم إرسال الاقتراح بنجاح! سيتم مراجعته من قبل الإدارة
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 24,
              color: '#ff6b6b',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ color: C.text, fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>
                عنوان الاقتراح *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: محاضرة عن الذكاء الاصطناعي في المؤسسات التعليمية"
                required
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: C.bg,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 14,
                  color: C.text,
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.currentTarget.style.borderColor = C.teal}
                onBlur={e => e.currentTarget.style.borderColor = C.border}
              />
            </div>

            <div className="form-group">
              <label style={{ color: C.text, fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>
                الوصف
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="اشرح تفاصيل اقتراحك..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: C.bg,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 14,
                  color: C.text,
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: 100,
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.currentTarget.style.borderColor = C.teal}
                onBlur={e => e.currentTarget.style.borderColor = C.border}
              />
            </div>

            <div className="form-group">
              <label style={{ color: C.text, fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>
                رابط الفيديو (YouTube / Vimeo / Cloudflare) *
              </label>
              <input
                type="url"
                value={form.video_url}
                onChange={e => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: C.bg,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 14,
                  color: C.text,
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.currentTarget.style.borderColor = C.teal}
                onBlur={e => e.currentTarget.style.borderColor = C.border}
              />
            </div>

            <div className="form-group">
              <label style={{ color: C.text, fontSize: '0.9rem', fontWeight: 700, marginBottom: 8 }}>
                رقم المحاضرة (اختياري)
              </label>
              <input
                type="number"
                value={form.lecture_id}
                onChange={e => setForm({ ...form, lecture_id: e.target.value })}
                placeholder="إذا كان الاقتراح مرتبطاً بمحاضرة محددة"
                min="1"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: C.bg,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 14,
                  color: C.text,
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.currentTarget.style.borderColor = C.teal}
                onBlur={e => e.currentTarget.style.borderColor = C.border}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '16px',
                background: submitting ? C.border : `linear-gradient(135deg, ${C.teal}, #281C59)`,
                border: 'none',
                borderRadius: 16,
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: submitting ? 'none' : `0 4px 20px ${C.teal}40`,
                marginTop: 8,
              }}
            >
              {submitting ? 'جاري الإرسال...' : '📤 إرسال الاقتراح'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
