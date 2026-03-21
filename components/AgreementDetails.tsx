// src/components/AgreementDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { Agreement } from '@/lib/types';
import { fetchAgreementDetails } from '@/lib/api';

interface Props {
  agreementId: string | number;
  onClose: () => void;
  onInstitutionClick?: (institutionId: number) => void;
}

export default function AgreementDetails({ agreementId, onClose, onInstitutionClick }: Props) {
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'parties'>('details');

  useEffect(() => {
    async function loadAgreement() {
      try {
        setLoading(true);
        const data = await fetchAgreementDetails(agreementId);
        setAgreement(data);
      } catch (err) {
        setError('فشل تحميل تفاصيل الاتفاقية');
      } finally {
        setLoading(false);
      }
    }
    
    if (agreementId) {
      loadAgreement();
    }
  }, [agreementId]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'completed': return '#2196F3';
      case 'inactive': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'نشطة';
      case 'pending': return 'قيد الانتظار';
      case 'completed': return 'مكتملة';
      case 'inactive': return 'غير نشطة';
      default: return 'غير معروفة';
    }
  };

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      'educational': 'تعليمية',
      'research': 'بحثية',
      'cultural': 'ثقافية',
      'exchange': 'تبادل',
      'partnership': 'شراكة',
      'commercial': 'تجارية',
    };
    return types[type] || type;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'rgba(6,8,18,0.98)', border: '1px solid rgba(155,176,255,0.2)',
        borderRadius: 16, padding: 30, zIndex: 1000,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        minWidth: 400,
      }}>
        <div style={{ textAlign: 'center', color: '#9BB0FF' }}>
          <div style={{
            width: 40, height: 40, margin: '0 auto 15px',
            border: '3px solid rgba(155,176,255,0.2)', borderTopColor: '#9BB0FF',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          جاري تحميل تفاصيل الاتفاقية...
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'rgba(6,8,18,0.98)', border: '1px solid #ff5050',
        borderRadius: 16, padding: 30, zIndex: 1000,
        minWidth: 400,
      }}>
        <div style={{ color: '#ff5050', marginBottom: 20, textAlign: 'center' }}>
          ❌ {error || 'الاتفاقية غير موجودة'}
        </div>
        <button onClick={onClose} style={{
          background: '#ff5050', color: '#fff', border: 'none',
          padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
          width: '100%',
        }}>إغلاق</button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'rgba(6,8,18,0.98)', border: '1px solid rgba(155,176,255,0.3)',
      borderRadius: 24, padding: 0, zIndex: 1000,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      maxWidth: 700, width: '90%',
      direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: 'hidden',
    }}>
      {/* Header مع الشريط العلوي */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(155,176,255,0.1), rgba(255,210,161,0.05))',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#9BB0FF', fontSize: '1.5rem' }}>
              {agreement.title || 'تفاصيل الاتفاقية'}
            </h2>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <span style={{
                background: `${getStatusColor(agreement.status)}20`,
                color: getStatusColor(agreement.status),
                padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem',
                border: `1px solid ${getStatusColor(agreement.status)}40`,
              }}>
                {getStatusText(agreement.status)}
              </span>
              <span style={{
                background: `${TYPE_COLORS[agreement.type] || '#9BB0FF'}20`,
                color: TYPE_COLORS[agreement.type] || '#9BB0FF',
                padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem',
              }}>
                {getTypeText(agreement.type)}
              </span>
              {agreement.strength && (
                <span style={{
                  background: 'rgba(255,215,0,0.1)',
                  color: '#FFD700', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {Array(agreement.strength).fill('★').join('')}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none',
            color: '#999', fontSize: '1.3rem', cursor: 'pointer',
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            flex: 1, padding: '12px', background: 'none', border: 'none',
            color: activeTab === 'details' ? '#9BB0FF' : '#666',
            borderBottom: activeTab === 'details' ? '2px solid #9BB0FF' : '2px solid transparent',
            cursor: 'pointer', fontSize: '0.9rem',
          }}
        >
          تفاصيل الاتفاقية
        </button>
        <button
          onClick={() => setActiveTab('parties')}
          style={{
            flex: 1, padding: '12px', background: 'none', border: 'none',
            color: activeTab === 'parties' ? '#9BB0FF' : '#666',
            borderBottom: activeTab === 'parties' ? '2px solid #9BB0FF' : '2px solid transparent',
            cursor: 'pointer', fontSize: '0.9rem',
          }}
        >
          الأطراف المشاركة
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
        {activeTab === 'details' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* الوصف */}
            {agreement.description && (
              <div style={{
                background: 'rgba(0,0,0,0.2)', padding: 16,
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>الوصف:</div>
                <div style={{ color: '#ddd', lineHeight: 1.8 }}>
                  {agreement.description}
                </div>
              </div>
            )}

            {/* التواريخ */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
            }}>
              {agreement.signed_date && (
                <div style={{
                  background: 'rgba(155,176,255,0.05)', padding: 12,
                  borderRadius: 8, border: '1px solid rgba(155,176,255,0.1)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#666' }}>تاريخ التوقيع</div>
                  <div style={{ color: '#9BB0FF', fontSize: '0.9rem' }}>
                    {formatDate(agreement.signed_date)}
                  </div>
                </div>
              )}
              {agreement.start_date && (
                <div style={{
                  background: 'rgba(76,175,80,0.05)', padding: 12,
                  borderRadius: 8, border: '1px solid rgba(76,175,80,0.1)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#666' }}>تاريخ البدء</div>
                  <div style={{ color: '#4CAF50', fontSize: '0.9rem' }}>
                    {formatDate(agreement.start_date)}
                  </div>
                </div>
              )}
              {agreement.end_date && (
                <div style={{
                  background: agreement.status === 'active' ? 'rgba(255,193,7,0.05)' : 'rgba(158,158,158,0.05)',
                  padding: 12, borderRadius: 8,
                  border: `1px solid ${agreement.status === 'active' ? 'rgba(255,193,7,0.2)' : 'rgba(158,158,158,0.2)'}`,
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#666' }}>تاريخ الانتهاء</div>
                  <div style={{
                    color: agreement.status === 'active' ? '#FFC107' : '#9E9E9E',
                    fontSize: '0.9rem'
                  }}>
                    {formatDate(agreement.end_date)}
                  </div>
                </div>
              )}
            </div>

            {/* معلومات إضافية */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', padding: 16,
              borderRadius: 12, marginTop: 8,
            }}>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 12 }}>
                معلومات إضافية
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>رقم الاتفاقية:</span>
                  <span style={{ color: '#fff', marginRight: 8 }}>#{agreement.id}</span>
                </div>
                <div>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>تاريخ الإنشاء:</span>
                  <span style={{ color: '#fff', marginRight: 8 }}>
                    {agreement.created_at ? formatDate(agreement.created_at) : 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* الطرف الأول */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(155,176,255,0.05), transparent)',
              padding: 20, borderRadius: 12,
              border: '1px solid rgba(155,176,255,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                {agreement.from_logo ? (
                  <img src={agreement.from_logo} alt="" style={{
                    width: 50, height: 50, borderRadius: '50%',
                    border: '2px solid #9BB0FF',
                  }} />
                ) : (
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'rgba(155,176,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9BB0FF', fontSize: '1.2rem',
                  }}>
                    {agreement.from_name?.charAt(0) || 'م'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>الطرف الأول</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff' }}>
                    {agreement.from_name_ar || agreement.from_name || `مؤسسة ${agreement.from_id}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9BB0FF' }}>ID: {agreement.from_id}</div>
                </div>
              </div>
              {onInstitutionClick && (
                <button
                  onClick={() => onInstitutionClick(agreement.from_id)}
                  style={{
                    background: 'rgba(155,176,255,0.1)', border: '1px solid rgba(155,176,255,0.3)',
                    color: '#9BB0FF', padding: '8px', borderRadius: 6,
                    width: '100%', cursor: 'pointer', marginTop: 10,
                  }}
                >
                  عرض ملف المؤسسة
                </button>
              )}
            </div>

            {/* سهم للاتجاه */}
            <div style={{ textAlign: 'center', color: '#666', fontSize: '1.2rem' }}>
              ↓
            </div>

            {/* الطرف الثاني */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,210,161,0.05), transparent)',
              padding: 20, borderRadius: 12,
              border: '1px solid rgba(255,210,161,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                {agreement.to_logo ? (
                  <img src={agreement.to_logo} alt="" style={{
                    width: 50, height: 50, borderRadius: '50%',
                    border: '2px solid #FFD2A1',
                  }} />
                ) : (
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'rgba(255,210,161,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFD2A1', fontSize: '1.2rem',
                  }}>
                    {agreement.to_name?.charAt(0) || 'م'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>الطرف الثاني</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff' }}>
                    {agreement.to_name_ar || agreement.to_name || `مؤسسة ${agreement.to_id}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#FFD2A1' }}>ID: {agreement.to_id}</div>
                </div>
              </div>
              {onInstitutionClick && (
                <button
                  onClick={() => onInstitutionClick(agreement.to_id)}
                  style={{
                    background: 'rgba(255,210,161,0.1)', border: '1px solid rgba(255,210,161,0.3)',
                    color: '#FFD2A1', padding: '8px', borderRadius: 6,
                    width: '100%', cursor: 'pointer', marginTop: 10,
                  }}
                >
                  عرض ملف المؤسسة
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        background: 'rgba(0,0,0,0.2)',
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
          color: '#999', padding: '8px 20px', borderRadius: 6,
          cursor: 'pointer', fontSize: '0.9rem',
        }}>
          إغلاق
        </button>
        <button style={{
          background: 'linear-gradient(135deg, #9BB0FF, #FFD2A1)',
          border: 'none', color: '#020205', padding: '8px 20px',
          borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          تحميل PDF
        </button>
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  educational: '#9BB0FF',
  research: '#FFD2A1',
  cultural: '#C9B1FF',
  exchange: '#A8E6CF',
  partnership: '#FFB3BA',
  commercial: '#FF9B4E',
};