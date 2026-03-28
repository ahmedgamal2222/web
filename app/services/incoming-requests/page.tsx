'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface IncomingRequest {
  id: number;
  service_id: number;
  service_title: string;
  message: string;
  budget: number;
  deadline: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  client_name: string;
  client_name_ar: string;
  client_email: string;
}

export default function IncomingRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const sessionId = localStorage.getItem('sessionId');
    
    if (!userStr || !sessionId) {
      router.push('/login?redirect=/services/incoming-requests');
      return;
    }

    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      const url = filter === 'all' 
        ? '/api/services/requests/incoming'
        : `/api/services/requests/incoming?status=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Session-ID': sessionId || '',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: number, newStatus: string) => {
    try {
      setProcessingId(requestId);
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${API_BASE}/api/services/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // تحديث القائمة
        setRequests(prev => prev.map(r => 
          r.id === requestId ? { ...r, status: newStatus as any } : r
        ));
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('حدث خطأ في تحديث الطلب');
    } finally {
      setProcessingId(null);
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

  return (
    <div className="page-wrap page-inner">
      {/* الهيدر */}
      <div className="page-hero">
        <h1 style={{ fontSize: '2.5rem', marginBottom: 15 }}>
          ✦ الطلبات الواردة
        </h1>
        <p>الطلبات المقدمة على خدماتك</p>
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
                      مقدم الطلب: {request.client_name_ar || request.client_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {request.client_email}
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
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>الميزانية المقترحة</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: COLORS.teal }}>
                      {request.budget} جنيه
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>المدة المطلوبة</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: COLORS.darkNavy }}>
                      {request.deadline} يوم
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>تاريخ الطلب</div>
                    <div style={{ fontSize: '1rem', color: '#666' }}>
                      {new Date(request.created_at).toLocaleDateString('ar-EG')}
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

                {/* أزرار الإجراءات */}
                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => updateRequestStatus(request.id, 'accepted')}
                      disabled={processingId === request.id}
                      style={{
                        padding: '8px 20px',
                        background: COLORS.softGreen,
                        color: COLORS.darkNavy,
                        border: 'none',
                        borderRadius: 30,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        opacity: processingId === request.id ? 0.7 : 1,
                      }}
                    >
                      {processingId === request.id ? 'جاري...' : '✅ قبول'}
                    </button>
                    <button
                      onClick={() => updateRequestStatus(request.id, 'cancelled')}
                      disabled={processingId === request.id}
                      style={{
                        padding: '8px 20px',
                        background: '#ff5050',
                        color: 'white',
                        border: 'none',
                        borderRadius: 30,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        opacity: processingId === request.id ? 0.7 : 1,
                      }}
                    >
                      {processingId === request.id ? 'جاري...' : '❌ رفض'}
                    </button>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => updateRequestStatus(request.id, 'in_progress')}
                      disabled={processingId === request.id}
                      style={{
                        padding: '8px 20px',
                        background: COLORS.teal,
                        color: 'white',
                        border: 'none',
                        borderRadius: 30,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      بدء التنفيذ
                    </button>
                  </div>
                )}

                {request.status === 'in_progress' && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => updateRequestStatus(request.id, 'completed')}
                      disabled={processingId === request.id}
                      style={{
                        padding: '8px 20px',
                        background: COLORS.softGreen,
                        color: COLORS.darkNavy,
                        border: 'none',
                        borderRadius: 30,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      إكمال الطلب
                    </button>
                  </div>
                )}
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
              <h3>لا توجد طلبات</h3>
              <p>لم يصلك أي طلبات على خدماتك بعد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}