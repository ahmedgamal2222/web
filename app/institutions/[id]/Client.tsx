'use client';

import { useEffect, useState } from 'react';
import { Institution, Agreement } from '@/lib/types';
import { fetchInstitution, fetchEvents, fetchNews, API_BASE, uploadImage } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import AgreementDetails from '@/components/AgreementDetails';

// ── Design Tokens ─────────────────────────────────────────────
const C = {
  bg:        '#07091e',
  bgCard:    'rgba(10, 16, 42, 0.90)',
  bgCardHov: 'rgba(16, 24, 58, 0.98)',
  border:    'rgba(78,141,156,0.18)',
  borderAcc: 'rgba(78,141,156,0.45)',
  teal:      '#4E8D9C',
  tealDim:   'rgba(78,141,156,0.12)',
  mint:      '#EDF7BD',
  green:     '#85C79A',
  navy:      '#281C59',
  cyan:      '#4fc3f7',
  purple:    '#7c4dff',
  text:      '#e2eaf2',
  textMuted: '#7a96aa',
  danger:    '#ff6b6b',
  warning:   '#ffd700',
  success:   '#66bb6a',
};

// ── Helpers ───────────────────────────────────────────────────
const getTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    educational: 'تعليمية', research: 'بحثية', cultural: 'ثقافية',
    charitable: 'خيرية', media: 'إعلامية', developmental: 'تنموية',
  };
  return types[type] || type || 'عامة';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return C.green;
    case 'pending': return C.warning;
    case 'completed': return C.teal;
    default: return '#556677';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'نشط'; case 'inactive': return 'غير نشط';
    case 'pending': return 'قيد الانتظار'; case 'completed': return 'مكتمل';
    default: return 'غير معروف';
  }
};

const getInitial = (institution: Institution): string => {
  if (institution.name_ar?.length) return institution.name_ar.charAt(0);
  if (institution.name?.length) return institution.name.charAt(0);
  if (institution.name_en?.length) return institution.name_en.charAt(0);
  return 'م';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

function computeEffectiveWeight(institution: Institution, agreementsCount: number): number {
  const raw =
    (institution.employees_count || 0) * 0.5 +
    (institution.projects_count || 0) * 5 +
    (institution.beneficiaries_count || 0) * 0.1 +
    agreementsCount * 15;
  return Math.min(1, raw / 500);
}

// ── Stars ─────────────────────────────────────────────────────
function Stars() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {[...Array(70)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%', background: 'white',
          opacity: Math.random() * 0.4 + 0.05,
          width: Math.random() * 2.5 + 0.5, height: Math.random() * 2.5 + 0.5,
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
        }} />
      ))}
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────
function PageHeader() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 200,
      height: 68, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 32px',
      background: 'rgba(7,9,30,0.96)', backdropFilter: 'blur(24px)',
      borderBottom: `1px solid ${C.border}`,
      boxShadow: '0 2px 32px rgba(0,0,0,0.5)',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <svg width="36" height="36" viewBox="0 0 54 54" fill="none">
          <defs>
            <radialGradient id="rg_inst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EDF7BD" /><stop offset="42%" stopColor="#85C79A" /><stop offset="100%" stopColor="#4E8D9C" />
            </radialGradient>
          </defs>
          <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
          <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
          <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_inst)" />
          <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.9" />
        </svg>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, background: `linear-gradient(90deg, ${C.cyan}, #fff, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>المجرة الحضارية</div>
          <div style={{ fontSize: '0.6rem', color: C.textMuted, letterSpacing: '0.25em', fontWeight: 600 }}> كوكبة المؤسسات المضيئة</div>
        </div>
      </Link>
      <Link href="/institutions" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 18px', borderRadius: 30,
        background: C.tealDim, border: `1px solid ${C.borderAcc}`,
        color: C.teal, textDecoration: 'none', fontSize: '0.83rem', fontWeight: 700, transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.tealDim; e.currentTarget.style.color = C.teal; }}
      >
        ← قائمة المؤسسات
      </Link>
    </header>
  );
}

// ── Chip ──────────────────────────────────────────────────────
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '5px 14px', borderRadius: 30, fontSize: '0.78rem', fontWeight: 700,
      background: `${color}18`, border: `1px solid ${color}45`, color,
    }}>{label}</span>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function HeroSection({ institution }: { institution: Institution }) {
  return (
    <section style={{
      position: 'relative', padding: '60px 32px 90px',
      background: 'linear-gradient(160deg, rgba(40,28,89,0.55) 0%, rgba(10,16,42,0.85) 55%, rgba(7,9,30,1) 100%)',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(78,141,156,0.16) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <div style={{
            width: 130, height: 130, borderRadius: 32, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(78,141,156,0.28), rgba(124,77,255,0.18))',
            border: `2px solid ${C.borderAcc}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3.2rem', fontWeight: 'bold', color: C.mint, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(78,141,156,0.18)',
          }}>
            {institution.logo_url ? (
              <Image src={institution.logo_url} alt={institution.name_ar || ''} width={130} height={130} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            ) : getInitial(institution)}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: 'clamp(1.7rem,4vw,2.65rem)', fontWeight: 900, color: C.text, marginBottom: 14, lineHeight: 1.25, fontFamily: "'Tajawal', sans-serif" }}>
              {institution.name_ar || institution.name || institution.name_en || 'مؤسسة غير مسماة'}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <Chip label={getTypeLabel(institution.type)} color={C.cyan} />
              {!!institution.is_verified && <Chip label="✓ موثقة" color={C.green} />}
              <Chip
                label={institution.screen_active ? '✨ الشاشة نشطة' : '⚪ الشاشة غير نشطة'}
                color={institution.screen_active ? C.green : C.textMuted}
              />
              {institution.status && (
                <Chip
                  label={institution.status === 'active' ? '🟢 نشطة' : institution.status === 'pending' ? '⏳ قيد الانتظار' : '⚪ غير نشطة'}
                  color={getStatusColor(institution.status)}
                />
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, color: C.textMuted, fontSize: '0.87rem' }}>
              {(institution.city || institution.country) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: C.teal }}>📍</span>
                  {[institution.city, institution.country].filter(Boolean).join('، ')}
                </span>
              )}
              {institution.created_at && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: C.teal }}>📅</span>
                  تاريخ التسجيل: {formatDate(institution.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats Grid ────────────────────────────────────────────────
function StatsGrid({ institution, agreementsCount }: { institution: Institution; agreementsCount: number }) {
  const effectiveWeight = institution.weight > 0 ? institution.weight : computeEffectiveWeight(institution, agreementsCount);
  const stats = [
    { icon: '👥', label: 'الموظفون',    value: institution.employees_count?.toLocaleString() || '—', accent: C.cyan },
    { icon: '📊', label: 'المشاريع',    value: institution.projects_count?.toLocaleString() || '—', accent: C.teal },
    { icon: '🎯', label: 'المستفيدون', value: institution.beneficiaries_count?.toLocaleString() || '—', accent: C.green },
    { icon: '⭐', label: 'وزن التأثير', value: effectiveWeight.toFixed(2), accent: C.warning },
    { icon: '📅', label: 'تأسست عام',   value: String(institution.founded_year || '—'), accent: '#b47fe6' },
  ];
  return (
    <div style={{
      maxWidth: 1200, margin: '-42px auto 0', padding: '0 24px 40px',
      position: 'relative', zIndex: 10,
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14,
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: C.bgCard, borderRadius: 18, padding: '18px 16px',
          border: `1px solid ${C.border}`, transition: 'all 0.25s', backdropFilter: 'blur(12px)',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent + '55'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 32px rgba(0,0,0,0.4)`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.accent}16`, border: `1px solid ${s.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: 10 }}>{s.icon}</div>
          <div style={{ fontSize: '0.72rem', color: C.textMuted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: C.text }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── KPI Dashboard ─────────────────────────────────────────────
function KPIDashboard({ institution, agreementsCount }: { institution: Institution; agreementsCount: number }) {
  const employees = institution.employees || [];
  const owner = institution.owner;

  // ── Compute REAL score from actual data ──
  const kpis = [
    { key: 'owner',       label: 'المالك',         icon: '👤', weight: 15, achieved: owner ? 1 : 0, detail: owner ? (owner.name_ar || owner.name || 'محدد') : 'غير محدد' },
    { key: 'employees',   label: 'فريق العمل',     icon: '👥', weight: 15, achieved: Math.min(1, employees.length / 5), detail: `${employees.length} موظف` },
    { key: 'agreements',  label: 'الاتفاقيات',     icon: '🔗', weight: 20, achieved: Math.min(1, agreementsCount / 3), detail: `${agreementsCount} اتفاقية` },
    { key: 'verified',    label: 'التوثيق',        icon: '✅', weight: 10, achieved: institution.is_verified ? 1 : 0, detail: institution.is_verified ? 'موثقة' : 'غير موثقة' },
    { key: 'screen',      label: 'الشاشة',         icon: '📺', weight: 10, achieved: institution.screen_active ? 1 : 0, detail: institution.screen_active ? 'نشطة' : 'غير نشطة' },
    { key: 'description', label: 'الوصف',          icon: '📝', weight: 10, achieved: institution.description ? 1 : 0, detail: institution.description ? 'مكتمل' : 'غير مكتمل' },
    { key: 'contact',     label: 'بيانات التواصل', icon: '📞', weight: 10, achieved: Math.min(1, [institution.website, institution.email, institution.phone].filter(Boolean).length / 2), detail: `${[institution.website, institution.email, institution.phone].filter(Boolean).length}/3` },
    { key: 'logo',        label: 'الشعار',         icon: '🖼️', weight: 10, achieved: institution.logo_url ? 1 : 0, detail: institution.logo_url ? 'مرفوع' : 'غير مرفوع' },
  ];

  const totalWeight = kpis.reduce((s, k) => s + k.weight, 0);
  const rawScore = kpis.reduce((s, k) => s + k.achieved * k.weight, 0);
  const score = Math.round((rawScore / totalWeight) * 100);

  // ── Animation ──
  const [animScore, setAnimScore] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    const el = document.getElementById('kpi');
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        observer.disconnect();
        let start = 0;
        const duration = 1400;
        const startTime = performance.now();
        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * score);
          setAnimScore(current);
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [score, hasAnimated]);

  // 5 tiers
  const tiers = [
    { label: 'ضعيف جداً', labelEn: 'Very Poor', min: 0, max: 20, color: '#ef4444', bg: '#ef444418' },
    { label: 'ضعيف',     labelEn: 'Poor',      min: 20, max: 40, color: '#f97316', bg: '#f9731618' },
    { label: 'مقبول',     labelEn: 'Fair',      min: 40, max: 60, color: '#eab308', bg: '#eab30818' },
    { label: 'جيد',      labelEn: 'Good',      min: 60, max: 80, color: '#22c55e', bg: '#22c55e18' },
    { label: 'ممتاز',    labelEn: 'Excellent', min: 80, max: 100, color: '#10b981', bg: '#10b98118' },
  ];
  const animTier = tiers.find(t => animScore >= t.min && animScore < t.max) || tiers[tiers.length - 1];
  const realTier = tiers.find(t => score >= t.min && score < t.max) || tiers[tiers.length - 1];

  // SVG gauge params
  const cx = 160, cy = 140, r = 110, strokeW = 20;
  const startAngle = Math.PI;
  const totalAngle = Math.PI;

  const needleAngle = startAngle - (animScore / 100) * totalAngle;
  const needleLen = r - 12;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  const getRoleBadge = (role?: string) => {
    if (role === 'institution_admin') return { text: 'مدير', color: C.cyan, bg: `${C.cyan}18` };
    if (role === 'admin') return { text: 'مشرف', color: C.purple, bg: `${C.purple}18` };
    return { text: 'موظف', color: C.green, bg: `${C.green}18` };
  };

  return (
    <div id="kpi" style={{
      maxWidth: 1200, margin: '0 auto 0', padding: '0 24px 32px',
      position: 'relative', zIndex: 10,
    }}>
      <style>{`
        @keyframes kpiPulse { 0%,100%{box-shadow:0 0 0 0 ${realTier.color}40} 50%{box-shadow:0 0 0 8px ${realTier.color}00} }
        @keyframes kpiGlow { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes kpiFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .kpi-card-hover:hover { border-color: ${C.teal}55 !important; transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.35) !important; }
      `}</style>
      <div style={{
        background: `linear-gradient(145deg, rgba(10,16,42,0.95), rgba(7,9,30,0.98))`,
        borderRadius: 28, border: `1px solid ${C.border}`, backdropFilter: 'blur(20px)',
        overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.35)',
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '22px 30px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(78,141,156,0.05), transparent, rgba(124,77,255,0.05))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${realTier.color}25, ${realTier.color}08)`,
              border: `1px solid ${realTier.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
            }}>📊</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>لوحة الأداء المؤسسي</h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.73rem', color: C.textMuted }}>مؤشر الجدارة والتأثير الحضاري — تقييم فعلي</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              padding: '6px 16px', borderRadius: 30,
              background: `${realTier.color}12`, border: `1px solid ${realTier.color}30`,
              fontSize: '0.82rem', fontWeight: 800, color: realTier.color,
              animation: 'kpiPulse 2.5s infinite',
            }}>
              {score}%
            </div>
            <div style={{
              padding: '5px 14px', borderRadius: 30,
              background: institution.status === 'active' ? `${C.success}12` : institution.status === 'pending' ? `${C.warning}12` : `${C.danger}12`,
              border: `1px solid ${institution.status === 'active' ? C.success : institution.status === 'pending' ? C.warning : C.danger}28`,
              fontSize: '0.76rem', fontWeight: 700,
              color: institution.status === 'active' ? C.success : institution.status === 'pending' ? C.warning : C.danger,
            }}>
              {institution.status === 'active' ? '🟢 نشطة' : institution.status === 'pending' ? '🟡 قيد المراجعة' : '🔴 غير نشطة'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 0 }}>
          {/* ── Left: Gauge + KPI Bars ── */}
          <div style={{ padding: '32px 28px 24px', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Main Gauge */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <svg width={320} height={190} viewBox="0 0 320 190" style={{ overflow: 'visible' }}>
                <defs>
                  <filter id="kpiGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <linearGradient id="needleGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={animTier.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={animTier.color} />
                  </linearGradient>
                </defs>

                {/* Outer ambient ring */}
                {tiers.map((tier, i) => {
                  const segStart = startAngle - (tier.min / 100) * totalAngle;
                  const segEnd = startAngle - (tier.max / 100) * totalAngle;
                  const outerR = r + 8;
                  const x1 = cx + outerR * Math.cos(segStart);
                  const y1 = cy - outerR * Math.sin(segStart);
                  const x2 = cx + outerR * Math.cos(segEnd);
                  const y2 = cy - outerR * Math.sin(segEnd);
                  return (
                    <path key={`outer-${i}`}
                      d={`M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2}`}
                      fill="none" stroke={tier.color} strokeWidth={2} opacity={0.12}
                    />
                  );
                })}

                {/* Background arc segments */}
                {tiers.map((tier, i) => {
                  const segStart = startAngle - (tier.min / 100) * totalAngle;
                  const segEnd = startAngle - (tier.max / 100) * totalAngle;
                  const x1 = cx + r * Math.cos(segStart);
                  const y1 = cy - r * Math.sin(segStart);
                  const x2 = cx + r * Math.cos(segEnd);
                  const y2 = cy - r * Math.sin(segEnd);
                  const isActive = animScore >= tier.min && animScore < tier.max;
                  const isPassed = animScore >= tier.max;
                  return (
                    <path key={i}
                      d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                      fill="none"
                      stroke={isPassed || isActive ? tier.color : `${tier.color}18`}
                      strokeWidth={strokeW}
                      strokeLinecap="butt"
                      opacity={isActive ? 1 : isPassed ? 0.55 : 0.15}
                      filter={isActive ? 'url(#kpiGlow)' : undefined}
                    />
                  );
                })}

                {/* Active arc glow overlay */}
                {(() => {
                  const fillAngle = startAngle - (animScore / 100) * totalAngle;
                  const sx = cx + r * Math.cos(startAngle);
                  const sy = cy - r * Math.sin(startAngle);
                  const ex = cx + r * Math.cos(fillAngle);
                  const ey = cy - r * Math.sin(fillAngle);
                  const largeArc = animScore > 50 ? 1 : 0;
                  return animScore > 0 ? (
                    <path
                      d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
                      fill="none" stroke={animTier.color} strokeWidth={3}
                      opacity={0.4} filter="url(#kpiGlow)"
                    />
                  ) : null;
                })()}

                {/* Tick marks */}
                {[0, 20, 40, 60, 80, 100].map(v => {
                  const angle = startAngle - (v / 100) * totalAngle;
                  const inner = r - strokeW / 2 - 4;
                  const outer = r + strokeW / 2 + 4;
                  return (
                    <line key={v}
                      x1={cx + inner * Math.cos(angle)} y1={cy - inner * Math.sin(angle)}
                      x2={cx + outer * Math.cos(angle)} y2={cy - outer * Math.sin(angle)}
                      stroke="rgba(255,255,255,0.25)" strokeWidth={1.5}
                    />
                  );
                })}

                {/* Needle shadow */}
                <line x1={cx + 2} y1={cy + 2} x2={nx + 2} y2={ny + 2}
                  stroke="rgba(0,0,0,0.3)" strokeWidth={4} strokeLinecap="round" />
                {/* Needle */}
                <line x1={cx} y1={cy} x2={nx} y2={ny}
                  stroke="url(#needleGrad)" strokeWidth={3.5} strokeLinecap="round" />
                {/* Center hub */}
                <circle cx={cx} cy={cy} r={12} fill="rgba(7,9,30,0.95)" stroke={animTier.color} strokeWidth={3} />
                <circle cx={cx} cy={cy} r={4} fill={animTier.color} />
                {/* Center dot glow */}
                <circle cx={cx} cy={cy} r={6} fill={animTier.color} opacity={0.15} />

                {/* Score text */}
                <text x={cx} y={cy + 42} textAnchor="middle" fill={animTier.color} fontSize="38" fontWeight="900" fontFamily="'Tajawal', sans-serif">{animScore}</text>
                <text x={cx} y={cy + 60} textAnchor="middle" fill={C.textMuted} fontSize="12" fontFamily="'Tajawal', sans-serif">من 100 نقطة</text>

                {/* Tier labels on arc */}
                {tiers.map((tier, i) => {
                  const midAngle = startAngle - ((tier.min + tier.max) / 2 / 100) * totalAngle;
                  const labelR = r + 30;
                  const lx = cx + labelR * Math.cos(midAngle);
                  const ly = cy - labelR * Math.sin(midAngle);
                  const isActive = score >= tier.min && score < tier.max;
                  return (
                    <text key={i} x={lx} y={ly} textAnchor="middle"
                      fill={isActive ? tier.color : `${C.textMuted}50`}
                      fontSize={isActive ? '9' : '8'}
                      fontWeight={isActive ? 800 : 500}
                      fontFamily="'Tajawal', sans-serif"
                    >
                      {tier.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Active tier badge */}
            <div style={{
              marginTop: 18, marginBottom: 20,
              padding: '10px 28px', borderRadius: 40,
              background: `linear-gradient(135deg, ${realTier.color}18, ${realTier.color}06)`,
              border: `1.5px solid ${realTier.color}45`,
              fontSize: '0.92rem', fontWeight: 800, color: realTier.color,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: `0 4px 20px ${realTier.color}20`,
              animation: 'kpiFadeIn 0.9s ease-out',
            }}>
              <span style={{
                width: 11, height: 11, borderRadius: '50%', background: realTier.color,
                display: 'inline-block', boxShadow: `0 0 10px ${realTier.color}, 0 0 20px ${realTier.color}60`,
                animation: 'kpiGlow 2s infinite',
              }} />
              {realTier.label} — {realTier.labelEn}
            </div>

            {/* ── KPI Breakdown Bars ── */}
            <div style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: `${C.teal}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>📋</span>
                تفاصيل التقييم
              </div>
              {kpis.map((kpi, i) => {
                const pct = Math.round(kpi.achieved * 100);
                const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#eab308' : pct > 0 ? '#f97316' : '#ef4444';
                return (
                  <div key={kpi.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                    borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${C.border}`, transition: 'all 0.2s',
                    animation: `kpiFadeIn 0.5s ease-out ${i * 0.08}s both`,
                  }}>
                    <span style={{ fontSize: '0.85rem', width: 22, textAlign: 'center' }}>{kpi.icon}</span>
                    <span style={{ fontSize: '0.75rem', color: C.textMuted, fontWeight: 600, width: 90, flexShrink: 0 }}>{kpi.label}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                        width: hasAnimated ? `${pct}%` : '0%',
                        transition: 'width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)',
                        boxShadow: pct > 0 ? `0 0 6px ${barColor}40` : 'none',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: barColor, width: 32, textAlign: 'left' }}>{pct}%</span>
                    <span style={{ fontSize: '0.65rem', color: C.textMuted, width: 60, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kpi.detail}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: Owner + Employees + Status ── */}
          <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Owner */}
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: C.textMuted, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 20, height: 20, borderRadius: 7, background: `${C.cyan}15`, border: `1px solid ${C.cyan}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>👤</span>
                المالك / المنشئ
              </div>
              {owner ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderRadius: 16, background: `linear-gradient(135deg, ${C.cyan}08, rgba(255,255,255,0.02))`,
                  border: `1px solid ${C.cyan}18`, transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.cyan}40`; e.currentTarget.style.background = `${C.cyan}12`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.cyan}18`; e.currentTarget.style.background = `linear-gradient(135deg, ${C.cyan}08, rgba(255,255,255,0.02))`; }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.teal}, ${C.purple})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: '1.05rem',
                    boxShadow: `0 4px 16px rgba(78,141,156,0.25)`,
                  }}>
                    {owner.avatar_url ? <img src={owner.avatar_url} alt="" width={46} height={46} style={{ objectFit: 'cover' }} /> : (owner.name_ar?.[0] || owner.name?.[0] || '؟')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: C.text }}>{owner.name_ar || owner.name || 'غير معروف'}</div>
                    <div style={{ fontSize: '0.73rem', color: C.textMuted, marginTop: 2 }}>{owner.email || ''}</div>
                    {owner.position && <div style={{ fontSize: '0.7rem', color: C.cyan, marginTop: 3, fontWeight: 600 }}>📌 {owner.position}</div>}
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: 20,
                    background: `linear-gradient(135deg, ${C.cyan}20, ${C.cyan}08)`,
                    border: `1px solid ${C.cyan}25`,
                    fontSize: '0.72rem', fontWeight: 700, color: C.cyan,
                  }}>مالك</div>
                </div>
              ) : (
                <div style={{ padding: '16px 18px', borderRadius: 16, background: `rgba(255,255,255,0.02)`, border: `1px dashed ${C.border}`, textAlign: 'center', color: C.textMuted, fontSize: '0.82rem' }}>
                  لم يتم تحديد المالك
                </div>
              )}
            </div>

            {/* Employees */}
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: C.textMuted, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 7, background: `${C.green}15`, border: `1px solid ${C.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>👥</span>
                  فريق العمل
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.green}15, ${C.green}08)`,
                  border: `1px solid ${C.green}20`,
                  color: C.green, fontSize: '0.72rem', fontWeight: 800,
                }}>{employees.length}</span>
              </div>
              {employees.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 210, overflow: 'auto' }}>
                  {employees.map(emp => {
                    const badge = getRoleBadge(emp.role);
                    return (
                      <div key={emp.id} className="kpi-card-hover" style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
                        borderRadius: 13, background: `rgba(255,255,255,0.02)`, border: `1px solid ${C.border}`,
                        transition: 'all 0.25s', cursor: 'default',
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                          background: `linear-gradient(135deg, ${C.navy}, ${C.teal})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 800, fontSize: '0.78rem',
                        }}>
                          {emp.avatar_url ? <img src={emp.avatar_url} alt="" width={34} height={34} style={{ objectFit: 'cover' }} /> : (emp.name_ar?.[0] || emp.name?.[0] || '؟')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name_ar || emp.name || '—'}</div>
                          {emp.position && <div style={{ fontSize: '0.66rem', color: C.textMuted, marginTop: 1 }}>{emp.position}</div>}
                        </div>
                        <span style={{ padding: '3px 9px', borderRadius: 8, background: badge.bg, border: `1px solid ${badge.color}25`, fontSize: '0.66rem', fontWeight: 700, color: badge.color, flexShrink: 0 }}>{badge.text}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px 18px', borderRadius: 16, background: `rgba(255,255,255,0.02)`, border: `1px dashed ${C.border}`, textAlign: 'center', color: C.textMuted, fontSize: '0.82rem' }}>
                  لا يوجد موظفون مسجلون حالياً
                </div>
              )}
            </div>

            {/* Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { check: institution.is_verified, on: '✅', off: '⚪', onLabel: 'موثّقة', offLabel: 'غير موثّقة', color: C.success },
                { check: institution.screen_active, on: '📺', off: '⚪', onLabel: 'شاشة نشطة', offLabel: 'شاشة غير نشطة', color: C.cyan },
                { check: true, on: '📅', off: '📅', onLabel: `تأسست: ${institution.founded_year || '—'}`, offLabel: `تأسست: ${institution.founded_year || '—'}`, color: C.purple },
              ].map((s, i) => (
                <div key={i} className="kpi-card-hover" style={{
                  padding: '13px 15px', borderRadius: 15,
                  background: s.check ? `${s.color}08` : `rgba(255,255,255,0.02)`,
                  border: `1px solid ${s.check ? s.color + '22' : C.border}`,
                  transition: 'all 0.25s', cursor: 'default',
                }}>
                  <div style={{ fontSize: '1.15rem', marginBottom: 5 }}>{s.check ? s.on : s.off}</div>
                  <div style={{ fontSize: '0.73rem', fontWeight: 700, color: s.check ? s.color : C.textMuted }}>
                    {s.check ? s.onLabel : s.offLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick Links ───────────────────────────────────────────────
function QuickLinks({ institution }: { institution: Institution }) {
  const links = [
    institution.website  && { href: institution.website,             icon: '🌐', label: 'الموقع الإلكتروني', ext: true },
    institution.email    && { href: `mailto:${institution.email}`,   icon: '📧', label: institution.email,   ext: false },
    institution.phone    && { href: `tel:${institution.phone}`,      icon: '📞', label: institution.phone,   ext: false },
  ].filter(Boolean) as { href: string; icon: string; label: string; ext: boolean }[];
  if (!links.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
      {links.map(l => (
        <a key={l.href} href={l.href} target={l.ext ? '_blank' : undefined} rel={l.ext ? 'noopener noreferrer' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 30,
            background: C.bgCard, border: `1px solid ${C.border}`,
            color: C.text, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.tealDim; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.bgCard; }}
        >
          <span>{l.icon}</span>{l.label}
        </a>
      ))}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────
function SectionCard({ icon, title, children, id }: { icon: string; title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} style={{ background: C.bgCard, borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 24, backdropFilter: 'blur(12px)' }}>
      <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: `${C.teal}20`, border: `1px solid ${C.teal}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text }}>{title}</h2>
      </div>
      <div style={{ padding: '24px 26px' }}>{children}</div>
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────
function AboutSection({ institution }: { institution: Institution }) {
  return (
    <SectionCard id="about" icon="🏛️" title="عن المؤسسة">
      <p style={{ fontSize: '0.96rem', lineHeight: 1.9, color: C.textMuted, marginBottom: 0 }}>
        {institution.description || `تأسست مؤسسة ${institution.name_ar || institution.name || 'غير معروفة'} عام ${institution.founded_year || 'غير محدد'}، وهي مؤسسة ${getTypeLabel(institution.type)} تعمل في مجال تعزيز العمل الحضاري والتنمية المستدامة.`}
      </p>
      {[institution.address, institution.registration_number, institution.social_media, institution.sub_type].some(Boolean) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          {institution.address && <div style={{ display: 'flex', gap: 8, color: C.textMuted, fontSize: '0.85rem', alignItems: 'center' }}><span style={{ color: C.teal }}>📍</span><span>{institution.address}</span></div>}
          {institution.registration_number && <div style={{ display: 'flex', gap: 8, color: C.textMuted, fontSize: '0.85rem', alignItems: 'center' }}><span style={{ color: C.teal }}>📋</span><span>رقم التسجيل: {institution.registration_number}</span></div>}
          {institution.social_media && <div style={{ display: 'flex', gap: 8, fontSize: '0.85rem', alignItems: 'center' }}><span style={{ color: C.teal }}>📱</span><a href={institution.social_media} target="_blank" rel="noopener noreferrer" style={{ color: C.cyan, textDecoration: 'none' }}>منصات التواصل الاجتماعي</a></div>}
          {institution.sub_type && <div style={{ display: 'flex', gap: 8, color: C.textMuted, fontSize: '0.85rem', alignItems: 'center' }}><span style={{ color: C.teal }}>🏷️</span><span>نوع فرعي: {institution.sub_type}</span></div>}
        </div>
      )}
    </SectionCard>
  );
}

// ── Ad Create Modal ───────────────────────────────────────────
const PRICE_PER_DAY = 10; // $10 per day
const GLOBAL_SURCHARGE = 5; // +$5/day for global targeting

function AdCreateModal({ institutionId, onClose, onSuccess }: {
  institutionId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '', content: '', image_url: '',
    start_date: '', end_date: '',
    target_type: 'all' as 'all' | 'country' | 'city',
    target_value: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Calculate duration and cost
  const durationDays = (() => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  })();
  const dailyRate = PRICE_PER_DAY + (form.target_type === 'all' ? GLOBAL_SURCHARGE : 0);
  const cost = durationDays * dailyRate;
  const canAfford = balance !== null && balance >= cost && durationDays > 0;

  // Fetch credits balance
  useEffect(() => {
    const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
    fetch(`${API_BASE}/api/ads/credits/${institutionId}`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success) setBalance(d.balance); else setBalance(0); })
      .catch(() => setBalance(0))
      .finally(() => setLoadingCredits(false));
  }, [institutionId]);

  const setField = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!canAfford) return;
    if (!form.title || !form.start_date || !form.end_date) { setErr('يرجى ملء الحقول المطلوبة'); return; }
    if (durationDays <= 0) { setErr('تاريخ النهاية يجب أن يكون بعد تاريخ البداية'); return; }
    setSubmitting(true); setErr('');
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        setUploadProgress(1);
        const uploaded = await uploadImage(imageFile, (p: number) => setUploadProgress(p));
        imageUrl = (uploaded as any).url;
        setUploadProgress(100);
      }
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify({ ...form, image_url: imageUrl, institution_id: Number(institutionId) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'فشل إنشاء الإعلان');
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid rgba(78,141,156,0.28)`,
    borderRadius: 12, color: C.text, fontSize: '0.93rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Tajawal', sans-serif", transition: 'border-color 0.2s',
  };
  const lStyle: React.CSSProperties = { fontSize: '0.8rem', color: C.teal, fontWeight: 700, marginBottom: 6, display: 'block' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 20, direction: 'rtl',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'linear-gradient(160deg, rgba(13,17,41,0.99) 0%, rgba(8,12,32,0.99) 100%)',
        border: `1px solid ${C.borderAcc}`,
        borderRadius: 24, padding: 0, width: '100%', maxWidth: 540,
        boxShadow: '0 30px 80px rgba(0,0,0,0.75), 0 0 60px rgba(78,141,156,0.08)',
        maxHeight: '92vh', overflowY: 'auto', fontFamily: "'Tajawal', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: `1px solid rgba(78,141,156,0.15)`,
          background: 'rgba(78,141,156,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(249,168,37,0.2), rgba(230,81,0,0.15))',
                border: '1px solid rgba(249,168,37,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
              }}>📢</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text }}>إنشاء إعلان جديد</h2>
                <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMuted }}>سيظهر للمستخدمين المستهدفين</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
              color: C.textMuted, cursor: 'pointer', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.15)'; e.currentTarget.style.color = C.danger; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.textMuted; }}
            >✕</button>
          </div>
        </div>

        <div style={{ padding: '22px 28px 28px' }}>
          {/* Balance & Cost Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20,
          }}>
            {[
              { label: 'رصيدك', value: loadingCredits ? '...' : `$${balance?.toFixed(0) || 0}`, color: canAfford || !durationDays ? C.green : C.danger, icon: '💰' },
              { label: 'سعر اليوم', value: `$${dailyRate}`, color: C.teal, icon: '📊' },
              { label: 'التكلفة', value: durationDays > 0 ? `$${cost}` : '—', color: C.warning, icon: '🧾' },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(78,141,156,0.12)`,
                borderRadius: 14, padding: '12px 14px', textAlign: 'center',
              }}>
                <span style={{ fontSize: '1rem', display: 'block', marginBottom: 4 }}>{item.icon}</span>
                <span style={{ fontSize: '0.68rem', color: C.textMuted, display: 'block', marginBottom: 3 }}>{item.label}</span>
                <span style={{ fontWeight: 900, fontSize: '1rem', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Info boxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div style={{
              background: 'rgba(133,199,154,0.06)', border: '1px solid rgba(133,199,154,0.18)',
              borderRadius: 12, padding: '10px 14px', fontSize: '0.8rem', color: C.green,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
              <span>كل مؤسسة تحصل على <b>$50 رصيد مجاني</b>. الاستهداف العالمي <b>+$5/يوم</b>.</span>
            </div>
            <div style={{
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: 12, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>⏳</span>
              <span>يتطلب <b>موافقة الإدارة</b> قبل النشر. يُسترد الرصيد عند الرفض.</span>
            </div>
          </div>

          {durationDays > 0 && !canAfford && !loadingCredits ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>⚠️</div>
              <p style={{ color: C.danger, marginBottom: 18, fontWeight: 600, fontSize: '0.9rem' }}>
                رصيدك غير كافٍ (${balance?.toFixed(0)} / ${cost} مطلوب)
              </p>
              <a href="https://paypal.me/hadmaj?amount=30" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block', background: '#0070ba', color: 'white',
                padding: '11px 26px', borderRadius: 30, textDecoration: 'none',
                fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(0,112,186,0.35)',
              }}>💳 شحن رصيد – 30$ عبر PayPal</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {err && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
                  borderRadius: 12, padding: '10px 14px', color: C.danger, fontSize: '0.84rem',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}><span>⚠️</span>{err}</div>
              )}
              <div>
                <label style={lStyle}>عنوان الإعلان <span style={{ color: C.danger }}>*</span></label>
                <input type="text" value={form.title} onChange={setField('title')} required placeholder="اكتب عنوان الإعلان" style={iStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.teal}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(78,141,156,0.28)'}
                />
              </div>
              <div>
                <label style={lStyle}>نص الإعلان</label>
                <textarea value={form.content} onChange={setField('content')} placeholder="تفاصيل الإعلان..." rows={3}
                  style={{ ...iStyle, resize: 'vertical' }}
                  onFocus={e => e.currentTarget.style.borderColor = C.teal}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(78,141,156,0.28)'}
                />
              </div>
              <div>
                <label style={lStyle}>صورة الإعلان</label>
                {imagePreview && (
                  <div style={{ height: 140, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{
                  border: `2px dashed rgba(78,141,156,0.25)`, borderRadius: 12, padding: '16px',
                  textAlign: 'center', cursor: 'pointer', position: 'relative',
                  background: 'rgba(78,141,156,0.03)', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = 'rgba(78,141,156,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(78,141,156,0.25)'; e.currentTarget.style.background = 'rgba(78,141,156,0.03)'; }}
                >
                  <input type="file" accept="image/*" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  <span style={{ color: C.textMuted, fontSize: '0.82rem' }}>📁 اختر صورة أو اسحبها هنا</span>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, height: 4, overflow: 'hidden', marginTop: 8 }}>
                    <div style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.cyan})`, height: '100%', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                  </div>
                )}
                {!imageFile && (
                  <input type="url" value={form.image_url} onChange={setField('image_url')} placeholder="أو رابط الصورة https://..." style={{ ...iStyle, marginTop: 8 }}
                    onFocus={e => e.currentTarget.style.borderColor = C.teal}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(78,141,156,0.28)'}
                  />
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lStyle}>تاريخ البداية <span style={{ color: C.danger }}>*</span></label>
                  <input type="date" value={form.start_date} onChange={setField('start_date')} required style={iStyle}
                    onFocus={e => e.currentTarget.style.borderColor = C.teal}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(78,141,156,0.28)'}
                  />
                </div>
                <div>
                  <label style={lStyle}>تاريخ النهاية <span style={{ color: C.danger }}>*</span></label>
                  <input type="date" value={form.end_date} onChange={setField('end_date')} required style={iStyle}
                    onFocus={e => e.currentTarget.style.borderColor = C.teal}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(78,141,156,0.28)'}
                  />
                </div>
              </div>
              {durationDays > 0 && (
                <div style={{
                  background: 'rgba(78,141,156,0.06)', border: `1px solid rgba(78,141,156,0.15)`,
                  borderRadius: 10, padding: '8px 12px', textAlign: 'center',
                  fontSize: '0.78rem', color: C.teal,
                }}>
                  📅 مدة الإعلان: <b>{durationDays} يوم</b>
                </div>
              )}
              <div>
                <label style={lStyle}>نطاق الاستهداف</label>
                <select value={form.target_type} onChange={e => setForm(p => ({ ...p, target_type: e.target.value as any, target_value: '' }))} style={iStyle}>
                  <option value="all">🌍 الجميع (+$5/يوم)</option>
                  <option value="country">🏳️ دولة محددة</option>
                  <option value="city">🏙️ مدينة محددة</option>
                </select>
              </div>
              {form.target_type !== 'all' && (
                <div>
                  <label style={lStyle}>{form.target_type === 'country' ? 'كود الدولة (ISO)' : 'اسم المدينة'}</label>
                  <input type="text" value={form.target_value} onChange={setField('target_value')}
                    placeholder={form.target_type === 'country' ? 'مثال: SA أو EG' : 'مثال: Riyadh أو Cairo'}
                    style={iStyle}
                    onFocus={e => e.currentTarget.style.borderColor = C.teal}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(78,141,156,0.28)'}
                  />
                </div>
              )}

              {/* Financial summary */}
              {durationDays > 0 && (
                <div style={{
                  background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.18)',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ fontSize: '0.8rem', color: C.textMuted }}>
                    <div style={{ marginBottom: 2 }}>{durationDays} يوم × ${dailyRate}/يوم{form.target_type === 'all' ? ' (شامل عالمي)' : ''}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>المتبقي بعد الخصم: ${((balance || 0) - cost).toFixed(0)}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.68rem', color: C.textMuted, display: 'block' }}>الإجمالي</span>
                    <span style={{ color: C.warning, fontWeight: 900, fontSize: '1.15rem' }}>${cost}</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitting || !canAfford} style={{
                padding: '13px', borderRadius: 14, border: 'none',
                cursor: (submitting || !canAfford) ? 'default' : 'pointer',
                background: (submitting || !canAfford) ? 'rgba(78,141,156,0.2)' : 'linear-gradient(135deg, #f9a825, #e65100)',
                color: 'white', fontSize: '0.95rem', fontWeight: 800,
                boxShadow: submitting ? 'none' : '0 4px 18px rgba(249,168,37,0.3)',
                transition: 'all 0.2s', fontFamily: "'Tajawal', sans-serif",
                opacity: (submitting || !canAfford) ? 0.5 : 1,
              }}>
                {submitting ? '⏳ جاري النشر...' : durationDays > 0 ? `📢 نشر الإعلان — $${cost}` : '📢 نشر الإعلان'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Announcements ─────────────────────────────────────────────
type AnnouncementTab = 'all' | 'events' | 'news';

function AnnouncementsSection({ events, news, institutionId, isOwner, isAdmin }: {
  events: any[]; news: any[]; institutionId?: string; isOwner?: boolean; isAdmin?: boolean;
}) {
  const [tab, setTab] = useState<AnnouncementTab>('all');
  const [showAdModal, setShowAdModal] = useState(false);
  const [adDone, setAdDone] = useState(false);
  const [adBalance, setAdBalance] = useState<number | null>(null);
  const canCreate = isOwner || isAdmin;

  useEffect(() => {
    if (!canCreate || !institutionId) return;
    const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
    fetch(`${API_BASE}/api/ads/credits/${institutionId}`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success) setAdBalance(d.balance); else setAdBalance(0); })
      .catch(() => setAdBalance(0));
  }, [institutionId, canCreate]);

  const allItems = [
    ...events.map(e => ({ ...e, _type: 'event' as const })),
    ...news.map(n => ({ ...n, _type: 'news' as const })),
  ].sort((a, b) =>
    new Date(b.published_at || b.start_datetime || b.created_at || 0).getTime() -
    new Date(a.published_at || a.start_datetime || a.created_at || 0).getTime()
  );

  const shown = tab === 'all' ? allItems : allItems.filter(i => i._type === (tab === 'events' ? 'event' : 'news'));

  const TABS: { id: AnnouncementTab; label: string; count: number }[] = [
    { id: 'all', label: 'الكل', count: allItems.length },
    { id: 'events', label: '📅 فعاليات', count: events.length },
    { id: 'news', label: '📰 أخبار', count: news.length },
  ];

  return (
    <>
    <div id="announcements" style={{ background: C.bgCard, borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 24, backdropFilter: 'blur(12px)' }}>
      <div style={{ padding: '22px 26px 0', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${C.teal}20`, border: `1px solid ${C.teal}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>📢</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text }}>إعلانات المؤسسة</h2>
              {canCreate && adBalance !== null && (
                <span style={{
                  fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20,
                  background: adBalance > 0 ? 'rgba(133,199,154,0.12)' : 'rgba(255,107,107,0.1)',
                  border: `1px solid ${adBalance > 0 ? 'rgba(133,199,154,0.28)' : 'rgba(255,107,107,0.25)'}`,
                  color: adBalance > 0 ? C.green : C.danger, fontWeight: 700,
                }}>💰 ${adBalance.toFixed(0)} رصيد</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {canCreate && (tab === 'all' || tab === 'news') && (
              <Link href={`/news/create${institutionId ? `?institution_id=${institutionId}` : ''}`} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 30,
                background: `linear-gradient(135deg, ${C.navy}, ${C.teal})`, color: C.mint,
                textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700,
                boxShadow: `0 3px 10px rgba(78,141,156,0.22)`,
              }}>+ خبر</Link>
            )}
            {canCreate && (tab === 'all' || tab === 'events') && (
              <Link href={`/events/create${institutionId ? `?institution_id=${institutionId}` : ''}`} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 30,
                background: `linear-gradient(135deg, ${C.teal}, ${C.green})`, color: C.bg,
                textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700,
              }}>+ فعالية</Link>
            )}
            {canCreate && (
              <button onClick={() => setShowAdModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 30,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #f9a825, #e65100)', color: 'white',
                fontSize: '0.78rem', fontWeight: 700, boxShadow: '0 3px 10px rgba(249,168,37,0.28)',
              }}>📢 إعلان جديد</button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s', fontFamily: "'Tajawal', sans-serif",
              background: tab === t.id ? 'rgba(78,141,156,0.15)' : 'transparent',
              color: tab === t.id ? C.cyan : C.textMuted,
              borderBottom: tab === t.id ? `2px solid ${C.teal}` : '2px solid transparent',
            }}>
              {t.label}{t.count > 0 && <span style={{ marginRight: 4, opacity: 0.65, fontSize: '0.72rem' }}>({t.count})</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '22px 26px' }}>
        {adDone && (
          <div style={{
            background: `${C.green}14`, border: `1px solid ${C.green}30`,
            borderRadius: 12, padding: '11px 16px', color: C.green,
            fontWeight: 700, fontSize: '0.86rem', marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>✅ تم نشر الإعلان بنجاح وسيظهر للمستخدمين قريباً!</div>
        )}
        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px 20px' }}>
            <span style={{ fontSize: '2.8rem', display: 'block', marginBottom: 12 }}>
              {tab === 'events' ? '📅' : tab === 'news' ? '📰' : '📢'}
            </span>
            <p style={{ color: C.textMuted, fontSize: '0.93rem', marginBottom: 20 }}>
              {tab === 'events' ? 'لا توجد فعاليات حتى الآن' : tab === 'news' ? 'لا توجد أخبار حتى الآن' : 'لا توجد إعلانات حتى الآن'}
            </p>
            {canCreate && tab !== 'all' && (
              <Link href={tab === 'news'
                ? `/news/create${institutionId ? `?institution_id=${institutionId}` : ''}`
                : `/events/create${institutionId ? `?institution_id=${institutionId}` : ''}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 22px', borderRadius: 30,
                  background: `linear-gradient(135deg, ${C.teal}, ${C.navy})`,
                  color: C.mint, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700,
                }}>
                <span>+</span> {tab === 'news' ? 'أضف أول خبر' : 'أضف أول فعالية'}
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {shown.map(item => <AnnouncementCard key={`${item._type}-${item.id}`} item={item} />)}
          </div>
        )}
      </div>
    </div>
    {/* Modal rendered outside overflow:hidden card to avoid clipping */}
    {showAdModal && institutionId && (
      <AdCreateModal
        institutionId={institutionId}
        onClose={() => setShowAdModal(false)}
        onSuccess={() => { setShowAdModal(false); setAdDone(true); setTimeout(() => setAdDone(false), 6000); }}
      />
    )}
    </>
  );
}

function AnnouncementCard({ item }: { item: any & { _type: 'event' | 'news' } }) {
  const isEvent = item._type === 'event';
  const accent = isEvent ? C.teal : C.green;
  const date = isEvent
    ? (item.start_datetime ? new Date(item.start_datetime).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '')
    : (item.published_at ? new Date(item.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '');

  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, transition: 'all 0.25s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '55'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />
      {(item.image_url || item.cover_image) && (
        <div style={{ height: 130, overflow: 'hidden' }}>
          <img src={item.image_url || item.cover_image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '14px 16px' }}>
        <span style={{
          display: 'inline-block', marginBottom: 9,
          background: `${accent}18`, color: accent, borderRadius: 30,
          padding: '3px 11px', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${accent}30`,
        }}>
          {isEvent ? '📅 فعالية' : '📰 خبر'}
        </span>
        <h3 style={{ fontSize: '0.92rem', color: C.text, marginBottom: 7, lineHeight: 1.5, fontWeight: 700 }}>{item.title}</h3>
        {(item.description || item.content) && (
          <p style={{
            fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.65, margin: '0 0 10px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
          }}>{item.description || item.content}</p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.73rem', color: C.textMuted, marginBottom: 12 }}>
          {date && <span>📅 {date}</span>}
          {isEvent && item.location && <span>📍 {item.location}</span>}
          {isEvent && item.is_online && <span style={{ color: C.cyan }}>💻 عبر الإنترنت</span>}
        </div>
        <Link href={isEvent ? `/events/${item.id}` : `/news/${item.id}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', borderRadius: 30, border: `1px solid ${accent}40`,
          color: accent, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = accent; }}
        >اقرأ المزيد ←</Link>
      </div>
    </div>
  );
}

// ── Agreements ────────────────────────────────────────────────
function AgreementsSection({ agreements, onViewAgreement }: { agreements?: Agreement[]; onViewAgreement: (id: string) => void }) {
  if (!agreements?.length) {
    return (
      <div id="agreements" style={{ background: C.bgCard, borderRadius: 24, border: `1px solid ${C.border}`, padding: '50px', textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: 14 }}>🔗</span>
        <h3 style={{ color: C.text, marginBottom: 8, fontWeight: 700 }}>لا توجد اتفاقيات حالياً</h3>
        <p style={{ color: C.textMuted, fontSize: '0.88rem' }}>هذه المؤسسة ليس لديها اتفاقيات نشطة في الوقت الحالي</p>
      </div>
    );
  }
  return (
    <div id="agreements" style={{ background: C.bgCard, borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 24, backdropFilter: 'blur(12px)' }}>
      <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: `${C.teal}20`, border: `1px solid ${C.teal}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>🔗</div>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text }}>الاتفاقيات ({agreements.length})</h2>
      </div>
      <div style={{ padding: '22px 26px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {agreements.map(agreement => (
          <button key={agreement.id} onClick={() => onViewAgreement(agreement.id.toString())}
            style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${getStatusColor(agreement.status)}28`,
              borderRadius: 18, padding: '18px 20px', cursor: 'pointer', textAlign: 'right',
              transition: 'all 0.25s', position: 'relative', overflow: 'hidden', display: 'block', width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = getStatusColor(agreement.status) + '55'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = getStatusColor(agreement.status) + '28'; }}
          >
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, background: getStatusColor(agreement.status), borderRadius: '0 0 0 4px' }} />
            <div style={{ paddingRight: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(agreement.status), boxShadow: `0 0 8px ${getStatusColor(agreement.status)}`, display: 'inline-block' }} />
                <span style={{ color: getStatusColor(agreement.status), fontSize: '0.74rem', fontWeight: 700 }}>{getStatusText(agreement.status)}</span>
              </div>
              <h3 style={{ fontSize: '0.93rem', color: C.text, marginBottom: 7, fontWeight: 700 }}>{agreement.title || `اتفاقية ${agreement.type || 'عامة'}`}</h3>
              <p style={{ fontSize: '0.8rem', color: C.textMuted, marginBottom: 10, lineHeight: 1.6 }}>{agreement.description || 'اتفاقية تعاون في المجال الثقافي والتعليمي.'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: C.textMuted }}>
                <span>{agreement.from_name_ar || agreement.from_name} ← {agreement.to_name_ar || agreement.to_name}</span>
                {agreement.signed_date && <span>{formatDate(agreement.signed_date)}</span>}
              </div>
              {agreement.strength && (
                <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
                  {[1, 2, 3].map(i => <span key={i} style={{ color: i <= agreement.strength! ? C.warning : 'rgba(255,255,255,0.12)', fontSize: '0.95rem' }}>★</span>)}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Screen Password ───────────────────────────────────────────
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
    <div id="screen" style={{
      background: 'linear-gradient(135deg, rgba(40,28,89,0.25) 0%, rgba(10,16,42,0.9) 100%)',
      border: `1px solid ${C.borderAcc}`, borderRadius: 24,
      overflow: 'hidden', marginBottom: 24, backdropFilter: 'blur(12px)',
    }}>
      <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(124,77,255,0.22)', border: '1px solid rgba(124,77,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>📺</div>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text }}>الشاشة الحضارية</h2>
      </div>
      <div style={{ padding: '22px 26px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '18px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '0.74rem', color: C.teal, marginBottom: 10, fontWeight: 700 }}>🔑 كلمة مرور الشاشة</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', padding: '9px 13px',
              borderRadius: 10, fontSize: '0.95rem', fontFamily: 'monospace',
              color: C.text, letterSpacing: show ? '0.1em' : '0.3em',
            }}>
              {show ? institution.screen_password : '••••••••'}
            </code>
            <button onClick={() => setShow(!show)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0, color: C.textMuted }}>{show ? '🙈' : '👁️'}</button>
            <button onClick={handleCopy} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${copied ? C.green + '50' : C.border}`, background: copied ? `${C.green}18` : 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0, transition: 'all 0.2s', color: C.textMuted }}>{copied ? '✅' : '📋'}</button>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '18px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '0.74rem', color: C.teal, marginBottom: 10, fontWeight: 700 }}>📊 حالة الشاشة</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              background: institution.screen_active ? C.green : '#445566',
              boxShadow: institution.screen_active ? `0 0 10px ${C.green}` : 'none',
            }} />
            <span style={{ fontWeight: 700, color: institution.screen_active ? C.green : C.textMuted }}>
              {institution.screen_active ? 'الشاشة نشطة الآن' : 'الشاشة غير نشطة'}
            </span>
          </div>
          {institution.screen_last_active && (
            <div style={{ fontSize: '0.78rem', color: C.textMuted }}>
              آخر نشاط: {new Date(institution.screen_last_active).toLocaleString('ar-EG')}
            </div>
          )}
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(40,28,89,0.5), rgba(78,141,156,0.18))',
          borderRadius: 16, padding: '18px', border: `1px solid ${C.borderAcc}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12,
        }}>
          <div style={{ fontSize: '0.78rem', color: C.mint, fontWeight: 700 }}>🔗 فتح الشاشة الحضارية</div>
          <a href={`/screen/${institution.id}`} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: `linear-gradient(135deg, ${C.teal}, ${C.purple})`,
            color: 'white', padding: '10px 18px', borderRadius: 30,
            textDecoration: 'none', fontWeight: 800, fontSize: '0.88rem',
            boxShadow: '0 6px 20px rgba(78,141,156,0.32)', transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >📺 عرض الشاشة</a>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Nav ───────────────────────────────────────────────
function SidebarNav({ institutionId, isOwner, isAdmin }: { institutionId: string; isOwner: boolean; isAdmin: boolean }) {
  const navItems = [
    { href: '#kpi',           icon: '📊', label: 'لوحة الأداء' },
    { href: '#about',         icon: '🏛️', label: 'عن المؤسسة' },
    { href: '#announcements', icon: '📢', label: 'الإعلانات' },
    { href: '#agreements',    icon: '🔗', label: 'الاتفاقيات' },
    ...(isOwner || isAdmin ? [{ href: `/screen/${institutionId}`, icon: '📺', label: 'الشاشة الحضارية' }] : []),
  ];
  return (
    <div style={{ background: C.bgCard, borderRadius: 20, padding: '18px 12px', border: `1px solid ${C.border}`, backdropFilter: 'blur(12px)' }}>
      <div style={{ fontSize: '0.68rem', color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12, padding: '0 6px', textTransform: 'uppercase' }}>القائمة</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {navItems.map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 12, textDecoration: 'none',
            color: C.textMuted, fontSize: '0.855rem', fontWeight: 600, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${C.teal}18`; e.currentTarget.style.color = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
          >
            <span style={{ fontSize: '1rem', width: 22, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      {(isOwner || isAdmin) && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href={`/institutions/${institutionId}/agreements`} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 13,
            textDecoration: 'none', background: `linear-gradient(135deg, ${C.navy}, ${C.teal})`,
            color: C.mint, fontSize: '0.8rem', fontWeight: 700, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          ><span>⚙️</span><span>إدارة الاتفاقيات</span></Link>
          <Link href={`/institutions/${institutionId}/employees`} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 13,
            textDecoration: 'none', background: `linear-gradient(135deg, ${C.teal}, ${C.green})`,
            color: C.bg, fontSize: '0.8rem', fontWeight: 700, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          ><span>👥</span><span>إدارة الموظفين</span></Link>
        </div>
      )}
    </div>
  );
}

// ── Owner Actions Bar ─────────────────────────────────────────
function OwnerActions({ institutionId }: { institutionId: string }) {
  return (
    <div style={{
      display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24,
      padding: '14px 20px', borderRadius: 18,
      background: `linear-gradient(135deg, ${C.navy}55, ${C.tealDim})`,
      border: `1px solid ${C.borderAcc}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', fontSize: '0.78rem', color: C.textMuted, fontWeight: 700 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
        أنت مدير هذه المؤسسة
      </div>
     
      <Link href={`/institutions/${institutionId}/employees`} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 16px', borderRadius: 30,
        background: `${C.green}15`, border: `1px solid ${C.green}35`,
        color: C.green, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = C.green; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${C.green}15`; e.currentTarget.style.color = C.green; }}
      >👥 الموظفون</Link>
      <Link href={`/institutions/${institutionId}/agreements`} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 16px', borderRadius: 30,
        background: `${C.purple}15`, border: `1px solid ${C.purple}35`,
        color: C.purple, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = C.purple; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${C.purple}15`; e.currentTarget.style.color = C.purple; }}
      >🔗 الاتفاقيات</Link>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function InstitutionClient() {
  const id = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
    : 'default';

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [institutionNews, setInstitutionNews] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true); setError(null);
        const instData = await fetchInstitution(id);
        setInstitution(instData);
        setAgreements((instData as any).agreements || []);
        const [evs, allNews] = await Promise.all([fetchEvents(id), fetchNews()]);
        setEvents(evs);
        setInstitutionNews(allNews.filter((n: any) => Number(n.institution_id) === Number(id)));
      } catch (err: any) {
        setError(err.message || 'حدث خطأ في تحميل بيانات المؤسسة');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const spinStyle = `@keyframes spin{to{transform:rotate(360deg)}}`;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stars />
        <style>{spinStyle}</style>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', border: `3px solid rgba(78,141,156,0.2)`, borderTop: `3px solid ${C.teal}`, animation: 'spin 0.9s linear infinite', margin: '0 auto 18px' }} />
          <p style={{ color: C.textMuted, fontSize: '0.95rem', fontFamily: "'Tajawal', sans-serif" }}>جاري تحميل بيانات المؤسسة...</p>
        </div>
      </div>
    );
  }

  const StateScreen = ({ emoji, title, desc }: { emoji: string; title: string; desc: string }) => (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Tajawal', sans-serif" }}>
      <Stars />
      <div style={{ textAlign: 'center', padding: '50px', background: C.bgCard, borderRadius: 28, border: `1px solid ${C.border}`, position: 'relative', zIndex: 1, maxWidth: 420, margin: '0 20px' }}>
        <span style={{ fontSize: '3.2rem', display: 'block', marginBottom: 14 }}>{emoji}</span>
        <h2 style={{ color: C.text, marginBottom: 8, fontWeight: 800 }}>{title}</h2>
        <p style={{ color: C.textMuted, marginBottom: 24, fontSize: '0.9rem' }}>{desc}</p>
        <Link href="/institutions" style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.navy})`, color: 'white', padding: '12px 28px', borderRadius: 30, textDecoration: 'none', fontWeight: 700, display: 'inline-block' }}>العودة إلى القائمة</Link>
      </div>
    </div>
  );

  if (error) return <StateScreen emoji="⚠️" title="خطأ في التحميل" desc={error} />;
  if (!institution) return <StateScreen emoji="🔍" title="المؤسسة غير موجودة" desc="لم نتمكن من العثور على المؤسسة المطلوبة" />;

  const isOwner = Number(currentUser?.institution_id) === institution.id;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
      <style>{`
        ${spinStyle}
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
        select option { background: #0d1630; color: #e2eaf2; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); }
        ::-webkit-scrollbar-thumb { background: rgba(78,141,156,0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(78,141,156,0.65); }
      `}</style>
      <Stars />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PageHeader />
        <HeroSection institution={institution} />
        <StatsGrid institution={institution} agreementsCount={agreements.length} />
        <KPIDashboard institution={institution} agreementsCount={agreements.length} />
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 20px 60px', display: 'grid', gridTemplateColumns: '210px 1fr', gap: 22, alignItems: 'flex-start' }}>
          <div style={{ position: 'sticky', top: 80, height: 'fit-content' }}>
            <SidebarNav institutionId={id} isOwner={isOwner} isAdmin={isAdmin} />
          </div>
          <div>
            <QuickLinks institution={institution} />
            {(isOwner || isAdmin) && <OwnerActions institutionId={id} />}
            <AboutSection institution={institution} />
            <AnnouncementsSection events={events} news={institutionNews} institutionId={id} isOwner={isOwner} isAdmin={isAdmin} />
            <ScreenPasswordSection institution={institution} currentUser={currentUser} />
            <AgreementsSection agreements={agreements} onViewAgreement={setSelectedAgreementId} />
          </div>
        </div>
        <footer style={{ background: 'rgba(0,0,0,0.35)', borderTop: `1px solid ${C.border}`, padding: '22px 32px', textAlign: 'center' }}>
          <p style={{ color: C.textMuted, fontSize: '0.82rem', margin: 0 }}>© 2026 المجرة الحضارية — جميع الحقوق محفوظة</p>
        </footer>
      </div>
      {selectedAgreementId && (
        <AgreementDetails agreementId={selectedAgreementId} onClose={() => setSelectedAgreementId(null)} />
      )}
    </div>
  );
}