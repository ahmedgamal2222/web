'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProviderRequests, updateRequestStatus, ServiceRequest } from '@/lib/api';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

export default function ProviderRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const userStr = localStorage.getItem('user');
    const sessionId = localStorage.getItem('sessionId');
    if (!userStr || !sessionId) {
      router.push('/login?redirect=/services/provider-requests');
      return;
    }

    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : undefined;
      const result = await fetchProviderRequests(params);
      setRequests(result.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: ServiceRequest['status']) => {
    try {
      setUpdatingId(requestId);
      await updateRequestStatus(requestId, newStatus as any);
      // إعادة تحميل القائمة بعد التحديث
      await loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      alert('حدث خطأ أثناء تحديث الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFC107';
      case 'accepted': return COLORS.teal;
      case 'in_progress': return COLORS.softGreen;
      case 'completed': return COLORS.softGreen;
      case 'cancelled': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'accepted': return 'تم القبول';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
      direction: 'rtl',
      padding: '20px',
    }}>
      {/* الهيدر */}
      <div style={{
        background: COLORS.darkNavy,
        borderRadius: 30,
        padding: '40px',
        marginBottom: 30,
        color: 'white',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 15 }}>
          ✦ طلبات الخدمات الواردة
        </h1>
        <p>الطلبات المقدمة على خدماتك – يمكنك قبولها أو رفضها أو متابعتها</p>
      </div>

      {/* فلاتر */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '20px',
        marginBottom: 30,
        boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
      }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: 30,
                border: `2px solid ${filter === status ? COLORS.teal : 'transparent'}`,
                background: filter === status ? COLORS.teal : 'transparent',
                color: filter === status ? 'white' : COLORS.teal,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {status === 'all' ? 'الكل' : getStatusText(status)}
            </button>
          ))}
        </div>
      </div>

      {/* قائمة الطلبات */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <div style={{
            width: 50,
            height: 50,
            margin: '0 auto 20px',
            border: `3px solid ${COLORS.teal}20`,
            borderTopColor: COLORS.teal,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p>جاري تحميل الطلبات...</p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {requests.length > 0 ? (
            requests.map((request) => (
              <div
                key={request.id}
                style={{
                  background: 'white',
                  borderRadius: 20,
                  padding: '20px',
                  boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 15,
                }}>
                  <div>
                    <Link href={`/services/${request.service_id}`} style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: COLORS.darkNavy,
                      textDecoration: 'none',
                      marginBottom: 5,
                      display: 'block',
                    }}>
                      {request.service_title}
                    </Link>
                    <div style={{ fontSize: '0.9rem', color: COLORS.teal }}>
                      مقدم الطلب: {request.client_name_ar || request.client_name}
                    </div>
                  </div>

                  <span style={{
                    padding: '6px 12px',
                    borderRadius: 30,
                    background: `${getStatusColor(request.status)}20`,
                    color: getStatusColor(request.status),
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}>
                    {getStatusText(request.status)}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 15,
                  marginBottom: 15,
                  padding: '15px 0',
                  borderTop: `1px solid ${COLORS.teal}20`,
                  borderBottom: `1px solid ${COLORS.teal}20`,
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>الميزانية المقترحة</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: COLORS.teal }}>
                      {request.budget} جنيه
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>المدة المطلوبة</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: COLORS.darkNavy }}>
                      {request.deadline} يوم
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>تاريخ الطلب</div>
                    <div style={{ fontSize: '1rem', color: '#666' }}>
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                </div>

                <p style={{
                  color: '#444',
                  lineHeight: 1.6,
                  marginBottom: 15,
                  background: `${COLORS.lightMint}20`,
                  padding: '15px',
                  borderRadius: 12,
                }}>
                  {request.message}
                </p>

                {/* أزرار الإجراءات حسب الحالة */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'accepted')}
                        disabled={updatingId === request.id}
                        style={{
                          padding: '8px 16px',
                          background: COLORS.softGreen,
                          color: COLORS.darkNavy,
                          border: 'none',
                          borderRadius: 30,
                          fontSize: '0.9rem',
                          cursor: updatingId === request.id ? 'default' : 'pointer',
                          opacity: updatingId === request.id ? 0.5 : 1,
                        }}
                      >
                        قبول الطلب
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'cancelled')}
                        disabled={updatingId === request.id}
                        style={{
                          padding: '8px 16px',
                          background: '#ff5050',
                          color: 'white',
                          border: 'none',
                          borderRadius: 30,
                          fontSize: '0.9rem',
                          cursor: updatingId === request.id ? 'default' : 'pointer',
                          opacity: updatingId === request.id ? 0.5 : 1,
                        }}
                      >
                        رفض الطلب
                      </button>
                    </>
                  )}
                  {request.status === 'accepted' && (
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                      disabled={updatingId === request.id}
                      style={{
                        padding: '8px 16px',
                        background: COLORS.teal,
                        color: 'white',
                        border: 'none',
                        borderRadius: 30,
                        fontSize: '0.9rem',
                        cursor: updatingId === request.id ? 'default' : 'pointer',
                        opacity: updatingId === request.id ? 0.5 : 1,
                      }}
                    >
                      بدء التنفيذ
                    </button>
                  )}
                  {request.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'completed')}
                      disabled={updatingId === request.id}
                      style={{
                        padding: '8px 16px',
                        background: COLORS.softGreen,
                        color: COLORS.darkNavy,
                        border: 'none',
                        borderRadius: 30,
                        fontSize: '0.9rem',
                        cursor: updatingId === request.id ? 'default' : 'pointer',
                        opacity: updatingId === request.id ? 0.5 : 1,
                      }}
                    >
                      إكمال الخدمة
                    </button>
                  )}
                  {/* عرض التفاصيل */}
                  <Link href={`/services/requests/${request.id}`} style={{
                    padding: '8px 16px',
                    background: COLORS.teal,
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 30,
                    fontSize: '0.9rem',
                  }}>
                    عرض التفاصيل
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'white',
              borderRadius: 30,
            }}>
              <span style={{ fontSize: '4rem' }}>📭</span>
              <h3 style={{ color: COLORS.darkNavy, margin: '20px 0' }}>لا توجد طلبات</h3>
              <p style={{ color: '#666' }}>لم يتم تقديم أي طلبات على خدماتك بعد</p>
              <Link href="/services" style={{
                display: 'inline-block',
                marginTop: 20,
                padding: '12px 30px',
                background: COLORS.teal,
                color: 'white',
                textDecoration: 'none',
                borderRadius: 40,
              }}>
                العودة إلى الخدمات
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}