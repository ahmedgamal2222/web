// app/services/requests/[requestId]/review/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const userStr = localStorage.getItem('user');
    const sessionId = localStorage.getItem('sessionId');
    if (!userStr || !sessionId) {
      router.push(`/login?redirect=/services/requests/${requestId}/review`);
      return;
    }
  }, [requestId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('يرجى اختيار تقييم');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/services/requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId || '',
        },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/services/requests');
        }, 3000);
      } else {
        setError(data.error || 'حدث خطأ أثناء إرسال التقييم');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

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
          padding: '40px',
          maxWidth: 400,
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
          <h2 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>شكراً لتقييمك!</h2>
          <p style={{ color: COLORS.teal, marginBottom: 20 }}>تقييمك يساعد في تحسين الخدمات</p>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${COLORS.teal}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '20px auto',
          }} />
          <p style={{ fontSize: '0.9rem', color: '#666' }}>جاري التحويل إلى صفحة الطلبات...</p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
      direction: 'rtl',
      padding: '20px',
    }}>
      <div style={{
        background: COLORS.darkNavy,
        borderRadius: 30,
        padding: '40px',
        marginBottom: 30,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: 200,
          height: 200,
          background: COLORS.teal,
          opacity: 0.2,
          borderRadius: '50%',
        }} />
        <Link href={`/services/requests`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: COLORS.lightMint,
          textDecoration: 'none',
          marginBottom: 20,
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 40,
          fontSize: '0.9rem',
        }}>
          <span>←</span>
          العودة إلى طلباتي
        </Link>

        <h1 style={{ fontSize: '2.5rem', marginBottom: 15 }}>
          ✦ تقييم الخدمة
        </h1>
        <p>شارك تجربتك مع هذه الخدمة لتساعد الآخرين</p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: 30,
        padding: '40px',
        maxWidth: 600,
        margin: '0 auto',
        boxShadow: `0 10px 30px ${COLORS.darkNavy}20`,
      }}>
        <form onSubmit={handleSubmit}>
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

          {/* تقييم النجوم */}
          <div style={{ marginBottom: 30, textAlign: 'center' }}>
            <label style={{
              display: 'block',
              marginBottom: 15,
              color: COLORS.darkNavy,
              fontWeight: 600,
              fontSize: '1.1rem',
            }}>
              كيف تقيم هذه الخدمة؟
            </label>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              direction: 'ltr',
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2.5rem',
                    cursor: 'pointer',
                    color: star <= (hoverRating || rating) ? '#FFD700' : '#ddd',
                    transition: 'color 0.2s',
                    padding: '0 5px',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <p style={{ marginTop: 10, color: '#666', fontSize: '0.9rem' }}>
              {rating === 1 && 'سيء'}
              {rating === 2 && 'مقبول'}
              {rating === 3 && 'جيد'}
              {rating === 4 && 'جيد جداً'}
              {rating === 5 && 'ممتاز'}
            </p>
          </div>

          {/* تعليق اختياري */}
          <div style={{ marginBottom: 30 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              color: COLORS.darkNavy,
              fontWeight: 600,
            }}>
              أضف تعليقاً (اختياري)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شارك تفاصيل تجربتك مع هذه الخدمة..."
              rows={5}
              style={{
                width: '100%',
                padding: '15px',
                border: `2px solid ${COLORS.teal}40`,
                borderRadius: 15,
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* أزرار */}
          <div style={{ display: 'flex', gap: 15 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                flex: 1,
                padding: '14px',
                background: 'transparent',
                color: COLORS.teal,
                border: `2px solid ${COLORS.teal}`,
                borderRadius: 40,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
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
              {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}