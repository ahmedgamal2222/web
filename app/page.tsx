'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useMemo } from 'react';
import { GalaxyData, GalaxyStar, Agreement } from '@/lib/types';
import { fetchGalaxyData, fetchInstitutionAgreements, API_BASE } from '@/lib/api';
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
    <div className="galaxy-logo" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
          <defs>
            <radialGradient id="rg_core" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#EDF7BD" />
              <stop offset="42%"  stopColor="#85C79A" />
              <stop offset="100%" stopColor="#4E8D9C" />
            </radialGradient>
            <radialGradient id="rg_halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#4E8D9C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4E8D9C" stopOpacity="0" />
            </radialGradient>
            <filter id="f_glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.8" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Ambient halo */}
          <circle cx="27" cy="27" r="26" fill="url(#rg_halo)" />
          {/* Outer orbital ring */}
          <ellipse cx="27" cy="27" rx="24.5" ry="9.5"
            stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3"
            fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
          {/* Inner orbital ring */}
          <ellipse cx="27" cy="27" rx="18" ry="6.5"
            stroke="#85C79A" strokeWidth="0.65" strokeDasharray="2 4"
            fill="none" opacity="0.45" transform="rotate(40 27 27)" />
          {/* Star core */}
          <path
            d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z"
            fill="url(#rg_core)" filter="url(#f_glow)"
          />
          {/* Bright nucleus */}
          <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
          <circle cx="25.2" cy="25.2" r="1.2" fill="white" opacity="0.5" />
        </svg>
      </div>
      <div>
        <div className="logo-title" style={{
          fontSize: '1.55rem', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em',
          background: 'linear-gradient(130deg, #EDF7BD 0%, #85C79A 48%, #4E8D9C 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          المجرة الحضارية
        </div>
        <div className="logo-subtitle" style={{
          fontSize: '0.82rem', color: '#4E8D9C', letterSpacing: '0.3em',
          marginTop: 5, fontWeight: 700, textTransform: 'uppercase' as const, opacity: 0.9,
        }}>
          Civilization Galaxy
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
          padding: '6px 14px 6px 8px',
          background: 'rgba(78,141,156,0.1)',
          border: '1px solid rgba(78,141,156,0.35)',
          borderRadius: 40,
          cursor: 'pointer',
          transition: 'all 0.22s',
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
        <span className="user-name" style={{ color: '#fff', fontSize: '0.9rem' }}>
          {user.name_ar || user.name}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: COLORS.teal }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 10,
          width: 210,
          background: 'rgba(5, 4, 20, 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(78,141,156,0.28)',
          borderRadius: 16,
          overflow: 'hidden',
          zIndex: 50,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(237,247,189,0.06)',
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
  gap: 10,
  padding: '11px 18px',
  color: '#c8d8e8',
  textDecoration: 'none',
  fontSize: '0.88rem',
  fontWeight: 500,
  transition: 'all 0.2s',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box' as const,
  letterSpacing: '0.01em',
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
    <header className="topbar" style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      height: 76,
      background: 'linear-gradient(180deg, rgba(5,4,20,0.97) 0%, rgba(5,4,20,0.85) 65%, rgba(5,4,20,0) 100%)',
      backdropFilter: 'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      borderBottom: '1px solid rgba(78,141,156,0.2)',
      boxShadow: '0 2px 40px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(133,199,154,0.08)',
    }}>
      <GalaxyLogo />

      {/* ── Global Nav ── */}
      <nav className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { href: '/news',        icon: '📰', label: 'الأخبار' },
          { href: '/campaigns',   icon: '🚀', label: 'الحملات' },
          { href: '/marketplace', icon: '🛒', label: 'السوق' },
          { href: '/cloud',       icon: '☁️', label: 'SAAS' },
          { href: '/services',    icon: '🛠️', label: 'الخدمات' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 40,
              color: '#9ca3af',
              fontSize: '0.82rem',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#EDF7BD';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(237,247,189,0.25)';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(237,247,189,0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
            <span className="topbar-nav-label">{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Institutions toggle */}
        <button
          onClick={onToggleList}
          aria-pressed={listOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px',
            background: listOpen
              ? 'linear-gradient(135deg, rgba(78,141,156,0.3), rgba(133,199,154,0.15))'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${listOpen ? 'rgba(133,199,154,0.6)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 40,
            color: listOpen ? '#85C79A' : '#bbb',
            fontSize: '0.88rem',
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: '0.01em',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: listOpen ? '0 0 18px rgba(133,199,154,0.2)' : 'none',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="inst-btn-label">المؤسسات</span>
          <span style={{
            background: listOpen ? 'rgba(133,199,154,0.25)' : 'rgba(255,255,255,0.08)',
            color: listOpen ? '#85C79A' : '#aaa',
            padding: '2px 9px',
            borderRadius: 20,
            fontSize: '0.82rem',
            fontWeight: 700,
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
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 20px',
                background: 'rgba(78,141,156,0.12)',
                border: '1px solid rgba(78,141,156,0.5)',
                borderRadius: 40,
                color: '#4E8D9C',
                fontSize: '0.88rem',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.25s',
                letterSpacing: '0.02em',
              }}
            >
              دخول
            </Link>
            
            <Link
              href="/register"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 22px',
                background: 'linear-gradient(135deg, #85C79A, #4E8D9C)',
                border: 'none',
                borderRadius: 40,
                color: '#281C59',
                fontSize: '0.88rem',
                textDecoration: 'none',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 4px 16px rgba(133,199,154,0.3)',
                transition: 'all 0.25s',
              }}
            >
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
const SAAS_ROUTE_MAP: Record<string, { icon: string; label: string; href: string }> = {
  erp:          { icon: '🏭', label: 'ERP',           href: '/cloud/apps/erp' },
  crm:          { icon: '🤝', label: 'CRM',           href: '/cloud/apps/crm' },
  hr:           { icon: '👥', label: 'HR',            href: '/cloud/apps/hr' },
  form:         { icon: '📋', label: 'النماذج',       href: '/cloud/apps/forms' },
  funnel:       { icon: '🌪️', label: 'قمع المبيعات', href: '/cloud/apps/funnel' },
  landing_page: { icon: '🖥️', label: 'صفحات الهبوط', href: '/cloud/apps/landing' },
};

function QuickActions({ user }: { user: any }) {
  const [saasApps, setSaasApps] = useState<{ icon: string; label: string; href: string; color: string }[]>([]);

  useEffect(() => {
    const sid = localStorage.getItem('sessionId');
    if (!sid || !user.institution_id) return;
    // Fetch subscribed apps, then fetch their categories
    Promise.all([
      fetch(`${API_BASE}/api/saas/my-subscriptions`, { headers: { 'X-Session-ID': sid } }).then(r => r.json()),
      fetch(`${API_BASE}/api/saas?page=1&limit=100`).then(r => r.json()),
    ]).then(([subsData, appsData]) => {
      const subIds: number[] = subsData.success ? (subsData.data || []) : [];
      const allApps: any[] = appsData.data || [];
      const mapped = subIds
        .map(id => allApps.find((a: any) => a.id === id))
        .filter(Boolean)
        .map((a: any) => {
          const route = SAAS_ROUTE_MAP[a.category];
          if (!route) return null;
          return { icon: route.icon, label: a.name_ar || route.label, href: route.href, color: '#4E8D9C' };
        })
        .filter(Boolean) as { icon: string; label: string; href: string; color: string }[];
      setSaasApps(mapped);
    }).catch(() => {});
  }, [user.institution_id]);

  const actions: { icon: string; label: string; href: string; color: string }[] = [];

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

  // إجراءات مشتركة للجميع (الناف بار يحتوي الأخبار/المكتبة/المنتدى/البودكاست)
  actions.push(
    { icon: '🛠️', label: 'الخدمات', href: '/services', color: '#FF9B4E' },
    { icon: '📋', label: 'طلباتي', href: '/services/requests', color: '#9C27B0' },
  );

  if (user.role === 'explorer' || !user.institution_id) {
    actions.push(
      { icon: '✨', label: 'طلب إنشاء مؤسسة', href: '/institution-request', color: '#FFD700' },
    );
  }

  // Static nav items moved from topbar
  actions.push(
    { icon: '📚', label: 'المكتبة', href: '/library', color: '#85C79A' },
    { icon: '💬', label: 'المنتدى', href: '/forum', color: '#EDF7BD' },
    { icon: '🎙️', label: 'البودكاست', href: '/podcast', color: '#f59e0b' },
  );

  // Subscribed SAAS apps
  if (saasApps.length > 0) {
    actions.push(...saasApps);
  }

  return (
    <div className="quick-actions" style={{
      position: 'absolute',
      top: 88,
      left: 28,
      zIndex: 39,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}>
      {actions.map((action, index) => (
        <Link
          key={index}
          href={action.href}
          className="quick-action-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 18px',
            background: 'rgba(5, 4, 20, 0.88)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: `1px solid ${action.color}35`,
            borderRadius: 14,
            color: '#c8d8e8',
            textDecoration: 'none',
            fontSize: '0.84rem',
            fontWeight: 500,
            transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`,
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${action.color}18`;
            e.currentTarget.style.borderColor = `${action.color}80`;
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = `0 6px 22px ${action.color}25, inset 0 1px 0 rgba(255,255,255,0.07)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(5,4,20,0.88)';
            e.currentTarget.style.borderColor = `${action.color}35`;
            e.currentTarget.style.color = '#c8d8e8';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = `0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`;
          }}
        >
          <span className="quick-action-icon" style={{ fontSize: '1rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{action.icon}</span>
          <span className="quick-action-label">{action.label}</span>
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
    <div className="stats-bar" style={{
      position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 40, display: 'flex', gap: 10, alignItems: 'stretch',
    }}>
      {stats.map((s) => (
        <div key={s.label} className="stat-card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '12px 26px',
          background: 'rgba(6, 7, 22, 0.88)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: `1px solid ${s.color}30`,
          borderRadius: 18,
          boxShadow: `0 0 24px ${s.color}12, 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)`,
          minWidth: 96,
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
            <span className="stat-icon" style={{ fontSize: '1rem', opacity: 0.8 }}>{s.icon}</span>
            <span className="stat-value" style={{
              fontSize: '1.55rem', fontWeight: 800, color: s.color,
              textShadow: `0 0 14px ${s.color}70`,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>{s.value}</span>
          </div>
          <div className="stat-label" style={{
            fontSize: '0.82rem', color: '#6a7f90',
            letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
          }}>{s.label}</div>
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
          <div style={{ fontSize: '0.85rem', color: '#888' }}>الإجمالي</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.teal }}>{agreements.length}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#888' }}>النشطة</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.softGreen }}>
            {agreements.filter(a => a.status === 'active').length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#888' }}>المكتملة</div>
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
                  <div style={{ fontSize: '0.83rem', color: '#888', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: COLORS.lightMint }}>{agreement.from_name_ar || agreement.from_name}</span>
                    <span style={{ color: COLORS.teal }}>←</span>
                    <span style={{ color: COLORS.softGreen }}>{agreement.to_name_ar || agreement.to_name}</span>
                  </div>
                  
                  {/* تاريخ التوقيع إذا وجد */}
                  {agreement.signed_date && (
                    <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 4 }}>
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
        fontSize: '0.85rem',
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
      fontSize: '0.85rem',
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
          const response = await fetchInstitutionAgreements(star.id) as any;
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

      <aside className="inst-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 46,
        width: 480,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
        background: 'rgba(5, 6, 22, 0.97)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderLeft: '1px solid rgba(78,141,156,0.25)',
        display: 'flex', flexDirection: 'column',
        direction: 'rtl',
        boxShadow: '-12px 0 70px rgba(0,0,0,0.75), inset 1px 0 0 rgba(133,199,154,0.07)',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 26px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(78,141,156,0.13) 0%, rgba(40,28,89,0.12) 100%)',
          borderBottom: '1px solid rgba(78,141,156,0.18)',
          boxShadow: '0 1px 0 rgba(133,199,154,0.06)',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#EDF7BD', letterSpacing: '-0.01em' }}>
              {showAgreements && selectedStar ?
                `اتفاقيات ${selectedStar.name_ar || selectedStar.name}` :
                'جميع المؤسسات'
              }
            </div>
            <div style={{ fontSize: '0.83rem', color: '#4E8D9C', marginTop: 5, fontWeight: 500 }}>
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
                  padding: '12px 20px',
                  background: 'rgba(5,4,20,0.6)',
                  border: '1px solid rgba(78,141,156,0.35)',
                  borderRadius: 14,
                  color: '#e8f4f8',
                  fontSize: '0.88rem',
                  outline: 'none',
                  transition: 'all 0.22s',
                  letterSpacing: '0.01em',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(133,199,154,0.7)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(133,199,154,0.12)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(78,141,156,0.35)';
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
                      fontSize: '0.83rem',
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
                    display: 'flex', alignItems: 'center', gap: 13,
                    width: '100%', textAlign: 'right', padding: '13px 16px',
                    marginBottom: 7, borderRadius: 14,
                    cursor: 'pointer',
                    background: selectedStar?.id === star.id
                      ? 'rgba(78,141,156,0.14)'
                      : 'rgba(255,255,255,0.02)',
                    border: star.screen_active
                      ? '1px solid rgba(133,199,154,0.4)'
                      : '1px solid rgba(78,141,156,0.14)',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: selectedStar?.id === star.id ? '0 0 20px rgba(78,141,156,0.1)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (selectedStar?.id !== star.id) {
                      e.currentTarget.style.background = 'rgba(78,141,156,0.09)';
                    }
                    e.currentTarget.style.transform = 'translateX(-3px)';
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
                        fontSize: '0.82rem',
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
                    <div style={{ fontSize: '0.83rem', color: '#888' }}>
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
                          fontSize: '0.85rem',
                        }}>
                          🔗 {getActiveAgreementsCount(star)} نشطة
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* نوع المؤسسة */}
                  <span style={{
                    fontSize: '0.85rem', padding: '4px 10px',
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
      await fetch(`${API_BASE}/api/auth/logout`, {
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
        background: 'radial-gradient(ellipse at 50% 40%, #0d0b2a 0%, #05041a 55%, #020210 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes spinR { to { transform: rotate(-360deg); } }
          @keyframes pulseGlow {
            0%,100% { opacity: 0.45; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.08); }
          }
          @keyframes fadeDots {
            0%,100% { opacity: 0.3; } 50% { opacity: 1; }
          }
        `}</style>

        {/* Orbital rings loader */}
        <div style={{ position: 'relative', width: 130, height: 130, marginBottom: 36 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1.5px solid rgba(78,141,156,0.35)',
            animation: 'spin 9s linear infinite',
          }}/>
          <div style={{
            position: 'absolute', inset: 12, borderRadius: '50%',
            border: '1.5px solid rgba(133,199,154,0.3)',
            animation: 'spinR 6s linear infinite',
          }}/>
          <div style={{
            position: 'absolute', inset: 25, borderRadius: '50%',
            border: '1px solid rgba(237,247,189,0.22)',
            animation: 'spin 3.5s linear infinite',
          }}/>
          {/* Orbiting dot */}
          <div style={{
            position: 'absolute', top: 0, left: '50%',
            width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5,
            borderRadius: '50%',
            background: '#85C79A',
            boxShadow: '0 0 10px #85C79A',
            transformOrigin: '3.5px calc(65px + 3.5px)',
            animation: 'spin 9s linear infinite',
          }}/>
          {/* Core glow */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(237,247,189,0.85) 0%, rgba(133,199,154,0.45) 50%, rgba(78,141,156,0.15) 100%)',
              animation: 'pulseGlow 2.4s ease-in-out infinite',
              boxShadow: '0 0 30px rgba(78,141,156,0.7), 0 0 60px rgba(78,141,156,0.3)',
            }}/>
          </div>
        </div>

        <GalaxyLogo />

        <p style={{
          color: '#4E8D9C', marginTop: 28, fontSize: '0.82rem',
          letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600,
          animation: 'fadeDots 2s ease-in-out infinite',
        }}>
          جاري إطلاق المجرة الحضارية
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, #0d0b2a 0%, #05041a 60%, #020210 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center', padding: '48px 56px',
          background: 'rgba(6,7,22,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(78,141,156,0.22)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          maxWidth: 380,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>⚠️</div>
          <h3 style={{ color: '#EDF7BD', margin: '16px 0 8px', fontWeight: 700, fontSize: '1.1rem' }}>{error}</h3>
          <p style={{ color: '#5a7080', fontSize: '0.85rem', marginBottom: 28 }}>تحقق من اتصالك بالإنترنت وحاول مجدداً</p>
          <button onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #85C79A, #4E8D9C)',
              border: 'none', padding: '11px 36px',
              borderRadius: 40, color: '#281C59',
              fontSize: '0.95rem', cursor: 'pointer', fontWeight: 700,
              boxShadow: '0 6px 20px rgba(133,199,154,0.3)',
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
      background: '#05041a',
      fontFamily: "'Segoe UI', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    }}>
      <style>{`
        /* ===== RESPONSIVE: GALAXY HOME PAGE ===== */

        /* --- Logo --- */
        @media (max-width: 480px) {
          .galaxy-logo { gap: 8px !important; }
          .galaxy-logo svg { width: 36px !important; height: 36px !important; }
          .logo-title { font-size: 1.05rem !important; }
          .logo-subtitle { display: none !important; }
        }

        /* --- TopBar --- */
        @media (max-width: 640px) {
          .topbar { padding: 0 12px !important; height: 60px !important; }
          .topbar-right { gap: 5px !important; }
          .inst-btn-label { display: none !important; }
          .user-name { display: none !important; }
          .topbar-nav-label { display: none !important; }
          .topbar-nav { gap: 2px !important; }
        }
        @media (max-width: 480px) {
          .topbar-nav { display: none !important; }
        }

        /* --- Quick Actions: icon-only circular dock on mobile --- */
        @media (max-width: 768px) {
          .quick-actions {
            top: auto !important;
            bottom: 88px !important;
            left: 10px !important;
            flex-direction: column !important;
            gap: 6px !important;
          }
          .quick-action-item {
            padding: 11px !important;
            border-radius: 50% !important;
            width: 42px !important;
            height: 42px !important;
            justify-content: center !important;
            gap: 0 !important;
            box-sizing: border-box !important;
          }
          .quick-action-label { display: none !important; }
          .quick-action-icon { width: auto !important; font-size: 1.1rem !important; }
        }

        /* --- Stats Bar: compact + horizontal scroll on mobile --- */
        @media (max-width: 640px) {
          .stats-bar {
            bottom: 10px !important;
            gap: 5px !important;
            max-width: calc(100vw - 70px) !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
          }
          .stats-bar::-webkit-scrollbar { display: none; }
          .stat-card {
            padding: 8px 12px !important;
            min-width: 64px !important;
            border-radius: 12px !important;
            flex-shrink: 0 !important;
          }
          .stat-value { font-size: 1.1rem !important; }
          .stat-icon { font-size: 0.8rem !important; }
          .stat-label { display: none !important; }
        }

        /* --- Institutions Panel: full-width on mobile --- */
        @media (max-width: 768px) {
          .inst-panel { width: 100vw !important; }
        }

        /* --- User menu dropdown: align right on mobile --- */
        @media (max-width: 480px) {
          .user-dropdown { left: auto !important; right: 0 !important; }
        }
      `}</style>
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