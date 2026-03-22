'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Institution, Agreement } from '@/lib/types';
import { fetchInstitution, fetchInstitutionAgreements } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import AgreementDetails from '@/components/AgreementDetails';

// ============================================================
// الألوان الأساسية
// ============================================================
const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

// ============================================================
// Helper Functions
// ============================================================
const getTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    educational: 'تعليمية',
    research: 'بحثية',
    cultural: 'ثقافية',
    charitable: 'خيرية',
    media: 'إعلامية',
    developmental: 'تنموية',
  };
  return types[type] || type || 'عامة';
};

const getStatusColor = (status: string): string => {
  switch(status) {
    case 'active': return COLORS.softGreen;
    case 'pending': return '#FFC107';
    case 'completed': return COLORS.teal;
    default: return '#9E9E9E';
  }
};
// دالة لعرض حالة الشاشة
const getScreenStatus = (institution: Institution): { text: string; color: string; icon: string } => {
  if (institution.screen_active) {
    return {
      text: 'الشاشة نشطة',
      color: COLORS.softGreen,
      icon: '✨'
    };
  } else {
    return {
      text: 'الشاشة غير نشطة',
      color: '#9E9E9E',
      icon: '⚪'
    };
  }
};

// دالة لعرض حالة المؤسسة
const getInstitutionStatus = (institution: Institution): { text: string; color: string; icon: string } => {
  switch(institution.status) {
    case 'active':
      return {
        text: 'نشطة',
        color: COLORS.softGreen,
        icon: '🟢'
      };
    case 'inactive':
      return {
        text: 'غير نشطة',
        color: '#9E9E9E',
        icon: '⚪'
      };
    case 'pending':
      return {
        text: 'قيد الانتظار',
        color: '#FFC107',
        icon: '⏳'
      };
    default:
      return {
        text: 'غير معروف',
        color: '#9E9E9E',
        icon: '❓'
      };
  }
};

const getStatusText = (status: string): string => {
  switch(status) {
    case 'active': return 'نشط';
    case 'inactive': return 'غير نشط';
    case 'pending': return 'قيد الانتظار';
    case 'completed': return 'مكتمل';
    default: return 'غير معروف';
  }
};

// دالة مساعدة للحصول على الحرف الأول من الاسم بأمان
const getInitial = (institution: Institution): string => {
  if (institution.name_ar && institution.name_ar.length > 0) {
    return institution.name_ar.charAt(0);
  }
  if (institution.name && institution.name.length > 0) {
    return institution.name.charAt(0);
  }
  if (institution.name_en && institution.name_en.length > 0) {
    return institution.name_en.charAt(0);
  }
  return 'م';
};

// دالة لتنسيق التاريخ
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ============================================================
// Hero Section Component
// ============================================================
function HeroSection({ institution }: { institution: Institution }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal} 100%)`,
      padding: '60px 40px 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* خلفية زخرفية */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        opacity: 0.1,
        background: `
          radial-gradient(circle at 20% 30%, ${COLORS.lightMint} 0%, transparent 30%),
          radial-gradient(circle at 80% 70%, ${COLORS.softGreen} 0%, transparent 40%),
          repeating-linear-gradient(45deg, transparent 0px, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px)
        `,
      }} />

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* شريط التنقل العلوي */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30, flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: COLORS.darkNavy,
            textDecoration: 'none',
            padding: '10px 20px',
            background: COLORS.lightMint,
            borderRadius: 40,
            fontSize: '0.9rem',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.lightMint}`,
            fontWeight: 700,
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = COLORS.softGreen;
            e.currentTarget.style.borderColor = COLORS.softGreen;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = COLORS.lightMint;
            e.currentTarget.style.borderColor = COLORS.lightMint;
          }}
          >
            <span>✦</span>
            المجرة الحضارية
          </Link>

          <span style={{ color: `${COLORS.lightMint}80`, fontSize: '1rem' }}></span>

          <Link href="/institutions" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: COLORS.lightMint,
            textDecoration: 'none',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 40,
            fontSize: '0.9rem',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.lightMint}`,
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = COLORS.lightMint;
            e.currentTarget.style.color = COLORS.darkNavy;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = COLORS.lightMint;
          }}
          >
            <span>←</span>
            الذهاب إلى قائمة المؤسسات
          </Link>
        </div>

        {/* محتوى الهيرو */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          flexWrap: 'wrap',
        }}>
          {/* الشعار الكبير */}
          <div style={{
            width: 150,
            height: 150,
            borderRadius: 40,
            background: `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            fontWeight: 'bold',
            color: COLORS.darkNavy,
            boxShadow: `0 20px 40px ${COLORS.darkNavy}60`,
            border: `4px solid ${COLORS.lightMint}`,
          }}>
            {institution.logo_url ? (
              <Image 
                src={institution.logo_url} 
                alt={institution.name_ar || institution.name || 'مؤسسة'} 
                width={100} 
                height={100}
                style={{ borderRadius: 30, objectFit: 'cover' }}
              />
            ) : (
              getInitial(institution)
            )}
          </div>

          {/* المعلومات الأساسية */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: COLORS.lightMint,
              marginBottom: 10,
              textShadow: `3px 3px 0 ${COLORS.darkNavy}`,
            }}>
              {institution.name_ar || institution.name || institution.name_en || 'مؤسسة غير مسماة'}
            </h1>
            
            <div style={{
              display: 'flex',
              gap: 15,
              flexWrap: 'wrap',
              marginBottom: 15,
            }}>
              <span style={{
                background: COLORS.lightMint,
                color: COLORS.darkNavy,
                padding: '8px 20px',
                borderRadius: 40,
                fontSize: '0.9rem',
                fontWeight: 600,
              }}>
                {getTypeLabel(institution.type)}
              </span>
              
              {institution.is_verified && (
                <span style={{
                  background: COLORS.softGreen,
                  color: COLORS.darkNavy,
                  padding: '8px 20px',
                  borderRadius: 40,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <span>✓</span>
                  مؤسسة موثقة
                </span>
              )}
              
{/* حالة الشاشة */}
{(() => {
  const screenStatus = getScreenStatus(institution);
  return (
    <span style={{
      background: screenStatus.color + '20',
      color: screenStatus.color,
      padding: '8px 20px',
      borderRadius: 40,
      fontSize: '0.9rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      border: `1px solid ${screenStatus.color}`,
    }}>
      <span>{screenStatus.icon}</span>
      {screenStatus.text}
    </span>
  );
})()}

{/* حالة المؤسسة */}
{(() => {
  const instStatus = getInstitutionStatus(institution);
  return (
    <span style={{
      background: instStatus.color + '20',
      color: instStatus.color,
      padding: '8px 20px',
      borderRadius: 40,
      fontSize: '0.9rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      border: `1px solid ${instStatus.color}`,
    }}>
      <span>{instStatus.icon}</span>
      {instStatus.text}
    </span>
  );
})()}
            </div>

            {/* الموقع */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'white',
              fontSize: '1.1rem',
              marginBottom: 10,
            }}>
              <span>📍</span>
              <span>{institution.city || 'غير محدد'}، {institution.country || 'غير محدد'}</span>
            </div>

            {/* تاريخ الإنشاء */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: COLORS.lightMint,
              fontSize: '0.9rem',
              opacity: 0.8,
            }}>
              <span>📅</span>
              <span>تاريخ التسجيل: {formatDate(institution.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Info Card Component
// ============================================================
function InfoCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '20px',
      boxShadow: `0 5px 20px ${COLORS.darkNavy}20`,
      border: `1px solid ${COLORS.softGreen}40`,
      transition: 'transform 0.3s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = `0 10px 30px ${COLORS.darkNavy}30`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = `0 5px 20px ${COLORS.darkNavy}20`;
    }}
    >
      <div style={{
        fontSize: '2rem',
        marginBottom: 10,
      }}>{icon}</div>
      <div style={{
        fontSize: '0.8rem',
        color: COLORS.teal,
        marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontSize: '1.2rem',
        fontWeight: 700,
        color: COLORS.darkNavy,
      }}>{value}</div>
    </div>
  );
}

// ============================================================
// Stats Grid Component
// ============================================================
function StatsGrid({ institution }: { institution: Institution }) {
  return (
    <div style={{
      maxWidth: 1200,
      margin: '-40px auto 40px',
      padding: '0 20px',
      position: 'relative',
      zIndex: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 20,
    }}>
      <InfoCard icon="👥" label="عدد الموظفين" value={institution.employees_count?.toLocaleString() || 'غير محدد'} />
      <InfoCard icon="📊" label="المشاريع" value={institution.projects_count?.toLocaleString() || 'غير محدد'} />
      <InfoCard icon="🎯" label="المستفيدين" value={institution.beneficiaries_count?.toLocaleString() || 'غير محدد'} />
      <InfoCard icon="⭐" label="وزن التأثير" value={institution.weight?.toFixed(2) || 'غير محدد'} />
      <InfoCard icon="📅" label="تأسست عام" value={institution.founded_year || 'غير محدد'} />
    </div>
  );
}

// ============================================================
// Quick Actions Component
// ============================================================
function QuickActions({ institution }: { institution: Institution }) {
  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto 40px',
      padding: '0 20px',
      display: 'flex',
      gap: 15,
      flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      {institution.website && (
        <a href={institution.website} target="_blank" rel="noopener noreferrer" style={{
          background: COLORS.teal,
          color: 'white',
          padding: '12px 30px',
          borderRadius: 40,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = COLORS.darkNavy;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = COLORS.teal;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <span>🌐</span>
          الموقع الإلكتروني
        </a>
      )}
      
      {institution.email && (
        <a href={`mailto:${institution.email}`} style={{
          background: COLORS.softGreen,
          color: COLORS.darkNavy,
          padding: '12px 30px',
          borderRadius: 40,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = COLORS.lightMint;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = COLORS.softGreen;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <span>📧</span>
          {institution.email}
        </a>
      )}
      
      {institution.phone && (
        <a href={`tel:${institution.phone}`} style={{
          background: COLORS.lightMint,
          color: COLORS.darkNavy,
          padding: '12px 30px',
          borderRadius: 40,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = COLORS.softGreen;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = COLORS.lightMint;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <span>📞</span>
          {institution.phone}
        </a>
      )}
    </div>
  );
}

// ============================================================
// About Section Component
// ============================================================
function AboutSection({ institution }: { institution: Institution }) {
  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto 40px',
      padding: '40px',
      background: 'white',
      borderRadius: 30,
      boxShadow: `0 10px 40px ${COLORS.darkNavy}20`,
      border: `1px solid ${COLORS.softGreen}40`,
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        color: COLORS.darkNavy,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span>📋</span>
        عن المؤسسة
      </h2>
      
      <p style={{
        fontSize: '1.1rem',
        lineHeight: 1.8,
        color: '#444',
        marginBottom: 30,
      }}>
        {institution.description || `تأسست مؤسسة ${institution.name_ar || institution.name || institution.name_en || 'غير معروفة'} عام ${institution.founded_year || 'غير محدد'}، وهي مؤسسة ${getTypeLabel(institution.type)} تعمل في مجال تعزيز العمل الحضاري والتنمية المستدامة.`}
      </p>

      {/* معلومات إضافية */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
        marginTop: 30,
      }}>
        {institution.address && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: COLORS.teal,
          }}>
            <span>📍</span>
            <span>{institution.address}</span>
          </div>
        )}
        
        {institution.registration_number && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: COLORS.teal,
          }}>
            <span>📋</span>
            <span>رقم التسجيل: {institution.registration_number}</span>
          </div>
        )}
        
        {institution.social_media && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: COLORS.teal,
          }}>
            <span>📱</span>
            <a href={institution.social_media} target="_blank" rel="noopener noreferrer" style={{
              color: COLORS.teal,
              textDecoration: 'none',
            }}>
              منصات التواصل
            </a>
          </div>
        )}

        {institution.sub_type && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: COLORS.teal,
          }}>
            <span>🏷️</span>
            <span>نوع فرعي: {institution.sub_type}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Events Section Component
// ============================================================
function EventsSection({ events }: { events: any[] }) {
  if (!events || events.length === 0) return null;

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto 40px',
      padding: '40px',
      background: 'white',
      borderRadius: 30,
      boxShadow: `0 10px 40px ${COLORS.darkNavy}20`,
      border: `1px solid ${COLORS.softGreen}40`,
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        color: COLORS.darkNavy,
        marginBottom: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span>📅</span>
        الفعاليات ({events.length})
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {events.map(event => (
          <div key={event.id} style={{
            background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
            border: `1px solid ${COLORS.teal}`,
            borderRadius: 20,
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '1.1rem', color: COLORS.darkNavy, marginBottom: 10 }}>
              {event.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 10 }}>
              {event.description}
            </p>
            <div style={{ fontSize: '0.8rem', color: COLORS.teal }}>
              <div>📅 {formatDate(event.start_datetime)}</div>
              {event.location && <div>📍 {event.location}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// News Section Component
// ============================================================
function NewsSection({ news }: { news: any[] }) {
  if (!news || news.length === 0) return null;

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto 40px',
      padding: '40px',
      background: 'white',
      borderRadius: 30,
      boxShadow: `0 10px 40px ${COLORS.darkNavy}20`,
      border: `1px solid ${COLORS.softGreen}40`,
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        color: COLORS.darkNavy,
        marginBottom: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span>📰</span>
        الأخبار ({news.length})
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {news.map(item => (
          <div key={item.id} style={{
            background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
            border: `1px solid ${COLORS.softGreen}`,
            borderRadius: 20,
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '1.1rem', color: COLORS.darkNavy, marginBottom: 10 }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 10 }}>
              {item.content?.substring(0, 100)}...
            </p>
            <div style={{ fontSize: '0.8rem', color: COLORS.softGreen }}>
              {formatDate(item.published_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Agreements Section Component
// ============================================================
function AgreementsSection({ 
  agreements, 
  onViewAgreement 
}: { 
  agreements?: Agreement[];
  onViewAgreement: (id: string) => void;
}) {
  if (!agreements || agreements.length === 0) {
    return (
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 40px',
        padding: '60px',
        background: 'white',
        borderRadius: 30,
        boxShadow: `0 10px 40px ${COLORS.darkNavy}20`,
        border: `1px solid ${COLORS.softGreen}40`,
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>🔗</span>
        <h3 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>لا توجد اتفاقيات حالياً</h3>
        <p style={{ color: COLORS.teal }}>هذه المؤسسة ليس لديها اتفاقيات نشطة في الوقت الحالي</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto 40px',
      padding: '40px',
      background: 'white',
      borderRadius: 30,
      boxShadow: `0 10px 40px ${COLORS.darkNavy}20`,
      border: `1px solid ${COLORS.softGreen}40`,
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        color: COLORS.darkNavy,
        marginBottom: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span>🔗</span>
        الاتفاقيات ({agreements.length})
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: 20,
      }}>
        {agreements.map(agreement => (
          <button
            key={agreement.id}
            onClick={() => onViewAgreement(agreement.id.toString())}
            style={{
              background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
              border: `1px solid ${getStatusColor(agreement.status)}`,
              borderRadius: 20,
              padding: '20px',
              cursor: 'pointer',
              textAlign: 'right',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 10px 30px ${COLORS.darkNavy}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* شريط جانبي للحالة */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '5px',
              background: getStatusColor(agreement.status),
            }} />

            <div style={{ marginRight: 10 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 15,
              }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: getStatusColor(agreement.status),
                }} />
                <span style={{
                  color: getStatusColor(agreement.status),
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  {getStatusText(agreement.status)}
                </span>
              </div>

              <h3 style={{
                fontSize: '1.1rem',
                color: COLORS.darkNavy,
                marginBottom: 10,
              }}>
                {agreement.title || `اتفاقية ${agreement.type || 'عامة'}`}
              </h3>

              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: 15,
                lineHeight: 1.6,
              }}>
                {agreement.description || 'اتفاقية تعاون بين المؤسستين في المجال الثقافي والتعليمي.'}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: COLORS.teal,
              }}>
                <span>
                  {agreement.from_name_ar || agreement.from_name} ← {agreement.to_name_ar || agreement.to_name}
                </span>
                {agreement.signed_date && (
                  <span>{formatDate(agreement.signed_date)}</span>
                )}
              </div>

              {agreement.strength && (
                <div style={{
                  display: 'flex',
                  gap: 5,
                  marginTop: 10,
                }}>
                  {[1, 2, 3].map(i => (
                    <span key={i} style={{
                      color: i <= agreement.strength! ? '#FFD700' : '#ddd',
                      fontSize: '1.2rem',
                    }}>★</span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Screen Password Section Component
// ============================================================
function ScreenPasswordSection({ institution, currentUser }: { institution: Institution; currentUser: any }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!institution.screen_password) return null;

  const isOwner = currentUser?.institution_id === institution.id;
  const isAdmin = currentUser?.role === 'admin';
  if (!isOwner && !isAdmin) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(institution.screen_password!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto 40px',
      padding: '40px',
      background: `linear-gradient(135deg, ${COLORS.darkNavy}08, white)`,
      borderRadius: 30,
      boxShadow: `0 10px 40px ${COLORS.darkNavy}20`,
      border: `2px solid ${COLORS.teal}40`,
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        color: COLORS.darkNavy,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span>📺</span>
        الشاشة الحضارية
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {/* كلمة مرور الشاشة */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px',
          border: `1px solid ${COLORS.teal}40`,
          boxShadow: `0 4px 15px ${COLORS.darkNavy}10`,
        }}>
          <div style={{ fontSize: '0.8rem', color: COLORS.teal, marginBottom: 8, fontWeight: 600 }}>
            🔑 كلمة مرور الشاشة
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{
              flex: 1,
              background: `${COLORS.darkNavy}08`,
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: '1.1rem',
              fontFamily: 'monospace',
              color: COLORS.darkNavy,
              letterSpacing: show ? '0.1em' : '0.3em',
              userSelect: show ? 'text' : 'none',
            }}>
              {show ? institution.screen_password : '••••••••'}
            </code>
            <button
              onClick={() => setShow(!show)}
              title={show ? 'إخفاء' : 'إظهار'}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1px solid ${COLORS.teal}40`,
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0,
              }}
            >
              {show ? '🙈' : '👁️'}
            </button>
            <button
              onClick={handleCopy}
              title="نسخ"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1px solid ${COLORS.softGreen}40`,
                background: copied ? `${COLORS.softGreen}20` : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </div>

        {/* بيانات الدخول للشاشة */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px',
          border: `1px solid ${COLORS.softGreen}40`,
          boxShadow: `0 4px 15px ${COLORS.darkNavy}10`,
        }}>
          <div style={{ fontSize: '0.8rem', color: COLORS.teal, marginBottom: 8, fontWeight: 600 }}>
            📊 حالة الشاشة
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: institution.screen_active ? COLORS.softGreen : '#9E9E9E',
              boxShadow: institution.screen_active ? `0 0 8px ${COLORS.softGreen}` : 'none',
            }} />
            <span style={{
              fontWeight: 600,
              color: institution.screen_active ? COLORS.softGreen : '#9E9E9E',
            }}>
              {institution.screen_active ? 'الشاشة نشطة الآن' : 'الشاشة غير نشطة'}
            </span>
          </div>
          {institution.screen_last_active && (
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              آخر نشاط: {new Date(institution.screen_last_active).toLocaleString('ar-EG')}
            </div>
          )}
        </div>

        {/* رابط الشاشة */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`,
          borderRadius: 20,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: '0.85rem', color: COLORS.lightMint, fontWeight: 600 }}>
            🔗 فتح الشاشة
          </div>
          <a
            href={`/screen/${institution.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: COLORS.lightMint,
              color: COLORS.darkNavy,
              padding: '10px 20px',
              borderRadius: 30,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.softGreen; }}
            onMouseLeave={e => { e.currentTarget.style.background = COLORS.lightMint; }}
          >
            📺 عرض الشاشة
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sidebar Navigation Component
// ============================================================
function SidebarNav({ institutionId, isOwner, isAdmin }: { institutionId: string; isOwner: boolean; isAdmin: boolean }) {
  const navItems = [
    { href: '#about',        icon: '🏛️', label: 'عن المؤسسة' },
    { href: '#agreements',   icon: '🔗', label: 'الاتفاقيات' },
    { href: '#events',       icon: '📅', label: 'الفعاليات' },
    { href: '#news',         icon: '📰', label: 'الأخبار' },
    ...(isOwner || isAdmin ? [{ href: '#screen', icon: '📺', label: 'الشاشة الحضارية' }] : []),
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: 22,
      padding: '20px 14px',
      boxShadow: `0 5px 24px ${COLORS.darkNavy}18`,
      border: `1px solid ${COLORS.softGreen}40`,
    }}>
      <div style={{ fontSize: '0.72rem', color: COLORS.teal, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14, padding: '0 6px', textTransform: 'uppercase' }}>
        القائمة
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
              color: COLORS.darkNavy, fontSize: '0.9rem', fontWeight: 500,
              transition: 'all 0.2s', border: '1px solid transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${COLORS.teal}12`;
              e.currentTarget.style.borderColor = `${COLORS.teal}30`;
              e.currentTarget.style.color = COLORS.teal;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = COLORS.darkNavy;
            }}
          >
            <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {(isOwner || isAdmin) && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${COLORS.softGreen}60`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link
            href={`/institutions/${institutionId}/agreements`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 14, textDecoration: 'none',
              background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`,
              color: 'white', fontSize: '0.88rem', fontWeight: 700,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.87'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <span style={{ fontSize: '1rem' }}>⚙️</span>
            <span>إدارة الاتفاقيات</span>
          </Link>
          <Link
            href={`/institutions/${institutionId}/employees`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 14, textDecoration: 'none',
              background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})`,
              color: 'white', fontSize: '0.88rem', fontWeight: 700,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.87'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <span style={{ fontSize: '1rem' }}>👥</span>
            <span>إدارة الموظفين</span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function InstitutionPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        const instData = await fetchInstitution(id);
        
        setInstitution(instData);
        setAgreements((instData as any).agreements || []);
      } catch (error: any) {
        console.error('Error loading institution:', error);
        setError(error.message || 'حدث خطأ في تحميل بيانات المؤسسة');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleViewAgreement = (agreementId: string) => {
    setSelectedAgreementId(agreementId);
  };

  // شاشة التحميل
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint} 0%, white 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 80,
            height: 80,
            border: `5px solid ${COLORS.teal}`,
            borderTopColor: COLORS.softGreen,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 20,
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h2 style={{ color: COLORS.darkNavy }}>جاري تحميل بيانات المؤسسة...</h2>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint} 0%, white 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          borderRadius: 30,
          boxShadow: `0 20px 40px ${COLORS.darkNavy}30`,
        }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>⚠️</span>
          <h2 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>خطأ في التحميل</h2>
          <p style={{ color: COLORS.teal, marginBottom: 30 }}>{error}</p>
          <Link href="/institutions" style={{
            background: COLORS.teal,
            color: 'white',
            padding: '12px 30px',
            borderRadius: 40,
            textDecoration: 'none',
            display: 'inline-block',
            fontWeight: 600,
          }}>
            العودة إلى القائمة
          </Link>
        </div>
      </div>
    );
  }

  // إذا لم يتم العثور على المؤسسة
  if (!institution) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint} 0%, white 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          borderRadius: 30,
          boxShadow: `0 20px 40px ${COLORS.darkNavy}30`,
        }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>🔍</span>
          <h2 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>المؤسسة غير موجودة</h2>
          <p style={{ color: COLORS.teal, marginBottom: 30 }}>لم نتمكن من العثور على المؤسسة المطلوبة</p>
          <Link href="/institutions" style={{
            background: COLORS.teal,
            color: 'white',
            padding: '12px 30px',
            borderRadius: 40,
            textDecoration: 'none',
            display: 'inline-block',
            fontWeight: 600,
          }}>
            العودة إلى القائمة
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.institution_id === institution.id;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightMint}20 0%, white 100%)`,
      direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* قسم الهيرو */}
      <HeroSection institution={institution} />

      {/* بطاقات الإحصائيات */}
      <StatsGrid institution={institution} />

      {/* التخطيط الرئيسي: شريط جانبي + محتوى */}
      <div style={{
        maxWidth: 1260,
        margin: '0 auto',
        padding: '0 20px 40px',
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
      }}>
        {/* ── الشريط الجانبي ── */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 24, height: 'fit-content' }}>
          <SidebarNav institutionId={id} isOwner={isOwner} isAdmin={isAdmin} />
        </div>

        {/* ── المحتوى الرئيسي ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* الأزرار السريعة */}
          <QuickActions institution={institution} />

          {/* عن المؤسسة */}
          <div id="about">
            <AboutSection institution={institution} />
          </div>

          {/* الشاشة الحضارية - للمسؤول أو صاحب المؤسسة */}
          <div id="screen">
            <ScreenPasswordSection institution={institution} currentUser={currentUser} />
          </div>

          {/* الاتفاقيات */}
          <div id="agreements">
            <AgreementsSection
              agreements={agreements}
              onViewAgreement={handleViewAgreement}
            />
          </div>

          {/* الفعاليات */}
          {(institution as any).events && (institution as any).events.length > 0 && (
            <div id="events">
              <EventsSection events={(institution as any).events} />
            </div>
          )}

          {/* الأخبار */}
          {(institution as any).news && (institution as any).news.length > 0 && (
            <div id="news">
              <NewsSection news={(institution as any).news} />
            </div>
          )}
        </div>
      </div>

      {/* نافذة تفاصيل الاتفاقية */}
      {selectedAgreementId && (
        <AgreementDetails
          agreementId={selectedAgreementId}
          onClose={() => setSelectedAgreementId(null)}
        />
      )}

      {/* فوتر */}
      <footer style={{
        background: COLORS.darkNavy,
        color: 'white',
        padding: '30px',
        textAlign: 'center',
      }}>
        <p style={{ opacity: 0.8 }}>© 2026 المجرة الحضارية - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}