'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal:      '#4E8D9C',
  darkNavy:  '#281C59',
};

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  educational:   { label: 'تعليمية',  color: '#0369a1', bg: '#e0f2fe' },
  research:      { label: 'بحثية',    color: '#7c3aed', bg: '#ede9fe' },
  cultural:      { label: 'ثقافية',   color: '#0f766e', bg: '#ccfbf1' },
  charitable:    { label: 'خيرية',    color: '#b45309', bg: '#fef3c7' },
  media:         { label: 'إعلامية',  color: '#db2777', bg: '#fce7f3' },
  developmental: { label: 'تنموية',   color: '#15803d', bg: '#dcfce7' },
  default:       { label: 'عامة',     color: '#6b7280', bg: '#f3f4f6' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'نشطة',     color: '#16a34a', bg: '#dcfce7' },
  inactive: { label: 'غير نشطة', color: '#6b7280', bg: '#f3f4f6' },
  pending:  { label: 'قيد المراجعة', color: '#d97706', bg: '#fef3c7' },
  rejected: { label: 'مرفوضة',   color: '#ef4444', bg: '#fee2e2' },
};

interface Institution {
  id: number;
  name: string;
  name_ar?: string;
  country: string;
  city: string;
  type: string;
  status: string;
  is_verified: boolean;
  screen_active: boolean;
  employees_count: number;
  founded_year: number;
  email?: string;
  website?: string;
  weight: number;
  created_at: string;
}

function StatCard({ value, label, color, icon }: { value: number; label: string; color: string; icon: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderTop: `4px solid ${color}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Credit-score-style gauge for institution weight ──
// function WeightGauge({ weight }: { weight: number }) {
//   const w = Math.max(0, Math.min(100, weight || 0));

//   // Five tiers like FICO credit score
//   const tiers = [
//     { min: 0,  max: 20, label: 'ضعيف جداً', labelEn: 'Very Poor', color: '#ef4444' },
//     { min: 20, max: 40, label: 'ضعيف',       labelEn: 'Poor',      color: '#f97316' },
//     { min: 40, max: 60, label: 'مقبول',       labelEn: 'Fair',      color: '#eab308' },
//     { min: 60, max: 80, label: 'جيد',         labelEn: 'Good',      color: '#22c55e' },
//     { min: 80, max: 100, label: 'ممتاز',      labelEn: 'Excellent', color: '#10b981' },
//   ];

//   const tier = tiers.find(t => w >= t.min && w < t.max) || tiers[tiers.length - 1];
//   const angle = -90 + (w / 100) * 180; // -90 (left) to +90 (right)

//   return (
//     <div style={{ margin: '18px 0 6px', padding: '16px 12px 12px', background: `${C.darkNavy}06`, borderRadius: 14, border: `1px solid ${C.teal}15` }}>
//       <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.darkNavy, marginBottom: 10, textAlign: 'center' }}>⚖️ الوزن المعياري</div>

//       {/* SVG gauge */}
//       <div style={{ display: 'flex', justifyContent: 'center' }}>
//         <svg width="200" height="115" viewBox="0 0 200 115">
//           {/* Background arcs for each tier */}
//           {tiers.map((t, i) => {
//             const startAngle = -90 + (t.min / 100) * 180;
//             const endAngle = -90 + (t.max / 100) * 180;
//             const r = 80;
//             const cx = 100, cy = 100;
//             const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
//             const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
//             const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
//             const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
//             return (
//               <path
//                 key={i}
//                 d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
//                 fill="none" stroke={t.color} strokeWidth="14" strokeLinecap="round"
//                 opacity={0.2}
//               />
//             );
//           })}

//           {/* Active arc up to current weight */}
//           {(() => {
//             const r = 80, cx = 100, cy = 100;
//             const startA = -90;
//             const endA = angle;
//             const x1 = cx + r * Math.cos((startA * Math.PI) / 180);
//             const y1 = cy + r * Math.sin((startA * Math.PI) / 180);
//             const x2 = cx + r * Math.cos((endA * Math.PI) / 180);
//             const y2 = cy + r * Math.sin((endA * Math.PI) / 180);
//             const largeArc = (endA - startA) > 180 ? 1 : 0;
//             if (w <= 0) return null;
//             return (
//               <path
//                 d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
//                 fill="none" stroke={tier.color} strokeWidth="14" strokeLinecap="round"
//               />
//             );
//           })()}

//           {/* Needle */}
//           {(() => {
//             const cx = 100, cy = 100, needleLen = 60;
//             const nx = cx + needleLen * Math.cos((angle * Math.PI) / 180);
//             const ny = cy + needleLen * Math.sin((angle * Math.PI) / 180);
//             return (
//               <>
//                 <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.darkNavy} strokeWidth="2.5" strokeLinecap="round" />
//                 <circle cx={cx} cy={cy} r="5" fill={C.darkNavy} />
//               </>
//             );
//           })()}

//           {/* Score text */}
//           <text x="100" y="92" textAnchor="middle" fontSize="22" fontWeight="900" fill={tier.color} fontFamily="Tajawal, sans-serif">
//             {w.toFixed(1)}
//           </text>
//         </svg>
//       </div>

//       {/* Tier labels */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 0', padding: '0 2px' }}>
//         {tiers.map((t, i) => (
//           <div key={i} style={{ textAlign: 'center', flex: 1 }}>
//             <div style={{ width: '100%', height: 4, borderRadius: 2, background: t.color, opacity: (w >= t.min && w < t.max) || (w >= 100 && i === 4) ? 1 : 0.25, marginBottom: 3 }} />
//             <div style={{ fontSize: '0.62rem', color: (w >= t.min && w < t.max) || (w >= 100 && i === 4) ? t.color : '#9ca3af', fontWeight: 700, lineHeight: 1.2 }}>{t.label}</div>
//           </div>
//         ))}
//       </div>

//       {/* Current tier label */}
//       <div style={{ textAlign: 'center', marginTop: 8 }}>
//         <span style={{ padding: '3px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 800, background: `${tier.color}18`, color: tier.color }}>
//           {tier.label} — {tier.labelEn}
//         </span>
//       </div>
//     </div>
//   );
// }

export default function AdminInstitutionsPage() {
  const router = useRouter();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [filterType,   setFilterType]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterScreen, setFilterScreen] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterCity,    setFilterCity]    = useState('all');
  const [filterWeightMin, setFilterWeightMin] = useState('');
  const [filterWeightMax, setFilterWeightMax] = useState('');
  const [countryList,   setCountryList]   = useState<string[]>([]);
  const [cityList,      setCityList]      = useState<string[]>([]);
  const [selected, setSelected]         = useState<Institution | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const PAGE_SIZE = 30;

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/institutions');
      return;
    }
    load();
    loadCountries();
  }, [page, filterType, filterStatus, filterScreen, filterCountry, filterCity, filterWeightMin, filterWeightMax]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const url = new URL(`${API_BASE}/api/institutions`);
      url.searchParams.set('page',  String(page));
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (filterType   !== 'all') url.searchParams.set('type',   filterType);
      if (filterStatus !== 'all') url.searchParams.set('status', filterStatus);
      if (filterScreen === 'active')   url.searchParams.set('screen_active', 'true');
      if (filterScreen === 'inactive') url.searchParams.set('screen_active', 'false');
      if (filterCountry !== 'all') url.searchParams.set('country', filterCountry);
      if (filterCity    !== 'all') url.searchParams.set('city', filterCity);
      if (filterWeightMin) url.searchParams.set('weight_min', filterWeightMin);
      if (filterWeightMax) url.searchParams.set('weight_max', filterWeightMax);
      if (search.trim()) url.searchParams.set('q', search.trim());

      const res  = await fetch(url.toString(), { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب المؤسسات');
      setInstitutions(data.data || []);
      setTotal(data.total || data.data?.length || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCountries() {
    try {
      const res = await fetch(`${API_BASE}/api/institutions?limit=9999`, { headers: getAuthHeaders() });
      const d = await res.json();
      const all: Institution[] = d.data || [];
      const cs = [...new Set(all.map(i => i.country).filter(Boolean))].sort();
      setCountryList(cs);
      // update cities based on selected country
      if (filterCountry !== 'all') {
        const cities = [...new Set(all.filter(i => i.country === filterCountry).map(i => i.city).filter(Boolean))].sort();
        setCityList(cities);
      } else {
        setCityList([]);
      }
    } catch {}
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleToggleStatus(inst: Institution) {
    const newStatus = inst.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`هل تريد ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} مؤسسة "${inst.name_ar || inst.name}"؟`)) return;
    setActionLoading(inst.id);
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${inst.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      setInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, status: newStatus } : i));
      if (selected?.id === inst.id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleVerify(inst: Institution) {
    const newVerified = !inst.is_verified;
    setActionLoading(inst.id);
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${inst.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_verified: newVerified }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      setInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, is_verified: newVerified } : i));
      if (selected?.id === inst.id) setSelected(prev => prev ? { ...prev, is_verified: newVerified } : null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(inst: Institution) {
    if (!confirm(`⚠️ هل تريد حذف مؤسسة "${inst.name_ar || inst.name}" نهائياً؟\nسيتم حذف جميع بياناتها واتفاقياتها. لا يمكن التراجع.`)) return;
    setActionLoading(inst.id);
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${inst.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      setSelected(null);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const stats = useMemo(() => ({
    total:    institutions.length,
    active:   institutions.filter(i => i.status === 'active').length,
    verified: institutions.filter(i => i.is_verified).length,
    screens:  institutions.filter(i => i.screen_active).length,
  }), [institutions]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', border: `1.5px solid ${C.teal}30`,
    borderRadius: 10, fontSize: '0.9rem', outline: 'none',
    color: C.darkNavy, background: 'white', boxSizing: 'border-box',
  };

  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>

      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.darkNavy}, ${C.teal})`,
        borderRadius: 22, padding: '28px 36px', marginBottom: 28,
        color: 'white', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 16,
        boxShadow: `0 8px 32px ${C.darkNavy}40`,
      }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: `${C.lightMint}80`, marginBottom: 6 }}>
            <Link href="/admin" style={{ color: `${C.lightMint}80`, textDecoration: 'none' }}>لوحة التحكم</Link>
            {' / '} المؤسسات
          </div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>🏛️ إدارة المؤسسات</h1>
          <p style={{ color: `${C.lightMint}80`, margin: '6px 0 0', fontSize: '0.9rem' }}>
            {total} مؤسسة مسجّلة في النظام
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/admin/requests"
            style={{
              background: `${C.softGreen}`, color: C.darkNavy,
              border: 'none', borderRadius: 40, padding: '10px 22px',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📋 طلبات الانضمام
          </Link>
          <Link href="/admin" style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', padding: '10px 20px', borderRadius: 40,
            textDecoration: 'none', fontSize: '0.9rem',
          }}>
            ← لوحة التحكم
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard value={stats.total}    label="إجمالي المؤسسات"   color={C.teal}      icon="🏛️" />
        <StatCard value={stats.active}   label="مؤسسات نشطة"       color="#16a34a"     icon="✅" />
        <StatCard value={stats.verified} label="موثّقة"             color="#7c3aed"     icon="🔰" />
        <StatCard value={stats.screens}  label="شاشات نشطة"        color={C.softGreen} icon="📺" />
      </div>

      {/* ── Filters ── */}
      <div style={{ background: 'white', borderRadius: 18, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 ابحث بالاسم أو البلد أو المدينة..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, minWidth: 260, flex: 1 }}
          />
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="all">كل الأنواع</option>
            <option value="educational">تعليمية</option>
            <option value="research">بحثية</option>
            <option value="cultural">ثقافية</option>
            <option value="charitable">خيرية</option>
            <option value="media">إعلامية</option>
            <option value="developmental">تنموية</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="all">كل الحالات</option>
            <option value="active">نشطة</option>
            <option value="inactive">غير نشطة</option>
            <option value="pending">قيد المراجعة</option>
          </select>
          <select value={filterScreen} onChange={e => { setFilterScreen(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="all">كل الشاشات</option>
            <option value="active">شاشة نشطة</option>
            <option value="inactive">شاشة غير نشطة</option>
          </select>
          <select value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setFilterCity('all'); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="all">🌍 كل الدول</option>
            {countryList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {filterCountry !== 'all' && cityList.length > 0 && (
            <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="all">🏙️ كل المدن</option>
              {cityList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: `linear-gradient(135deg, ${C.darkNavy}08, ${C.teal}06)`,
            border: `1.5px solid ${C.teal}25`,
            borderRadius: 14, padding: '6px 14px', position: 'relative',
          }}>
            {/* Label */}
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.teal, whiteSpace: 'nowrap', marginLeft: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚖️ الوزن
            </span>

            {/* Tier dots */}
            <div style={{ display: 'flex', gap: 3, marginLeft: 8, marginRight: 4 }}>
              {[
                { color: '#ef4444', tip: 'ضعيف جداً (0-20)' },
                { color: '#f97316', tip: 'ضعيف (20-40)' },
                { color: '#eab308', tip: 'مقبول (40-60)' },
                { color: '#22c55e', tip: 'جيد (60-80)' },
                { color: '#10b981', tip: 'ممتاز (80-100)' },
              ].map((t, i) => {
                const tierMin = i * 20;
                const tierMax = (i + 1) * 20;
                const minV = filterWeightMin ? parseFloat(filterWeightMin) : 0;
                const maxV = filterWeightMax ? parseFloat(filterWeightMax) : 100;
                const inRange = (!filterWeightMin && !filterWeightMax) || (tierMax > minV && tierMin < maxV);
                return (
                  <div
                    key={i}
                    title={t.tip}
                    onClick={() => {
                      setFilterWeightMin(String(tierMin));
                      setFilterWeightMax(String(tierMax));
                      setPage(1);
                    }}
                    style={{
                      width: 18, height: 6, borderRadius: 3,
                      background: t.color,
                      opacity: inRange ? 1 : 0.2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  />
                );
              })}
            </div>

            {/* Min input */}
            <input
              type="number" placeholder="٠" min="0" max="100" step="0.1"
              value={filterWeightMin} onChange={e => { setFilterWeightMin(e.target.value); setPage(1); }}
              style={{
                width: 52, padding: '6px 4px', border: `1px solid ${C.teal}20`,
                borderRadius: 8, fontSize: '0.85rem', outline: 'none', textAlign: 'center',
                color: C.darkNavy, background: 'white', boxSizing: 'border-box',
                fontWeight: 700, fontFamily: 'inherit',
              }}
            />
            <span style={{ color: C.teal, fontSize: '0.75rem', margin: '0 4px', fontWeight: 700 }}>↔</span>
            {/* Max input */}
            <input
              type="number" placeholder="١٠٠" min="0" max="100" step="0.1"
              value={filterWeightMax} onChange={e => { setFilterWeightMax(e.target.value); setPage(1); }}
              style={{
                width: 52, padding: '6px 4px', border: `1px solid ${C.teal}20`,
                borderRadius: 8, fontSize: '0.85rem', outline: 'none', textAlign: 'center',
                color: C.darkNavy, background: 'white', boxSizing: 'border-box',
                fontWeight: 700, fontFamily: 'inherit',
              }}
            />

            {/* Clear button */}
            {(filterWeightMin || filterWeightMax) && (
              <button
                onClick={() => { setFilterWeightMin(''); setFilterWeightMax(''); setPage(1); }}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: '#ef444415', border: '1px solid #ef444425',
                  color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 4, transition: 'all 0.15s', padding: 0,
                }}
                title="مسح فلتر الوزن"
              >✕</button>
            )}
          </div>
          <button type="submit" style={{
            padding: '10px 24px', background: C.teal, color: 'white',
            border: 'none', borderRadius: 40, cursor: 'pointer', fontWeight: 600,
          }}>
            بحث
          </button>
        </form>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#ef4444' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Main Layout: Table + Detail Panel ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Table ── */}
        <div style={{ flex: 1, background: 'white', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: C.teal }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <div>جاري التحميل...</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: `${C.darkNavy}08`, borderBottom: `2px solid ${C.teal}20` }}>
                    {['المؤسسة', 'النوع', 'الدولة', 'الحالة', 'الشاشة', 'موثّقة', 'إجراءات'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, fontSize: '0.83rem', color: C.darkNavy, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {institutions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#9ca3af' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🌌</div>
                        لا توجد مؤسسات مطابقة
                      </td>
                    </tr>
                  ) : institutions.map((inst, i) => {
                    const typeMeta   = TYPE_META[inst.type]   || TYPE_META.default;
                    const statusMeta = STATUS_META[inst.status] || STATUS_META.inactive;
                    const isSelected = selected?.id === inst.id;
                    return (
                      <tr
                        key={inst.id}
                        style={{
                          borderBottom: `1px solid ${C.teal}10`,
                          background: isSelected ? `${C.teal}10` : i % 2 === 0 ? 'white' : `${C.lightMint}15`,
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelected(isSelected ? null : inst)}
                      >
                        {/* Institution Name */}
                        <td style={{ padding: '12px 16px' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: C.darkNavy, fontSize: '0.88rem' }}>
                              {inst.name_ar || inst.name}
                            </div>
                            {inst.name_ar && (
                              <div style={{ fontSize: '0.83rem', color: '#9ca3af' }}>{inst.name}</div>
                            )}
                          </div>
                        </td>
                        {/* Type */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.83rem', fontWeight: 600, background: typeMeta.bg, color: typeMeta.color, whiteSpace: 'nowrap' }}>
                            {typeMeta.label}
                          </span>
                        </td>
                        {/* Country */}
                        <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: '#555', whiteSpace: 'nowrap' }}>
                          {inst.city ? `${inst.city}، ` : ''}{inst.country}
                        </td>
                        {/* Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.83rem', fontWeight: 600, background: statusMeta.bg, color: statusMeta.color, whiteSpace: 'nowrap' }}>
                            {statusMeta.label}
                          </span>
                        </td>
                        {/* Screen */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.1rem' }}>{inst.screen_active ? '🟢' : '⚪'}</span>
                        </td>
                        {/* Verified */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.1rem' }}>{!!inst.is_verified ? '🔰' : '—'}</span>
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <Link
                              href={`/institutions/${inst.id}`}
                              target="_blank"
                              style={{ padding: '5px 10px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`, borderRadius: 8, color: C.teal, textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            >
                              عرض
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(inst)}
                              disabled={actionLoading === inst.id}
                              style={{
                                padding: '5px 10px',
                                background: inst.status === 'active' ? '#fee2e220' : '#dcfce720',
                                border: `1px solid ${inst.status === 'active' ? '#ef444430' : '#16a34a30'}`,
                                borderRadius: 8,
                                color: inst.status === 'active' ? '#ef4444' : '#16a34a',
                                cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap',
                              }}
                            >
                              {actionLoading === inst.id ? '...' : inst.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.teal}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                الصفحة {page} من {totalPages} — إجمالي {total} مؤسسة
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.teal}30`, background: 'white', color: C.teal, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.teal}30`, background: pg === page ? C.teal : 'white', color: pg === page ? 'white' : C.teal, cursor: 'pointer', fontWeight: pg === page ? 700 : 400 }}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.teal}30`, background: 'white', color: C.teal, cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Detail Panel ── */}
        {selected && (
          <div style={{
            width: 320, flexShrink: 0,
            background: 'white', borderRadius: 22,
            boxShadow: '0 8px 40px rgba(40,28,89,0.15), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden', position: 'sticky', top: 24,
            border: `1px solid ${C.teal}18`,
          }}>
            {/* Panel Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.darkNavy} 0%, #1a3a4a 100%)`, padding: '22px 20px 18px', color: 'white', position: 'relative', overflow: 'hidden' }}>
              {/* decorative circles */}
              <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: `${C.teal}20`, top: -45, left: -35, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: `${C.softGreen}15`, bottom: -25, right: 10, pointerEvents: 'none' }} />

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, boxShadow: `0 4px 16px ${C.teal}40` }}>
                      🏛️
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.3, color: C.lightMint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selected.name_ar || selected.name}
                      </div>
                      {selected.name_ar && (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                  >✕</button>
                </div>

                {/* Chips */}
                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: `${C.teal}35`, color: C.lightMint, border: '1px solid rgba(255,255,255,0.15)' }}>
                    {(TYPE_META[selected.type] || TYPE_META.default).label}
                  </span>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                    background: selected.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
                    color: selected.status === 'active' ? '#86efac' : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${selected.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`,
                  }}>
                    {(STATUS_META[selected.status] || STATUS_META.inactive).label}
                  </span>
                  {!!selected.is_verified && (
                    <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(237,247,189,0.2)', color: C.lightMint, border: '1px solid rgba(237,247,189,0.3)' }}>
                      🔰 موثّقة
                    </span>
                  )}
                </div>

                {/* Weight bar */}
                {selected.weight > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>⚖️ الوزن المعياري</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color:
                        selected.weight >= 80 ? '#86efac' : selected.weight >= 60 ? '#fde68a' : selected.weight >= 40 ? '#fb923c' : '#fca5a5'
                      }}>{selected.weight.toFixed(1)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${Math.min(100, selected.weight)}%`,
                        background: selected.weight >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)'
                          : selected.weight >= 60 ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                          : selected.weight >= 40 ? 'linear-gradient(90deg,#ea580c,#fb923c)'
                          : 'linear-gradient(90deg,#dc2626,#f87171)',
                        boxShadow: '0 0 8px rgba(255,255,255,0.2)',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div style={{ padding: '16px 18px 8px' }}>
              {[
                { icon: '🌍', label: 'الموقع', value: `${selected.city ? selected.city + '، ' : ''}${selected.country}` },
                { icon: '📅', label: 'سنة التأسيس', value: selected.founded_year ? String(selected.founded_year) : '—' },
                { icon: '👥', label: 'الموظفون', value: selected.employees_count ? `${selected.employees_count} موظف` : '—' },
                { icon: '📧', label: 'البريد الإلكتروني', value: selected.email || '—' },
                { icon: '🌐', label: 'الموقع الإلكتروني', value: selected.website || '—' },
                { icon: '📺', label: 'الشاشة', value: selected.screen_active ? 'نشطة ✅' : 'غير نشطة ⚪' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 11, background: '#f8fafc', border: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${C.teal}08`; e.currentTarget.style.borderColor = `${C.teal}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.teal}12`, border: `1px solid ${C.teal}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', flexShrink: 0 }}>{row.icon}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{row.label}</div>
                    <div style={{ fontSize: '0.83rem', color: C.darkNavy, fontWeight: 600, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.label === 'الموقع الإلكتروني' && selected.website
                        ? <a href={selected.website} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: 'none' }}>{selected.website}</a>
                        : row.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '8px 18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 1, background: `${C.teal}18`, margin: '4px 0 8px' }} />

              <Link href={`/institutions/${selected.id}`} target="_blank"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: `${C.teal}12`, border: `1.5px solid ${C.teal}30`, borderRadius: 12, color: C.teal, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.teal}22`; e.currentTarget.style.borderColor = `${C.teal}55`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${C.teal}12`; e.currentTarget.style.borderColor = `${C.teal}30`; }}
              >
                🔗 فتح صفحة المؤسسة
              </Link>

              <button
                onClick={() => handleToggleVerify(selected)}
                disabled={actionLoading === selected.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: !!selected.is_verified ? '#fef3c720' : '#ede9fe', border: `1.5px solid ${!!selected.is_verified ? '#d9770640' : '#7c3aed30'}`, borderRadius: 12, color: !!selected.is_verified ? '#b45309' : '#6d28d9', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {actionLoading === selected.id ? '⏳ جاري...' : !!selected.is_verified ? '🔰 إلغاء التوثيق' : '🔰 توثيق المؤسسة'}
              </button>

              <button
                onClick={() => handleToggleStatus(selected)}
                disabled={actionLoading === selected.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: selected.status === 'active' ? '#fee2e225' : '#dcfce730', border: `1.5px solid ${selected.status === 'active' ? '#ef444430' : '#16a34a30'}`, borderRadius: 12, color: selected.status === 'active' ? '#dc2626' : '#15803d', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {actionLoading === selected.id ? '⏳ جاري...' : selected.status === 'active' ? '⏸ إيقاف المؤسسة' : '▶ تفعيل المؤسسة'}
              </button>

              <button
                onClick={() => handleDelete(selected)}
                disabled={actionLoading === selected.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: '#fee2e225', border: '1.5px solid #ef444430', borderRadius: 12, color: '#dc2626', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fee2e225'; }}
              >
                🗑 حذف نهائي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
