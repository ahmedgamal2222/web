'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

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
  }, [page, filterType, filterStatus, filterScreen]);

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
                          <span style={{ fontSize: '1.1rem' }}>{inst.is_verified ? '🔰' : '—'}</span>
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
            width: 300, flexShrink: 0,
            background: 'white', borderRadius: 18,
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden', position: 'sticky', top: 24,
          }}>
            {/* Panel Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.darkNavy}, ${C.teal})`, padding: '20px 20px 16px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.3 }}>
                    {selected.name_ar || selected.name}
                  </div>
                  {selected.name_ar && (
                    <div style={{ fontSize: '0.83rem', color: `${C.lightMint}80`, marginTop: 4 }}>{selected.name}</div>
                  )}
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, background: 'rgba(255,255,255,0.18)', color: 'white' }}>
                  {(TYPE_META[selected.type] || TYPE_META.default).label}
                </span>
                {selected.is_verified && (
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, background: 'rgba(237,247,189,0.25)', color: C.lightMint }}>
                    🔰 موثّقة
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: '18px 20px' }}>
              {[
                { icon: '🌍', label: 'الموقع', value: `${selected.city ? selected.city + '، ' : ''}${selected.country}` },
                { icon: '📅', label: 'تأسست', value: selected.founded_year ? String(selected.founded_year) : '—' },
                { icon: '👥', label: 'الموظفون', value: selected.employees_count ? String(selected.employees_count) : '—' },
                { icon: '📧', label: 'البريد', value: selected.email || '—' },
                { icon: '🌐', label: 'الموقع الإلكتروني', value: selected.website || '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{row.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>{row.label}</div>
                    <div style={{ fontSize: '0.85rem', color: C.darkNavy, fontWeight: 500, wordBreak: 'break-all' }}>
                      {row.label === 'الموقع الإلكتروني' && selected.website
                        ? <a href={selected.website} target="_blank" rel="noopener noreferrer" style={{ color: C.teal }}>{selected.website}</a>
                        : row.value}
                    </div>
                  </div>
                </div>
              ))}

              {/* Status badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.83rem', fontWeight: 600, ...(STATUS_META[selected.status] || STATUS_META.inactive) }}>
                  {(STATUS_META[selected.status] || STATUS_META.inactive).label}
                </span>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.83rem', fontWeight: 600, background: selected.screen_active ? '#dcfce7' : '#f3f4f6', color: selected.screen_active ? '#16a34a' : '#6b7280' }}>
                  {selected.screen_active ? '📺 شاشة نشطة' : '📺 شاشة غير نشطة'}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <Link href={`/institutions/${selected.id}`} target="_blank"
                  style={{ display: 'block', textAlign: 'center', padding: '10px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`, borderRadius: 10, color: C.teal, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}>
                  🔗 فتح صفحة المؤسسة
                </Link>

                <button
                  onClick={() => handleToggleVerify(selected)}
                  disabled={actionLoading === selected.id}
                  style={{ padding: '10px', background: selected.is_verified ? '#fef3c7' : '#ede9fe', border: `1px solid ${selected.is_verified ? '#d97706' : '#7c3aed'}30`, borderRadius: 10, color: selected.is_verified ? '#d97706' : '#7c3aed', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  {selected.is_verified ? '🔰 إلغاء التوثيق' : '🔰 توثيق المؤسسة'}
                </button>

                <button
                  onClick={() => handleToggleStatus(selected)}
                  disabled={actionLoading === selected.id}
                  style={{ padding: '10px', background: selected.status === 'active' ? '#fee2e2' : '#dcfce7', border: `1px solid ${selected.status === 'active' ? '#ef4444' : '#16a34a'}30`, borderRadius: 10, color: selected.status === 'active' ? '#ef4444' : '#16a34a', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  {actionLoading === selected.id ? '...' : selected.status === 'active' ? '⏸ إيقاف المؤسسة' : '▶ تفعيل المؤسسة'}
                </button>

                <button
                  onClick={() => handleDelete(selected)}
                  disabled={actionLoading === selected.id}
                  style={{ padding: '10px', background: '#fee2e2', border: '1px solid #ef444430', borderRadius: 10, color: '#ef4444', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  🗑 حذف نهائي
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
