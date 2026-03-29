'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/api';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal:      '#4E8D9C',
  darkNavy:  '#281C59',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

interface User {
  id: number;
  name: string;
  name_ar?: string;
  email: string;
  phone?: string;
  role: 'admin' | 'institution_admin' | 'employee' | 'explorer';
  institution_id?: number;
  institution_name?: string;
  institution_name_ar?: string;
  position?: string;
  department?: string;
  status: 'active' | 'inactive' | 'suspended';
  is_verified?: boolean;
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

type FilterRole   = 'all' | 'admin' | 'institution_admin' | 'employee' | 'explorer';
type FilterStatus = 'all' | 'active' | 'inactive' | 'suspended';

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  admin:             { label: 'أدمن',          color: '#fff',      bg: C.darkNavy },
  institution_admin: { label: 'مدير مؤسسة',    color: C.darkNavy,  bg: `${C.teal}25` },
  employee:          { label: 'موظف',           color: C.teal,      bg: `${C.softGreen}30` },
  explorer:          { label: 'زائر',            color: '#6b7280',   bg: '#f3f4f6' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'نشط',      color: '#16a34a', bg: '#d1fae5' },
  inactive:  { label: 'غير نشط', color: '#6b7280', bg: '#f3f4f6' },
  suspended: { label: 'موقوف',    color: '#ef4444', bg: '#fee2e2' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '18px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const PAGE_SIZE = 30;

  const [search,       setSearch]       = useState('');
  const [filterRole,   setFilterRole]   = useState<FilterRole>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const [selected, setSelected] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', name: '', name_ar: '', role: 'explorer' as User['role'], password: '', institution_id: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [institutions, setInstitutions] = useState<{ id: number; name_ar?: string; name: string }[]>([]);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/users');
      return;
    }
    loadUsers();
    loadInstitutions();
  }, [page, filterRole, filterStatus]);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const url = new URL(`${API_BASE}/api/users`);
      url.searchParams.set('page',  String(page));
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (filterRole   !== 'all') url.searchParams.set('role',   filterRole);
      if (filterStatus !== 'all') url.searchParams.set('status', filterStatus);
      if (search.trim())          url.searchParams.set('q',      search.trim());

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب المستخدمين');
      setUsers(data.data || data.users || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadInstitutions() {
    try {
      const res = await fetch(`${API_BASE}/api/institutions?limit=300`, { headers: getAuthHeaders() });
      const data = await res.json();
      setInstitutions(data.data || []);
    } catch (_) {}
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  async function handleStatusChange(userId: number, status: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/status`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      await loadUsers();
      if (selected?.id === userId) setSelected(prev => prev ? { ...prev, status: status as any } : null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: number, userName: string) {
    if (!confirm(`هل تريد حذف المستخدم "${userName}" نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE', headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      setSelected(null);
      await loadUsers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEditSave() {
    if (!selected) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${selected.id}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      setEditMode(false);
      setSelected(prev => prev ? { ...prev, ...editForm } : null);
      await loadUsers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const body: any = { ...createForm };
      if (body.institution_id) body.institution_id = parseInt(body.institution_id);
      else delete body.institution_id;

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء المستخدم');
      setCreateModal(false);
      setCreateForm({ email: '', name: '', name_ar: '', role: 'explorer', password: '', institution_id: '' });
      await loadUsers();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  }

  // Stats from current loaded users
  const stats = useMemo(() => {
    const roles = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);
    const active = users.filter(u => u.status === 'active').length;
    return {
      active,
      admin:             roles['admin']             || 0,
      institution_admin: roles['institution_admin'] || 0,
      employee:          roles['employee']          || 0,
      explorer:          roles['explorer']          || 0,
    };
  }, [users]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1.5px solid ${C.teal}40`,
    borderRadius: 10, fontSize: '0.95rem', outline: 'none', color: C.darkNavy,
    background: 'white', boxSizing: 'border-box',
  };

  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>

      {/* ─── Header ─── */}
      <div style={{ background: C.darkNavy, borderRadius: 20, padding: '28px 32px', marginBottom: 28, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: `${C.lightMint}70`, marginBottom: 6 }}>
            <Link href="/admin" style={{ color: `${C.lightMint}70`, textDecoration: 'none' }}>لوحة التحكم</Link> / المستخدمون
          </div>
          <h1 style={{ fontSize: '1.9rem', margin: 0 }}>👥 إدارة المستخدمين</h1>
          <p style={{ color: `${C.lightMint}80`, margin: '6px 0 0', fontSize: '0.9rem' }}>{total} مستخدم مسجّل في النظام</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setCreateModal(true)}
            style={{ background: C.teal, color: 'white', border: 'none', borderRadius: 40, padding: '10px 22px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
          >
            + مستخدم جديد
          </button>
          <Link href="/admin" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '10px 20px', borderRadius: 40, textDecoration: 'none', fontSize: '0.9rem' }}>
            ← لوحة التحكم
          </Link>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatBadge value={stats.active    || 0} label="نشط"          color={C.softGreen} />
        <StatBadge value={stats.admin     || 0} label="أدمن"          color={C.darkNavy}  />
        <StatBadge value={stats.institution_admin || 0} label="مدراء مؤسسات" color={C.teal} />
        <StatBadge value={stats.employee  || 0} label="موظفون"        color="#7c3aed"     />
        <StatBadge value={stats.explorer  || 0} label="زوار"          color="#9ca3af"     />
      </div>

      {/* ─── Filters + Search ─── */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: 320 }}
          />
          <select value={filterRole} onChange={e => { setFilterRole(e.target.value as FilterRole); setPage(1); }} style={{ ...inputStyle, maxWidth: 180, cursor: 'pointer' }}>
            <option value="all">كل الأدوار</option>
            <option value="admin">أدمن</option>
            <option value="institution_admin">مدير مؤسسة</option>
            <option value="employee">موظف</option>
            <option value="explorer">زائر</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as FilterStatus); setPage(1); }} style={{ ...inputStyle, maxWidth: 180, cursor: 'pointer' }}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="suspended">موقوف</option>
          </select>
          <button type="submit" style={{ padding: '10px 22px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            🔍 بحث
          </button>
        </form>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* ─── Loading ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.teal }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <div>جاري التحميل...</div>
        </div>
      ) : (
        <>
          {/* ─── Table ─── */}
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: `${C.darkNavy}08`, borderBottom: `2px solid ${C.teal}20` }}>
                    {['المستخدم', 'الدور', 'المؤسسة', 'الحالة', 'تاريخ التسجيل', 'إجراءات'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: C.darkNavy, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        لا يوجد مستخدمون مطابقون
                      </td>
                    </tr>
                  ) : users.map((u, i) => {
                    const roleMeta   = ROLE_META[u.role]   || ROLE_META.explorer;
                    const statusMeta = STATUS_META[u.status] || STATUS_META.inactive;
                    return (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${C.teal}10`, background: i % 2 === 0 ? 'white' : `${C.lightMint}15`, transition: 'background 0.15s' }}>
                        {/* User */}
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => { setSelected(u); setEditMode(false); setEditForm({ name: u.name, name_ar: u.name_ar, role: u.role, position: u.position, department: u.department, status: u.status, institution_id: u.institution_id }); }} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', padding: 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                              {getInitials(u.name_ar || u.name || '?')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: C.darkNavy, fontSize: '0.9rem' }}>{u.name_ar || u.name}</div>
                              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{u.email}</div>
                            </div>
                          </button>
                        </td>
                        {/* Role */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, background: roleMeta.bg, color: roleMeta.color }}>
                            {roleMeta.label}
                          </span>
                        </td>
                        {/* Institution */}
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#555' }}>
                          {u.institution_id
                            ? <Link href={`/institutions/${u.institution_id}`} style={{ color: C.teal, textDecoration: 'none', fontWeight: 500 }}>{u.institution_name_ar || u.institution_name || `#${u.institution_id}`}</Link>
                            : <span style={{ color: '#ccc' }}>—</span>}
                        </td>
                        {/* Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, background: statusMeta.bg, color: statusMeta.color }}>
                            {statusMeta.label}
                          </span>
                        </td>
                        {/* Date */}
                        <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {fmtDate(u.created_at)}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => { setSelected(u); setEditMode(false); setEditForm({ name: u.name, name_ar: u.name_ar, role: u.role, position: u.position, department: u.department, status: u.status, institution_id: u.institution_id }); }}
                              style={{ padding: '5px 10px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`, borderRadius: 8, color: C.teal, cursor: 'pointer', fontSize: '0.8rem' }}
                            >عرض</button>
                            {u.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(u.id, 'suspended')}
                                disabled={actionLoading === u.id}
                                style={{ padding: '5px 10px', background: '#fee2e220', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                              >{actionLoading === u.id ? '...' : 'إيقاف'}</button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(u.id, 'active')}
                                disabled={actionLoading === u.id}
                                style={{ padding: '5px 10px', background: '#d1fae520', border: '1px solid #10b98130', borderRadius: 8, color: '#16a34a', cursor: 'pointer', fontSize: '0.8rem' }}
                              >{actionLoading === u.id ? '...' : 'تفعيل'}</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Pagination ─── */}
          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 38, height: 38, borderRadius: '50%', border: page === p ? 'none' : `1px solid ${C.teal}30`, background: page === p ? C.teal : 'white', color: page === p ? 'white' : C.teal, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── User Detail / Edit Drawer ─── */}
      {selected && (
        <div onClick={e => e.target === e.currentTarget && setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 22, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${C.teal},${C.darkNavy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>
                  {getInitials(selected.name_ar || selected.name || '?')}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem', color: C.darkNavy }}>{selected.name_ar || selected.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{selected.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} style={{ padding: '6px 14px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`, borderRadius: 10, color: C.teal, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>✏️ تعديل</button>
                )}
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>✕</button>
              </div>
            </div>

            {!editMode ? (
              /* ── View mode ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['الدور',        ROLE_META[selected.role]?.label || selected.role],
                  ['الحالة',       STATUS_META[selected.status]?.label || selected.status],
                  ['المؤسسة',      selected.institution_name_ar || selected.institution_name || '—'],
                  ['المنصب',       selected.position || '—'],
                  ['القسم',        selected.department || '—'],
                  ['الهاتف',       selected.phone || '—'],
                  ['تاريخ التسجيل', fmtDate(selected.created_at)],
                  ['آخر دخول',     fmtDate(selected.last_login)],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ display: 'flex', gap: 12, fontSize: '0.9rem', borderBottom: `1px solid ${C.teal}10`, paddingBottom: 10 }}>
                    <span style={{ color: '#9ca3af', minWidth: 130, flexShrink: 0 }}>{label}</span>
                    <span style={{ color: C.darkNavy, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  {selected.institution_id && (
                    <Link href={`/institutions/${selected.institution_id}/employees`} style={{ flex: 1, padding: '10px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`, borderRadius: 12, color: C.teal, textDecoration: 'none', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                      🏢 موظفو المؤسسة
                    </Link>
                  )}
                  {selected.status === 'active' ? (
                    <button onClick={() => handleStatusChange(selected.id, 'suspended')} disabled={actionLoading === selected.id} style={{ flex: 1, padding: '10px', background: '#fee2e2', border: '1px solid #ef444330', borderRadius: 12, color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                      {actionLoading === selected.id ? '...' : '🚫 إيقاف الحساب'}
                    </button>
                  ) : (
                    <button onClick={() => handleStatusChange(selected.id, 'active')} disabled={actionLoading === selected.id} style={{ flex: 1, padding: '10px', background: '#d1fae5', border: '1px solid #10b98130', borderRadius: 12, color: '#16a34a', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                      {actionLoading === selected.id ? '...' : '✅ تفعيل الحساب'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(selected.id, selected.name_ar || selected.name)} disabled={actionLoading === selected.id} style={{ padding: '10px 16px', background: '#fee2e2', border: '1px solid #ef444330', borderRadius: 12, color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>
                    {actionLoading === selected.id ? '...' : '🗑️ حذف'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Edit mode ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'name',       label: 'الاسم (إنجليزي)',    type: 'text' },
                  { key: 'name_ar',    label: 'الاسم (عربي)',        type: 'text' },
                  { key: 'position',   label: 'المنصب الوظيفي',     type: 'text' },
                  { key: 'department', label: 'القسم / الإدارة',    type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={(editForm as any)[f.key] || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الدور</label>
                  <select value={editForm.role || selected.role} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="admin">أدمن</option>
                    <option value="institution_admin">مدير مؤسسة</option>
                    <option value="employee">موظف</option>
                    <option value="explorer">زائر</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الحالة</label>
                  <select value={editForm.status || selected.status} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">موقوف</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>المؤسسة</label>
                  <select value={editForm.institution_id || ''} onChange={e => setEditForm(prev => ({ ...prev, institution_id: e.target.value ? parseInt(e.target.value) : undefined }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">بدون مؤسسة</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name_ar || inst.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={handleEditSave} disabled={saveLoading} style={{ flex: 1, padding: '12px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, cursor: saveLoading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saveLoading ? 0.7 : 1 }}>
                    {saveLoading ? 'جاري الحفظ...' : '💾 حفظ'}
                  </button>
                  <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 40, cursor: 'pointer', fontWeight: 600 }}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Create User Modal ─── */}
      {createModal && (
        <div onClick={e => e.target === e.currentTarget && setCreateModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 22, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: C.darkNavy, fontSize: '1.3rem' }}>➕ مستخدم جديد</h2>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {createError && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: '0.9rem' }}>{createError}</div>}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'email',    label: 'البريد الإلكتروني *', type: 'email',    placeholder: 'example@domain.com' },
                { key: 'name',     label: 'الاسم (إنجليزي) *',   type: 'text',    placeholder: 'Full Name' },
                { key: 'name_ar',  label: 'الاسم (عربي)',         type: 'text',    placeholder: 'الاسم بالعربية' },
                { key: 'password', label: 'كلمة المرور *',        type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(createForm as any)[f.key]}
                    onChange={e => setCreateForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    required={['email', 'name', 'password'].includes(f.key)}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الدور *</label>
                <select value={createForm.role} onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="explorer">زائر</option>
                  <option value="employee">موظف</option>
                  <option value="institution_admin">مدير مؤسسة</option>
                  <option value="admin">أدمن</option>
                </select>
              </div>

              {(createForm.role === 'employee' || createForm.role === 'institution_admin') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>المؤسسة</label>
                  <select value={createForm.institution_id} onChange={e => setCreateForm(prev => ({ ...prev, institution_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">اختر مؤسسة...</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name_ar || inst.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" disabled={createLoading} style={{ padding: '12px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, cursor: createLoading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', opacity: createLoading ? 0.7 : 1, marginTop: 4 }}>
                {createLoading ? 'جاري الإنشاء...' : '✅ إنشاء الحساب'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
