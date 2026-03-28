'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface Request {
  id: number;
  service_id: number;
  service_title: string;
  service_price: number;
  service_currency: string;
  message: string;
  budget: number;
  deadline: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  provider_name: string;
  provider_name_ar: string;
  has_review: number;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const userStr = localStorage.getItem('user');
    const sessionId = localStorage.getItem('sessionId');
    
    if (!userStr || !sessionId) {
      router.push('/login?redirect=/services/requests');
      return;
    }

    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      
      const url = filter === 'all' 
        ? '/api/services/requests/my'
        : `/api/services/requests/my?status=${filter}`;
      
      console.log('🔍 Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-Session-ID': sessionId || '',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('📦 API Response:', data);
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        console.error('❌ API Error:', data.error);
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#FFC107';
      case 'accepted': return COLORS.teal;
      case 'in_progress': return COLORS.softGreen;
      case 'completed': return COLORS.softGreen;
      case 'cancelled': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return 'قيد الانتظار';
      case 'accepted': return 'تم القبول';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  // ✅ دالة لتنسيق التاريخ
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
    <div className="page-wrap page-inner">
      {/* الهيدر */}
      <div className="page-hero">
        <h1 style={{ fontSize: '2.5rem', marginBottom: 15 }}>
          ✦ طلباتي
        </h1>
        <p>تتبع حالة طلبات الخدمات التي قدمتها</p>
      </div>

      {/* فلاتر */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
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
        <div className="loading-page" style={{ minHeight: 260 }}>
          <div className="spinner" />
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
                      مقدم الخدمة: {request.provider_name_ar || request.provider_name}
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
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>الميزانية</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: COLORS.teal }}>
                      {request.budget} {request.service_currency}
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

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  {request.status === 'completed' && !request.has_review && (
                    <Link href={`/services/requests/${request.id}/review`} style={{
                      padding: '8px 16px',
                      background: COLORS.softGreen,
                      color: COLORS.darkNavy,
                      textDecoration: 'none',
                      borderRadius: 30,
                      fontSize: '0.9rem',
                    }}>
                      إضافة تقييم
                    </Link>
                  )}
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
              <p style={{ color: '#666' }}>لم تقم بتقديم أي طلبات خدمات بعد</p>
              <Link href="/services" style={{
                display: 'inline-block',
                marginTop: 20,
                padding: '12px 30px',
                background: COLORS.teal,
                color: 'white',
                textDecoration: 'none',
                borderRadius: 40,
              }}>
                استعرض الخدمات
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}