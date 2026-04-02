'use client';

import { useEffect, useState } from 'react';
import { Institution } from '@/lib/types';
import { fetchInstitutions } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

// ============================================================
// الألوان الأساسية
// ============================================================
const C = {
  bg:         '#07091e',
  bgCard:     'rgba(12,16,40,0.95)',
  bgCardHov:  'rgba(18,24,56,0.98)',
  border:     'rgba(78,141,156,0.18)',
  borderHov:  'rgba(78,141,156,0.5)',
  teal:       '#4E8D9C',
  mint:       '#EDF7BD',
  green:      '#85C79A',
  navy:       '#281C59',
  text:       '#e2eaf2',
  textMuted:  '#7a96aa',
  input:      'rgba(255,255,255,0.06)',
  inputBord:  'rgba(78,141,156,0.4)',
  inputFocus: '#4E8D9C',
};

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  educational:  { label: 'تعليمية',   color: '#4fc3f7' },
  research:     { label: 'بحثية',     color: '#85C79A' },
  cultural:     { label: 'ثقافية',    color: '#ce93d8' },
  charitable:   { label: 'خيرية',     color: '#ffb74d' },
  media:        { label: 'إعلامية',   color: '#f48fb1' },
  developmental:{ label: 'تنموية',   color: '#a5d6a7' },
  default:      { label: 'عامة',      color: '#90a4ae' },
};

// ============================================================
// دالة مساعدة لحساب عدد الاتفاقيات
// ============================================================
function getAgreementsCount(inst: Institution): number {
  const i = inst as any;
  // حقول مباشرة قد يرسلها الـ API
  if (typeof i.agreements_count === 'number') return i.agreements_count;
  if (typeof i.total_agreements === 'number')  return i.total_agreements;
  if (typeof i.agreements === 'number')        return i.agreements;
  if (!i.agreements) return 0;
  if (Array.isArray(i.agreements)) return i.agreements.length;
  if (typeof i.agreements === 'object' && i.agreements !== null) {
    const v = i.agreements.count ?? i.agreements.total ?? i.agreements.length;
    if (typeof v === 'number') return v;
  }
  return 0;
}

// ============================================================
// Institution Card
// ============================================================
function InstitutionCard({ institution }: { institution: Institution }) {
  const type = TYPE_STYLES[institution.type] || TYPE_STYLES.default;
  const agreementsCount = getAgreementsCount(institution);
  const name = institution.name_ar || institution.name;

  return (
    <Link href={`/institutions/${institution.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: C.bgCard,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = C.bgCardHov;
          e.currentTarget.style.borderColor = type.color + '60';
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px ${type.color}30`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = C.bgCard;
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* شريط لوني علوي */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${type.color}, ${type.color}44)` }} />

        <div style={{ padding: '20px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* الرأس */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: `${type.color}18`,
              border: `1.5px solid ${type.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', color: type.color, fontWeight: 800,
              overflow: 'hidden',
            }}>
              {institution.logo_url
                ? <Image src={institution.logo_url} alt={name} width={52} height={52} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                : name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: '0.97rem', color: C.text,
                lineHeight: 1.35, marginBottom: 6,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
              }}>
                {name}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  background: `${type.color}18`, color: type.color,
                  border: `1px solid ${type.color}35`,
                  padding: '2px 10px', borderRadius: 20,
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {type.label}
                </span>
                {institution.is_verified && (
                  <span style={{
                    background: `${C.green}18`, color: C.green,
                    border: `1px solid ${C.green}35`,
                    padding: '2px 8px', borderRadius: 20,
                    fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    ✓ موثقة
                  </span>
                )}
                {!!institution.screen_active && (
                  <span style={{
                    background: `${C.mint}12`, color: C.mint,
                    border: `1px solid ${C.mint}28`,
                    padding: '2px 8px', borderRadius: 20,
                    fontSize: '0.72rem', fontWeight: 600,
                  }}>
                    ✨ شاشة نشطة
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* الموقع */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textMuted, fontSize: '0.83rem' }}>
            <span>📍</span>
            <span>{institution.city}، {institution.country}</span>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          {/* إحصائيات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { icon: '👥', val: institution.employees_count || 0,   label: 'موظف',     hi: false },
              { icon: '📊', val: institution.projects_count || 0,    label: 'مشروع',    hi: false },
              { icon: '🔗', val: agreementsCount,                    label: 'اتفاقية',  hi: true  },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '8px 4px',
                background: s.hi ? `${type.color}0d` : 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                border: s.hi ? `1px solid ${type.color}25` : '1px solid transparent',
              }}>
                <div style={{ fontSize: '0.9rem', marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.hi ? type.color : C.text }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: C.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 'auto',
            padding: '9px 16px', background: `${type.color}12`,
            border: `1px solid ${type.color}30`, borderRadius: 12,
            color: type.color, fontSize: '0.82rem', fontWeight: 600, textAlign: 'center',
          }}>
            عرض التفاصيل ←
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filtered, setFiltered] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchInstitutions({ limit: 2000 })
      .then(data => { setInstitutions(data); setFiltered(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...institutions];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(inst =>
        (inst.name_ar || inst.name).toLowerCase().includes(q) ||
        inst.country.toLowerCase().includes(q) ||
        inst.city.toLowerCase().includes(q)
      );
    }
    if (activeType !== 'all') result = result.filter(i => i.type === activeType);
    if (activeCountry !== 'all') result = result.filter(i => i.country === activeCountry);
    result.sort((a, b) => {
      if (sortBy === 'weight') return (b.weight || 0) - (a.weight || 0);
      if (sortBy === 'founded') return (b.founded_year || 0) - (a.founded_year || 0);
      if (sortBy === 'agreements') return getAgreementsCount(b) - getAgreementsCount(a);
      return (a.name_ar || a.name).localeCompare(b.name_ar || b.name);
    });
    setFiltered(result);
    setCurrentPage(1);
  }, [searchQuery, activeType, activeCountry, sortBy, institutions]);

  const countries = [...new Set(institutions.map(i => i.country))].sort();
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const types = [
    { id: 'all',          label: 'الكل',      color: C.teal    },
    { id: 'educational',  label: 'تعليمية',   color: '#4fc3f7' },
    { id: 'research',     label: 'بحثية',     color: C.green   },
    { id: 'cultural',     label: 'ثقافية',    color: '#ce93d8' },
    { id: 'charitable',   label: 'خيرية',     color: '#ffb74d' },
    { id: 'media',        label: 'إعلامية',   color: '#f48fb1' },
    { id: 'developmental',label: 'تنموية',    color: '#a5d6a7' },
  ];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16, direction: 'rtl',
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: `3px solid ${C.teal}`, borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: C.textMuted, fontSize: '0.9rem' }}>جاري تحميل المؤسسات...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, direction: 'rtl',
      fontFamily: "'Tajawal', 'Segoe UI', sans-serif", color: C.text,
    }}>
      <style>{`
        input::placeholder { color: ${C.textMuted}; }
        select option { background: #0d1828; color: ${C.text}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0c0f2a 0%, #07091e 60%)',
        borderBottom: `1px solid ${C.border}`, padding: '32px 24px 36px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '0.85rem' }}>
            <Link href="/" style={{
              color: C.teal, textDecoration: 'none', fontWeight: 600,
              padding: '5px 14px', borderRadius: 20,
              background: `${C.teal}12`, border: `1px solid ${C.teal}30`,
            }}>✦ المجرة الحضارية</Link>
            <span style={{ color: C.textMuted }}>›</span>
            <span style={{ color: C.textMuted }}>المؤسسات</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800,
            color: C.mint, margin: '0 0 10px', letterSpacing: '-0.02em',
            textShadow: `0 2px 20px ${C.teal}40`,
          }}>
            المؤسسات الحضارية
          </h1>
          <p style={{ color: C.textMuted, fontSize: '1rem', margin: '0 0 28px' }}>
            منصة رقمية تجمع المؤسسات التعليمية والبحثية والثقافية
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { n: institutions.length,                                               label: 'مؤسسة',     c: C.teal    },
              { n: institutions.filter(i => i.screen_active).length,                 label: 'شاشة نشطة', c: C.mint    },
              { n: institutions.filter(i => i.status === 'active').length,           label: 'نشطة',      c: C.green   },
              { n: institutions.reduce((s, i) => s + getAgreementsCount(i), 0),      label: 'اتفاقية',   c: '#ffb74d' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', background: `${s.c}0f`,
                border: `1px solid ${s.c}30`, borderRadius: 30,
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: s.c }}>{s.n}</span>
                <span style={{ fontSize: '0.82rem', color: C.textMuted }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Search + Filters */}
      <div style={{
        background: 'rgba(10,14,32,0.98)', borderBottom: `1px solid ${C.border}`,
        padding: '18px 24px 16px', position: 'sticky', top: 0, zIndex: 30,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 480 }}>
              <span style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                color: C.textMuted, pointerEvents: 'none', fontSize: '0.95rem',
              }}>🔍</span>
              <input
                type="text"
                placeholder="ابحث بالاسم، البلد، أو المدينة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '11px 40px 11px 14px',
                  background: C.input, border: `1.5px solid ${C.inputBord}`,
                  borderRadius: 12, color: C.text, fontSize: '0.9rem',
                  outline: 'none', transition: 'all 0.2s',
                  boxSizing: 'border-box', fontFamily: 'inherit', direction: 'rtl',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = C.inputFocus; e.currentTarget.style.background = 'rgba(78,141,156,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBord; e.currentTarget.style.background = C.input; }}
              />
            </div>
            <select value={activeCountry} onChange={e => setActiveCountry(e.target.value)} style={{
              padding: '11px 14px', background: C.input, border: `1.5px solid ${C.inputBord}`,
              borderRadius: 12, color: C.textMuted, fontSize: '0.88rem',
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl',
            }}>
              <option value="all">🌍 كل الدول</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding: '11px 14px', background: C.input, border: `1.5px solid ${C.inputBord}`,
              borderRadius: 12, color: C.textMuted, fontSize: '0.88rem',
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl',
            }}>
              <option value="name">ترتيب أبجدي</option>
              <option value="weight">الأكثر تأثيراً</option>
              <option value="founded">الأحدث تأسيساً</option>
              <option value="agreements">الأكثر اتفاقيات</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t.id} onClick={() => setActiveType(t.id)} style={{
                padding: '5px 14px', borderRadius: 20,
                border: `1.5px solid ${activeType === t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
                background: activeType === t.id ? `${t.color}22` : 'transparent',
                color: activeType === t.id ? t.color : C.textMuted,
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.18s', outline: 'none',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 60px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, color: C.textMuted, fontSize: '0.85rem',
        }}>
          <span>{filtered.length} مؤسسة{searchQuery && ` — نتائج "${searchQuery}"`}</span>
          <span>الصفحة {currentPage} / {totalPages || 1}</span>
        </div>

        {pageItems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
            {pageItems.map(inst => <InstitutionCard key={inst.id} institution={inst} />)}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            border: `2px dashed ${C.teal}30`, borderRadius: 20, color: C.textMuted,
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 14 }}>🌌</span>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>لا توجد نتائج</div>
            <div style={{ fontSize: '0.85rem', marginTop: 6 }}>حاول تغيير معايير البحث أو الفلتر</div>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, alignItems: 'center' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{
              padding: '8px 20px', borderRadius: 20,
              background: currentPage === 1 ? 'transparent' : `${C.teal}15`,
              border: `1.5px solid ${currentPage === 1 ? 'rgba(255,255,255,0.08)' : C.teal}`,
              color: currentPage === 1 ? C.textMuted : C.teal,
              cursor: currentPage === 1 ? 'default' : 'pointer', fontSize: '0.88rem', fontWeight: 600,
            }}>← السابق</button>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const start = Math.max(1, currentPage - 3);
                const page = totalPages > 7 ? start + i : i + 1;
                if (page > totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: `1.5px solid ${page === currentPage ? C.teal : 'rgba(255,255,255,0.08)'}`,
                    background: page === currentPage ? C.teal : 'transparent',
                    color: page === currentPage ? '#fff' : C.textMuted,
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                  }}>{page}</button>
                );
              })}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{
              padding: '8px 20px', borderRadius: 20,
              background: currentPage === totalPages ? 'transparent' : `${C.teal}15`,
              border: `1.5px solid ${currentPage === totalPages ? 'rgba(255,255,255,0.08)' : C.teal}`,
              color: currentPage === totalPages ? C.textMuted : C.teal,
              cursor: currentPage === totalPages ? 'default' : 'pointer', fontSize: '0.88rem', fontWeight: 600,
            }}>التالي →</button>
          </div>
        )}
      </div>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px', textAlign: 'center', color: C.textMuted, fontSize: '0.82rem' }}>
        © 2026 المجرة الحضارية — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
