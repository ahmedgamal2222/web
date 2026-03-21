'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useMemo } from 'react';
import { GalaxyData, GalaxyStar, Agreement } from '@/lib/types';
import { fetchGalaxyData, fetchInstitutionAgreements } from '@/lib/api';
import AgreementDetails from '@/components/AgreementDetails';
import Image from 'next/image';
import Link from 'next/link';

const GalaxyCanvas = dynamic(() => import('@/components/GalaxyCanvas'), { ssr: false });

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
// Type Labels and Colors
// ============================================================
const TYPE_LABELS: Record<string, string> = {
  educational: 'تعليمية',
  research: 'بحثية',
  cultural: 'ثقافية',
  charitable: 'خيرية',
  media: 'إعلامية',
  developmental: 'تنموية',
  default: 'عامة',
};

const TYPE_COLORS: Record<string, string> = {
  educational: COLORS.lightMint,
  research: COLORS.softGreen,
  cultural: COLORS.teal,
  charitable: COLORS.darkNavy,
  media: '#FFB3BA',
  developmental: '#FFDAC1',
  default: COLORS.teal,
};

// ============================================================
// Logo Component
// ============================================================
function GalaxyLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={COLORS.lightMint} />
              <stop offset="50%" stopColor={COLORS.softGreen} />
              <stop offset="100%" stopColor={COLORS.teal} />
            </linearGradient>
          </defs>
          <circle cx="22" cy="22" r="20" stroke="url(#starGradient)" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path 
            d="M22 4 L24.5 14.5 L35 17 L27 24 L29.5 35 L22 28.5 L14.5 35 L17 24 L9 17 L19.5 14.5 Z" 
            fill="url(#starGradient)" 
          />
        </svg>
      </div>
      <div>
        <div style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          background: `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen}, ${COLORS.teal})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}>
          المجرة الحضارية
        </div>
        <div style={{ 
          fontSize: '0.7rem', 
          color: '#666', 
          letterSpacing: '0.08em', 
          marginTop: 2,
        }}>
          CIVILIZATION GALAXY
        </div>
      </div>
    </div>
  );
}

// ============================================================
// User Menu Component
// ============================================================
function UserMenu({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px 6px 6px',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${COLORS.teal}`,
          borderRadius: 40,
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: COLORS.teal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.9rem',
        }}>
          {(user.name_ar || user.name).charAt(0)}
        </div>
        <span style={{ color: '#fff', fontSize: '0.9rem' }}>
          {user.name_ar || user.name}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: COLORS.teal }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 8,
          width: 200,
          background: 'rgba(8,10,20,0.98)',
          border: `1px solid ${COLORS.teal}`,
          borderRadius: 12,
          overflow: 'hidden',
          zIndex: 50,
          backdropFilter: 'blur(10px)',
        }}>
          {/* {user.role === 'admin' && (
            <Link href="/admin" style={dropdownItemStyle}>
              <span>📊</span> لوحة التحكم
            </Link>
          )} */}
          
          {user.role === 'institution_admin' && (
            <Link href={`/institutions/${user.institution_id}`} style={dropdownItemStyle}>
              <span>🏛️</span> مؤسستي
            </Link>
          )}
          
          {/* {(user.role === 'employee' || user.role === 'institution_admin') && (
            <Link href={`/screen/${user.institution_id}`} style={dropdownItemStyle}>
              <span>📺</span> إدارة الشاشة
            </Link>
          )}
          
          <Link href="/services" style={dropdownItemStyle}>
            <span>🛠️</span> الخدمات
          </Link>
          
          <Link href="/services/requests" style={dropdownItemStyle}>
            <span>📋</span> طلباتي
          </Link>
          
          <Link href="/news" style={dropdownItemStyle}>
            <span>📰</span> الأخبار
          </Link> */}
          
          <Link href="/profile" style={dropdownItemStyle}>
            <span>👤</span> الملف الشخصي
          </Link>
          
          <div style={{ height: 1, background: `${COLORS.teal}20`, margin: '4px 0' }} />
          
          <button
            onClick={onLogout}
            style={{
              ...dropdownItemStyle,
              width: '100%',
              textAlign: 'right',
              border: 'none',
              background: 'transparent',
              color: '#ff5050',
              cursor: 'pointer',
            }}
          >
            <span>🚪</span> تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  color: '#ddd',
  textDecoration: 'none',
  fontSize: '0.9rem',
  transition: 'all 0.2s',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box' as const,
};

// ============================================================
// Top Navigation Bar
// ============================================================
function TopBar({
  starCount,
  onToggleList,
  listOpen,
  user,
  onLogout,
}: {
  starCount: number;
  onToggleList: () => void;
  listOpen: boolean;
  user: any;
  onLogout: () => void;
}) {
  return (
    <header style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      height: 72,
      background: 'linear-gradient(180deg, rgba(2,2,5,0.95) 0%, rgba(2,2,5,0.7) 50%, rgba(2,2,5,0) 100%)',
      backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${COLORS.teal}40`,
    }}>
      <GalaxyLogo />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* روابط سريعة */}
       

        {/* Institutions toggle */}
        <button
          onClick={onToggleList}
          aria-pressed={listOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px',
            background: listOpen 
              ? `linear-gradient(135deg, ${COLORS.teal}40, ${COLORS.softGreen}20)` 
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${listOpen ? COLORS.teal : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 40,
            color: listOpen ? COLORS.teal : '#ddd',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>المؤسسات</span>
          <span style={{
            background: listOpen ? COLORS.teal : 'rgba(255,255,255,0.1)',
            color: listOpen ? COLORS.darkNavy : '#ddd',
            padding: '2px 8px',
            borderRadius: 20,
            fontSize: '0.75rem',
          }}>
            {starCount}
          </span>
        </button>

        {user ? (
          <UserMenu user={user} onLogout={onLogout} />
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/login"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 20px',
                background: `linear-gradient(135deg, ${COLORS.teal}20, ${COLORS.softGreen}20)`,
                border: `1px solid ${COLORS.teal}`,
                borderRadius: 40,
                color: '#fff',
                fontSize: '0.9rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>🔐</span>
              دخول
            </Link>
            
            <Link
              href="/register"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 20px',
                background: COLORS.softGreen,
                border: 'none',
                borderRadius: 40,
                color: COLORS.darkNavy,
                fontSize: '0.9rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>✨</span>
              تسجيل
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================
// Quick Actions Panel (للمستخدمين المسجلين)
// ============================================================
function QuickActions({ user }: { user: any }) {
  const actions = [];

  if (user.role === 'admin') {
    actions.push(
      { icon: '📊', label: 'لوحة التحكم', href: '/admin', color: COLORS.teal },
      { icon: '📝', label: 'طلبات المؤسسات', href: '/admin/requests', color: '#FFC107' },
      { icon: '📺', label: 'إدارة الشاشات', href: '/admin/screens', color: COLORS.softGreen },
    );
  }

  if (user.role === 'institution_admin') {
    actions.push(
      { icon: '🏛️', label: 'مؤسستي', href: `/institutions/${user.institution_id}`, color: COLORS.teal },
      { icon: '📺', label: 'الشاشة', href: `/screen/${user.institution_id}`, color: COLORS.softGreen },
      { icon: '👥', label: 'إدارة الموظفين', href: `/institutions/${user.institution_id}/employees`, color: '#4CAF50' },
    );
  }

  if (user.role === 'employee') {
    actions.push(
      { icon: '🏛️', label: 'مؤسستي', href: `/institutions/${user.institution_id}`, color: COLORS.teal },
      { icon: '📺', label: 'الشاشة', href: `/screen/${user.institution_id}`, color: COLORS.softGreen },
    );
  }

  // إجراءات مشتركة للجميع
  actions.push(
    { icon: '🛠️', label: 'الخدمات', href: '/services', color: '#FF9B4E' },
    { icon: '📋', label: 'طلباتي', href: '/services/requests', color: '#9C27B0' },
    { icon: '📰', label: 'الأخبار', href: '/news', color: '#E91E63' },
  );

  if (user.role === 'explorer' || !user.institution_id) {
    actions.push(
      { icon: '✨', label: 'طلب إنشاء مؤسسة', href: '/institution-request', color: '#FFD700' },
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 90,
      right: 28,
      zIndex: 39,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxWidth: 200,
    }}>
      {actions.map((action, index) => (
        <Link
          key={index}
          href={action.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            background: 'rgba(8,10,20,0.9)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${action.color}`,
            borderRadius: 40,
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'all 0.3s',
            boxShadow: `0 4px 12px ${action.color}20`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = action.color;
            e.currentTarget.style.color = COLORS.darkNavy;
            e.currentTarget.style.transform = 'translateX(-5px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(8,10,20,0.9)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{action.icon}</span>
          <span>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ============================================================
// Stats Bar
// ============================================================
function StatsBar({ data }: { data: GalaxyData }) {
  const activeInstitutions = data.stars.filter(s => s.is_active === true).length;
  
  const stats = [
    { label: 'المؤسسات', value: data.stars.length, color: COLORS.teal, icon: '🏛️' },
    { label: 'شاشات نشطة', value: data.stats?.active_screens ?? 0, color: COLORS.softGreen, icon: '✨' },
    { label: 'مؤسسات نشطة', value: activeInstitutions, color: '#4CAF50', icon: '🟢' },
    { label: 'اتفاقيات', value: data.stats?.total_connections ?? 0, color: '#FF9B4E', icon: '🔗' },
  ];
  
  return (
    <div style={{
      position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
      zIndex: 40, display: 'flex', gap: 2,
      background: 'rgba(6, 8, 18, 0.8)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${COLORS.teal}40`,
      borderRadius: 60,
      padding: '4px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          padding: '10px 28px',
          textAlign: 'center',
          background: i === 0 ? `${COLORS.teal}20` : 'transparent',
          borderRadius: 60,
          borderRight: i < stats.length - 1 ? `1px solid ${COLORS.teal}30` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// دالة مساعدة للحصول على لون حالة الاتفاقية
// ============================================================
const getStatusColor = (status: string): string => {
  switch(status) {
    case 'active': return COLORS.softGreen;
    case 'pending': return '#FFC107';
    case 'completed': return COLORS.teal;
    default: return '#9E9E9E';
  }
};

// ============================================================
// Institution Agreements Component
// ============================================================
function InstitutionAgreements({ 
  agreements, 
  onViewAgreement 
}: { 
  agreements?: Agreement[];
  onViewAgreement: (id: string) => void;
}) {
  if (!agreements || agreements.length === 0) {
    return (
      <div style={{ 
        padding: 30, 
        textAlign: 'center', 
        color: '#666',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        border: `1px dashed ${COLORS.teal}`,
      }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }}>📝</span>
        لا توجد اتفاقيات لهذه المؤسسة
      </div>
    );
  }

  // تجميع الاتفاقيات حسب النوع
  const agreementsByType = agreements.reduce((acc, agreement) => {
    const type = agreement.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(agreement);
    return acc;
  }, {} as Record<string, Agreement[]>);

  return (
    <div style={{ marginTop: 15 }}>
      <h4 style={{ 
        color: COLORS.teal, 
        marginBottom: 15, 
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span>🔗</span>
        جميع الاتفاقيات ({agreements.length})
      </h4>

      {/* عرض إحصائيات سريعة للاتفاقيات */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 20,
        padding: '10px',
        background: `${COLORS.teal}10`,
        borderRadius: 12,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>الإجمالي</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.teal }}>{agreements.length}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>النشطة</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.softGreen }}>
            {agreements.filter(a => a.status === 'active').length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>المكتملة</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFC107' }}>
            {agreements.filter(a => a.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* عرض الاتفاقيات مجمعة حسب النوع */}
      {Object.entries(agreementsByType).map(([type, typeAgreements]) => (
        <div key={type} style={{ marginBottom: 20 }}>
          <h5 style={{
            color: TYPE_COLORS[type] || COLORS.teal,
            fontSize: '0.85rem',
            marginBottom: 10,
            paddingRight: 8,
            borderRight: `3px solid ${TYPE_COLORS[type] || COLORS.teal}`,
          }}>
            {TYPE_LABELS[type] || type} ({typeAgreements.length})
          </h5>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {typeAgreements.map(agreement => (
              <button
                key={agreement.id}
                onClick={() => onViewAgreement(agreement.id.toString())}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 15px',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${getStatusColor(agreement.status)}40`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'right',
                  transition: 'all 0.3s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${COLORS.teal}10`;
                  e.currentTarget.style.borderColor = getStatusColor(agreement.status);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = `${getStatusColor(agreement.status)}40`;
                }}
              >
                {/* شريط جانبي حسب الحالة */}
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: getStatusColor(agreement.status),
                  borderRadius: '0 4px 4px 0',
                }} />
                
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {agreement.title || `اتفاقية ${TYPE_LABELS[agreement.type] || agreement.type}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: COLORS.lightMint }}>{agreement.from_name_ar || agreement.from_name}</span>
                    <span style={{ color: COLORS.teal }}>←</span>
                    <span style={{ color: COLORS.softGreen }}>{agreement.to_name_ar || agreement.to_name}</span>
                  </div>
                  
                  {/* تاريخ التوقيع إذا وجد */}
                  {agreement.signed_date && (
                    <div style={{ fontSize: '0.65rem', color: '#666', marginTop: 4 }}>
                      📅 {new Date(agreement.signed_date).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </div>

                {/* قوة الاتفاقية */}
                {agreement.strength && (
                  <div style={{ 
                    display: 'flex', 
                    gap: 2,
                    background: 'rgba(0,0,0,0.3)',
                    padding: '4px 8px',
                    borderRadius: 20,
                  }}>
                    {[1, 2, 3].map(i => (
                      <span key={i} style={{
                        color: i <= agreement.strength! ? '#FFD700' : '#333',
                        fontSize: '0.8rem',
                      }}>★</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// مكون مساعد لعرض حالة (نشط/غير نشط)
// ============================================================
function StatusBadge({ 
  active, 
  activeText, 
  inactiveText, 
  activeColor 
}: { 
  active: boolean; 
  activeText: string; 
  inactiveText: string; 
  activeColor: string;
}) {
  if (active) {
    return (
      <span style={{
        background: `${activeColor}20`,
        color: activeColor,
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: '0.7rem',
      }}>
        {activeText}
      </span>
    );
  }
  
  return (
    <span style={{
      background: '#9E9E9E20',
      color: '#9E9E9E',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: '0.7rem',
    }}>
      {inactiveText}
    </span>
  );
}

// ============================================================
// Institutions Panel
// ============================================================
function InstitutionsPanel({
  stars,
  open,
  onClose,
  onSelect,
  onViewAgreement,
}: {
  stars: GalaxyStar[];
  open: boolean;
  onClose: () => void;
  onSelect: (star: GalaxyStar) => void;
  onViewAgreement: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string>('all');
  const [screenFilter, setScreenFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStar, setSelectedStar] = useState<GalaxyStar | null>(null);
  const [showAgreements, setShowAgreements] = useState(false);
  const [loadingAgreements, setLoadingAgreements] = useState(false);

  const types = useMemo(() => {
    const s = new Set(stars.map(s => s.type));
    return ['all', ...Array.from(s)];
  }, [stars]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stars.filter(s => {
      const matchType = activeType === 'all' || s.type === activeType;
      const matchScreen = screenFilter === 'all' || 
                         (screenFilter === 'active' && s.screen_active) ||
                         (screenFilter === 'inactive' && !s.screen_active);
      const matchSearch = !q
        || (s.name_ar || s.name).toLowerCase().includes(q)
        || (s.country || '').toLowerCase().includes(q);
      return matchType && matchSearch && matchScreen;
    });
  }, [stars, search, activeType, screenFilter]);

  const handleStarClick = async (star: GalaxyStar) => {
    if (showAgreements && selectedStar?.id === star.id) {
      setShowAgreements(false);
      setSelectedStar(null);
    } else {
      setSelectedStar(star);
      setShowAgreements(true);
      
      // تحميل الاتفاقيات إذا لم تكن موجودة
      if (!star.agreements || star.agreements.length === 0) {
        setLoadingAgreements(true);
        try {
          const response = await fetchInstitutionAgreements(star.id);
          // تحديث بيانات النجمة بالاتفاقيات الجديدة
          star.agreements = response.data;
          // تحديث الحالة لإعادة الرسم
          setSelectedStar({...star});
        } catch (error) {
          console.error('فشل تحميل الاتفاقيات:', error);
        } finally {
          setLoadingAgreements(false);
        }
      }
    }
  };

  // دالة للحصول على العدد الإجمالي للاتفاقيات النشطة
  const getActiveAgreementsCount = (star: GalaxyStar) => {
    return star.agreements?.filter(a => a.status === 'active').length || 0;
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 45,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 46,
        width: 500,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        background: 'rgba(8, 10, 20, 0.98)',
        borderLeft: `1px solid ${COLORS.teal}`,
        display: 'flex', flexDirection: 'column',
        direction: 'rtl',
        boxShadow: '-5px 0 30px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${COLORS.teal}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${COLORS.teal}10, transparent)`,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
              {showAgreements && selectedStar ? 
                `اتفاقيات ${selectedStar.name_ar || selectedStar.name}` : 
                'جميع المؤسسات'
              }
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
              {showAgreements && selectedStar ? 
                `${selectedStar.agreements?.length || 0} اتفاقية` : 
                `${filtered.length} من أصل ${stars.length} مؤسسة`
              }
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {showAgreements && selectedStar && (
              <button 
                onClick={() => {
                  setShowAgreements(false);
                  setSelectedStar(null);
                }} 
                style={{
                  background: `${COLORS.teal}20`,
                  border: `1px solid ${COLORS.teal}`,
                  borderRadius: 30,
                  color: COLORS.teal,
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = COLORS.teal;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${COLORS.teal}20`;
                  e.currentTarget.style.color = COLORS.teal;
                }}
              >
                <span>←</span>
                العودة للقائمة
              </button>
            )}
            <button 
              onClick={onClose} 
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '50%',
                color: '#999',
                width: 32, height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ff505020';
                e.currentTarget.style.color = '#ff5050';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#999';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {showAgreements && selectedStar ? (
          // عرض اتفاقيات المؤسسة المحددة مع مؤشر التحميل
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            {loadingAgreements ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 40,
                background: `${COLORS.teal}10`,
                borderRadius: 16,
              }}>
                <div style={{
                  width: 40, height: 40,
                  border: `3px solid ${COLORS.teal}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px',
                }} />
                <p style={{ color: '#888' }}>جاري تحميل الاتفاقيات...</p>
              </div>
            ) : (
              <InstitutionAgreements 
                agreements={selectedStar.agreements} 
                onViewAgreement={onViewAgreement}
              />
            )}
          </div>
        ) : (
          // عرض قائمة المؤسسات
          <>
            {/* Search */}
            <div style={{ padding: '16px 20px 12px' }}>
              <input
                type="search"
                placeholder="🔍 بحث باسم المؤسسة أو البلد..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${COLORS.teal}`,
                  borderRadius: 30,
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.softGreen;
                  e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.softGreen}`;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.teal;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ padding: '0 20px 16px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setScreenFilter('all')}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 30,
                    border: `1px solid ${screenFilter === 'all' ? COLORS.teal : 'rgba(255,255,255,0.1)'}`,
                    background: screenFilter === 'all' ? `${COLORS.teal}20` : 'transparent',
                    color: screenFilter === 'all' ? COLORS.teal : '#888',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  الكل
                </button>
                <button
                  onClick={() => setScreenFilter('active')}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 30,
                    border: `1px solid ${screenFilter === 'active' ? COLORS.softGreen : 'rgba(255,255,255,0.1)'}`,
                    background: screenFilter === 'active' ? `${COLORS.softGreen}20` : 'transparent',
                    color: screenFilter === 'active' ? COLORS.softGreen : '#888',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ✨ شاشة نشطة
                </button>
                <button
                  onClick={() => setScreenFilter('inactive')}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 30,
                    border: `1px solid ${screenFilter === 'inactive' ? '#9E9E9E' : 'rgba(255,255,255,0.1)'}`,
                    background: screenFilter === 'inactive' ? '#9E9E9E20' : 'transparent',
                    color: screenFilter === 'inactive' ? '#9E9E9E' : '#888',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ⚪ غير نشطة
                </button>
              </div>

              {/* Type filter chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {types.map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 30,
                      fontSize: '0.75rem',
                      border: `1px solid ${activeType === t ? (TYPE_COLORS[t] || COLORS.teal) : 'rgba(255,255,255,0.1)'}`,
                      background: activeType === t ? `${TYPE_COLORS[t] || COLORS.teal}20` : 'transparent',
                      color: activeType === t ? (TYPE_COLORS[t] || COLORS.teal) : '#888',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t === 'all' ? 'الكل' : (TYPE_LABELS[t] || t)}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
              {filtered.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#666', 
                  padding: '60px 20px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 12,
                  border: `1px dashed ${COLORS.teal}`,
                }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: 15 }}>🌌</span>
                  لا توجد نتائج للبحث
                </div>
              )}
              {filtered.map(star => (
                <button
                  key={star.id}
                  onClick={() => handleStarClick(star)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', textAlign: 'right', padding: '12px 15px',
                    marginBottom: 8, borderRadius: 12,
                    cursor: 'pointer',
                    background: selectedStar?.id === star.id 
                      ? `${COLORS.teal}20` 
                      : 'rgba(255,255,255,0.02)',
                    border: star.screen_active 
                      ? `1px solid ${COLORS.softGreen}` 
                      : `1px solid ${COLORS.teal}20`,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (selectedStar?.id !== star.id) {
                      e.currentTarget.style.background = `${COLORS.teal}10`;
                    }
                    e.currentTarget.style.transform = 'translateX(-2px)';
                  }}
                  onMouseLeave={e => {
                    if (selectedStar?.id !== star.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* أيقونة المؤسسة مع عداد الاتفاقيات */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 45, height: 45, borderRadius: '50%',
                      background: `radial-gradient(circle at 30% 30%, ${star.color || COLORS.teal}, ${COLORS.darkNavy})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '1.2rem',
                      boxShadow: `0 0 15px ${star.color || COLORS.teal}`,
                    }}>
                      {(star.name_ar || star.name).charAt(0)}
                    </div>
                    
                    {/* عداد الاتفاقيات الصغير على الأيقونة */}
                    {star.agreements && star.agreements.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: -2,
                        left: -2,
                        background: COLORS.teal,
                        color: '#fff',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${COLORS.darkNavy}`,
                      }}>
                        {star.agreements.length}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.95rem',
                      color: star.screen_active ? COLORS.softGreen : '#fff',
                      marginBottom: 4,
                    }}>
                      {star.name_ar || star.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      {star.city}، {star.country}
                    </div>
                    
                    {/* عرض حالة الشاشة والمؤسسة وعدد الاتفاقيات النشطة */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {/* حالة الشاشة */}
                      <StatusBadge
                        active={star.screen_active}
                        activeText="✨ شاشة نشطة"
                        inactiveText="⚪ شاشة غير نشطة"
                        activeColor={COLORS.softGreen}
                      />

                      {/* حالة المؤسسة */}
                      <StatusBadge
                        active={star.is_active || false}
                        activeText="🟢 مؤسسة نشطة"
                        inactiveText="⚪ مؤسسة غير نشطة"
                        activeColor={COLORS.softGreen}
                      />

                      {/* عدد الاتفاقيات النشطة */}
                      {getActiveAgreementsCount(star) > 0 && (
                        <span style={{
                          background: `${COLORS.teal}20`,
                          color: COLORS.teal,
                          padding: '2px 8px',
                          borderRadius: 20,
                          fontSize: '0.7rem',
                        }}>
                          🔗 {getActiveAgreementsCount(star)} نشطة
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* نوع المؤسسة */}
                  <span style={{
                    fontSize: '0.7rem', padding: '4px 10px',
                    borderRadius: 20,
                    background: `${TYPE_COLORS[star.type] || COLORS.teal}20`,
                    color: TYPE_COLORS[star.type] || COLORS.teal,
                    border: `1px solid ${TYPE_COLORS[star.type] || COLORS.teal}40`,
                  }}>
                    {TYPE_LABELS[star.type] || star.type}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function HomePage() {
  const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const mountedRef = useRef(true);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  function dedup(data: GalaxyData): GalaxyData {
    const map = new Map<number, GalaxyStar>();
    (data.stars || []).forEach(s => map.set(s.id, s));
    return { ...data, stars: Array.from(map.values()) };
  }

  useEffect(() => {
    mountedRef.current = true;

    async function load() {
      try {
        setLoading(true);
        const raw = await fetchGalaxyData();
        if (mountedRef.current) { 
          setGalaxyData(dedup(raw)); 
          setError(null); 
        }
      } catch (err) {
        console.error(err);
        if (mountedRef.current)
          setError('فشل في تحميل بيانات المجرة');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }
    load();

    const interval = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const raw = await fetchGalaxyData();
        if (mountedRef.current) setGalaxyData(dedup(raw));
      } catch { /* silent */ }
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const handleStarClick = (star: GalaxyStar) =>
    window.open(`/institutions/${star.id}`, '_blank');

  const handleViewAgreement = (agreementId: string) => {
    setSelectedAgreementId(agreementId);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
      setUser(null);
    }
  };

  if (loading && !galaxyData) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: COLORS.darkNavy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80,
            border: `5px solid ${COLORS.lightMint}`,
            borderTopColor: COLORS.softGreen,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 20,
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h2 style={{ color: '#fff' }}>جاري تحميل المجرة الحضارية...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: COLORS.darkNavy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center', padding: 40,
          background: 'rgba(255,255,255,0.1)', borderRadius: 20,
        }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h3 style={{ color: '#fff', margin: '20px 0' }}>{error}</h3>
          <button onClick={() => window.location.reload()}
            style={{
              background: COLORS.softGreen,
              border: 'none', padding: '10px 30px',
              borderRadius: 40, color: COLORS.darkNavy,
              fontSize: '1rem', cursor: 'pointer',
            }}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <main style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative',
      direction: 'rtl',
      background: COLORS.darkNavy,
    }}>
      {galaxyData && (
        <GalaxyCanvas
          data={galaxyData}
          onStarClick={handleStarClick}
          autoRotate
        />
      )}

      <TopBar
        starCount={galaxyData?.stars.length ?? 0}
        onToggleList={() => setListOpen(o => !o)}
        listOpen={listOpen}
        user={user}
        onLogout={handleLogout}
      />

      {user && <QuickActions user={user} />}

      {galaxyData && <StatsBar data={galaxyData} />}

      {galaxyData && (
        <InstitutionsPanel
          stars={galaxyData.stars}
          open={listOpen}
          onClose={() => setListOpen(false)}
          onSelect={() => {}}
          onViewAgreement={handleViewAgreement}
        />
      )}

      {selectedAgreementId && (
        <AgreementDetails
          agreementId={selectedAgreementId}
          onClose={() => setSelectedAgreementId(null)}
        />
      )}
    </main>
  );
}