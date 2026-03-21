'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface Service {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  delivery_time: number;
  status: string;
  provider_id: number;
  provider_name: string;
  provider_name_ar: string;
  provider_email: string;
  provider_avatar: string;
  institution_name: string;
  institution_name_ar: string;
  institution_logo: string;
  image_url: string;
  tags: string[];
  rating: number;
  average_rating: number;
  completed_requests: number;
  total_reviews: number;
  reviews: Review[];
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  reviewer_name_ar: string;
  reviewer_avatar: string;
}

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({
    message: '',
    budget: '',
    deadline: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    fetchService();
  }, [params.id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setService(data.data);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login?redirect=' + window.location.pathname);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/services/${params.id}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        body: JSON.stringify({
          message: requestForm.message,
          budget: parseFloat(requestForm.budget),
          deadline: parseInt(requestForm.deadline),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('تم تقديم طلبك بنجاح!');
        setShowRequestForm(false);
        setRequestForm({ message: '', budget: '', deadline: '' });
      } else {
        alert(data.error || 'حدث خطأ في تقديم الطلب');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        جاري التحميل...
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        الخدمة غير موجودة
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
      {/* زر العودة */}
      <Link href="/services" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        color: COLORS.teal,
        textDecoration: 'none',
        marginBottom: 20,
        padding: '10px 20px',
        background: 'white',
        borderRadius: 40,
        boxShadow: `0 2px 10px ${COLORS.darkNavy}20`,
      }}>
        <span>←</span>
        العودة إلى الخدمات
      </Link>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 20,
      }}>
        {/* العمود الرئيسي */}
        <div>
          {/* صورة الخدمة */}
          <div style={{
            height: 400,
            background: service.image_url 
              ? `url(${service.image_url}) center/cover`
              : `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen})`,
            borderRadius: 30,
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {!service.image_url && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '5rem',
                opacity: 0.3,
              }}>
                🛠️
              </div>
            )}
          </div>

          {/* معلومات الخدمة */}
          <div style={{
            background: 'white',
            borderRadius: 30,
            padding: '30px',
            boxShadow: `0 5px 20px ${COLORS.darkNavy}20`,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
            }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: COLORS.darkNavy, marginBottom: 10 }}>
                  {service.title}
                </h1>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{
                    background: `${COLORS.teal}20`,
                    color: COLORS.teal,
                    padding: '5px 15px',
                    borderRadius: 30,
                    fontSize: '0.9rem',
                  }}>
                    {service.category}
                  </span>
                  {service.tags?.map((tag, index) => (
                    <span key={index} style={{
                      background: `${COLORS.lightMint}40`,
                      color: COLORS.darkNavy,
                      padding: '5px 15px',
                      borderRadius: 30,
                      fontSize: '0.9rem',
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{
                background: `${COLORS.softGreen}20`,
                padding: '15px',
                borderRadius: 20,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: COLORS.teal }}>
                  {service.price} {service.currency}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  ⏱️ {service.delivery_time} يوم
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '20px 0',
              borderTop: `1px solid ${COLORS.teal}20`,
              borderBottom: `1px solid ${COLORS.teal}20`,
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#FFD700' }}>⭐</span>
                <span style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                  {service.average_rating?.toFixed(1) || 'جديد'}
                </span>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  ({service.total_reviews} تقييم)
                </span>
              </div>
              <div>•</div>
              <div style={{ color: '#666' }}>
                {service.completed_requests || 0} طلب مكتمل
              </div>
            </div>

            <h2 style={{ fontSize: '1.3rem', color: COLORS.darkNavy, marginBottom: 15 }}>
              وصف الخدمة
            </h2>
            <p style={{
              color: '#444',
              lineHeight: 1.8,
              fontSize: '1rem',
              marginBottom: 30,
            }}>
              {service.description}
            </p>
          </div>
        </div>

        {/* العمود الجانبي */}
        <div>
          {/* معلومات مقدم الخدمة */}
          <div style={{
            background: 'white',
            borderRadius: 30,
            padding: '30px',
            boxShadow: `0 5px 20px ${COLORS.darkNavy}20`,
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: '1.2rem', color: COLORS.darkNavy, marginBottom: 20 }}>
              مقدم الخدمة
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: service.provider_avatar 
                  ? `url(${service.provider_avatar}) center/cover`
                  : COLORS.teal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
              }}>
                {!service.provider_avatar && (service.provider_name_ar?.charAt(0) || service.provider_name?.charAt(0))}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                  {service.provider_name_ar || service.provider_name}
                </div>
                {service.institution_name && (
                  <div style={{ fontSize: '0.9rem', color: COLORS.teal }}>
                    {service.institution_name_ar || service.institution_name}
                  </div>
                )}
              </div>
            </div>

            <Link href={`/profile/${service.provider_id}`} style={{
              display: 'block',
              textAlign: 'center',
              padding: '10px',
              background: COLORS.teal,
              color: 'white',
              textDecoration: 'none',
              borderRadius: 40,
              fontSize: '0.9rem',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.darkNavy}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.teal}
            >
              عرض الملف الشخصي
            </Link>
          </div>

          {/* طلب الخدمة */}
          <div style={{
            background: 'white',
            borderRadius: 30,
            padding: '30px',
            boxShadow: `0 5px 20px ${COLORS.darkNavy}20`,
          }}>
            {!showRequestForm ? (
              <>
                <h2 style={{ fontSize: '1.2rem', color: COLORS.darkNavy, marginBottom: 15 }}>
                  هل تريد هذه الخدمة؟
                </h2>
                <button
                  onClick={() => setShowRequestForm(true)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: COLORS.softGreen,
                    color: COLORS.darkNavy,
                    border: 'none',
                    borderRadius: 40,
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.teal}
                  onMouseLeave={e => e.currentTarget.style.background = COLORS.softGreen}
                >
                  طلب الخدمة الآن
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmitRequest}>
                <h2 style={{ fontSize: '1.2rem', color: COLORS.darkNavy, marginBottom: 20 }}>
                  تفاصيل الطلب
                </h2>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: COLORS.darkNavy }}>
                    رسالتك لمقدم الخدمة *
                  </label>
                  <textarea
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    required
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${COLORS.teal}40`,
                      borderRadius: 12,
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                    placeholder="اكتب تفاصيل ما تحتاجه..."
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: COLORS.darkNavy }}>
                    ميزانيتك (بالـ {service.currency}) *
                  </label>
                  <input
                    type="number"
                    value={requestForm.budget}
                    onChange={(e) => setRequestForm({ ...requestForm, budget: e.target.value })}
                    required
                    min="1"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${COLORS.teal}40`,
                      borderRadius: 12,
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, color: COLORS.darkNavy }}>
                    المدة الزمنية المطلوبة (بالأيام) *
                  </label>
                  <input
                    type="number"
                    value={requestForm.deadline}
                    onChange={(e) => setRequestForm({ ...requestForm, deadline: e.target.value })}
                    required
                    min="1"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${COLORS.teal}40`,
                      borderRadius: 12,
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: COLORS.softGreen,
                      color: COLORS.darkNavy,
                      border: 'none',
                      borderRadius: 40,
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: submitting ? 'default' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'transparent',
                      color: COLORS.teal,
                      border: `2px solid ${COLORS.teal}`,
                      borderRadius: 40,
                      fontSize: '1rem',
                      cursor: 'pointer',
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* قسم التقييمات */}
      {service.reviews && service.reviews.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 30,
          padding: '30px',
          marginTop: 20,
          boxShadow: `0 5px 20px ${COLORS.darkNavy}20`,
        }}>
          <h2 style={{ fontSize: '1.3rem', color: COLORS.darkNavy, marginBottom: 20 }}>
            التقييمات ({service.total_reviews})
          </h2>

          <div style={{ display: 'grid', gap: 20 }}>
            {service.reviews.map((review) => (
              <div key={review.id} style={{
                padding: '15px',
                border: `1px solid ${COLORS.teal}20`,
                borderRadius: 15,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: review.reviewer_avatar 
                      ? `url(${review.reviewer_avatar}) center/cover`
                      : COLORS.teal,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}>
                    {!review.reviewer_avatar && (review.reviewer_name_ar?.charAt(0) || review.reviewer_name?.charAt(0))}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                      {review.reviewer_name_ar || review.reviewer_name}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{
                          color: star <= review.rating ? '#FFD700' : '#ddd',
                        }}>★</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginRight: 'auto' }}>
                    {new Date(review.created_at).toLocaleDateString('ar-EG')}
                  </div>
                </div>
                {review.comment && (
                  <p style={{ color: '#444', lineHeight: 1.6 }}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
