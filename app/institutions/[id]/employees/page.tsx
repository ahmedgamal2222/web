'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchInstitution, getAuthHeaders } from '@/lib/api';
import { Institution } from '@/lib/types';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Employee {
  id: number;
  name: string;
  name_ar?: string;
  email: string;
  phone?: string;
  role: 'institution_admin' | 'employee' | 'explorer';
  position?: string;
  department?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

interface InviteForm {
  email: string;
  name: string;
  name_ar: string;
  role: 'institution_admin' | 'employee';
  position: string;
  department: string;
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  institution_admin: { label: 'مدير المؤسسة', color: C.darkNavy, bg: `${C.teal}20` },
  employee:          { label: 'موظف',          color: C.teal,     bg: `${C.softGreen}30` },
  explorer:          { label: 'زائر',           color: '#888',     bg: '#88888820' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  active:    { label: 'نشط',          color: C.softGreen },
  inactive:  { label: 'غير نشط',     color: '#9ca3af' },
  suspended: { label: 'موقوف',        color: '#ef4444' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function InstitutionEmployeesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canManage, setCanManage] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '', name: '', name_ar: '', role: 'employee', position: '', department: '',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [editLoading, setEditLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push(`/login?redirect=/institutions/${id}/employees`);
      return;
    }
    const u = JSON.parse(userStr);
    setCurrentUser(u);

    const manage =
      u.role === 'admin' ||
      (u.role === 'institution_admin' && String(u.institution_id) === String(id));
    setCanManage(manage);

    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [inst, empRes] = await Promise.all([
        fetchInstitution(id),
        fetch(`${API_BASE}/api/institutions/${id}/employees`, {
          headers: getAuthHeaders(),
        }),
      ]);
      setInstitution(inst);

      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.data || data || []);
      } else {
        const err = await empRes.json().catch(() => ({}));
        setError(err.error || 'فشل جلب بيانات الموظفين');
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${id}/employees/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الدعوة');
      setInviteSuccess('تم إرسال الدعوة بنجاح');
      setInviteForm({ email: '', name: '', name_ar: '', role: 'employee', position: '', department: '' });
      setTimeout(() => { setShowInvite(false); setInviteSuccess(''); }, 2000);
      await loadData();
    } catch (e: any) {
      setInviteError(e.message);
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleEditSave() {
    if (!editEmployee) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${editEmployee.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      setEditEmployee(null);
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleStatusChange(empId: number, status: string) {
    setActionLoading(empId);
    try {
      const res = await fetch(`${API_BASE}/api/users/${empId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(empId: number, empName: string) {
    if (!confirm(`هل أنت متأكد من إزالة ${empName} من المؤسسة؟`)) return;
    setActionLoading(empId);
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${id}/employees/${empId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإزالة');
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q ||
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.name_ar || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.position || '').toLowerCase().includes(q) ||
      (emp.department || '').toLowerCase().includes(q);
    const matchRole   = filterRole   === 'all' || emp.role   === filterRole;
    const matchStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchQ && matchRole && matchStatus;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1.5px solid ${C.teal}40`,
    borderRadius: 10, fontSize: '0.95rem', outline: 'none', color: C.darkNavy,
    background: 'white', boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: C.teal }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <div>جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, direction: 'rtl', padding: '20px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>

      {/* ─── Header ─── */}
      <div style={{ background: C.darkNavy, borderRadius: 20, padding: '28px 32px', marginBottom: 28, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: `${C.lightMint}80`, marginBottom: 6 }}>
            <Link href="/institutions" style={{ color: `${C.lightMint}80`, textDecoration: 'none' }}>المؤسسات</Link>
            {' / '}
            <Link href={`/institutions/${id}`} style={{ color: `${C.lightMint}80`, textDecoration: 'none' }}>{institution?.name_ar || institution?.name}</Link>
            {' / '}الموظفون
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>👥 موظفو {institution?.name_ar || institution?.name}</h1>
          <p style={{ color: `${C.lightMint}80`, margin: '6px 0 0', fontSize: '0.9rem' }}>{employees.length} موظف مسجّل</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {canManage && (
            <button
              onClick={() => setShowInvite(true)}
              style={{ background: C.teal, color: 'white', border: 'none', borderRadius: 40, padding: '10px 22px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
            >
              + دعوة موظف
            </button>
          )}
          <Link href={`/institutions/${id}`} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '10px 20px', borderRadius: 40, textDecoration: 'none', fontSize: '0.9rem' }}>
            ← العودة
          </Link>
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* ─── Filters ─── */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="ابحث باسم الموظف أو البريد أو المنصب..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, maxWidth: 320 }}
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle, maxWidth: 180, cursor: 'pointer' }}>
          <option value="all">كل الأدوار</option>
          <option value="institution_admin">مدير المؤسسة</option>
          <option value="employee">موظف</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 180, cursor: 'pointer' }}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="suspended">موقوف</option>
        </select>
        <span style={{ color: '#888', fontSize: '0.85rem', marginRight: 'auto' }}>
          {filtered.length} نتيجة
        </span>
      </div>

      {/* ─── Grid ─── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: '1.1rem' }}>لا يوجد موظفون مطابقون</div>
          {canManage && <div style={{ marginTop: 8, fontSize: '0.9rem' }}>ابدأ بدعوة موظفين للمؤسسة</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map(emp => {
            const roleMeta   = ROLE_META[emp.role]   || ROLE_META.explorer;
            const statusMeta = STATUS_META[emp.status] || STATUS_META.inactive;
            return (
              <div key={emp.id} style={{ background: 'white', borderRadius: 18, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: `1px solid ${C.teal}15`, transition: 'box-shadow 0.2s' }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                    {emp.avatar_url
                      ? <img src={emp.avatar_url} alt={emp.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
                      : getInitials(emp.name_ar || emp.name || '?')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: C.darkNavy, marginBottom: 2 }}>{emp.name_ar || emp.name}</div>
                    {emp.name && emp.name_ar && <div style={{ fontSize: '0.78rem', color: '#888' }}>{emp.name}</div>}
                    <div style={{ fontSize: '0.8rem', color: C.teal, marginTop: 2 }}>{emp.email}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: `${statusMeta.color}20`, color: statusMeta.color, flexShrink: 0 }}>
                    {statusMeta.label}
                  </span>
                </div>

                {/* Role */}
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: roleMeta.bg, color: roleMeta.color, marginBottom: 12 }}>
                  {roleMeta.label}
                </span>

                {/* Details */}
                <div style={{ fontSize: '0.84rem', color: '#555', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {emp.position   && <div>📌 {emp.position}</div>}
                  {emp.department && <div>🏢 {emp.department}</div>}
                  {emp.phone      && <div>📞 {emp.phone}</div>}
                  <div style={{ color: '#aaa' }}>انضم: {fmtDate(emp.created_at)}</div>
                  {emp.last_login && <div style={{ color: '#aaa' }}>آخر دخول: {fmtDate(emp.last_login)}</div>}
                </div>

                {/* Actions */}
                {canManage && (
                  <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setEditEmployee(emp); setEditForm({ position: emp.position, department: emp.department, role: emp.role, status: emp.status }); }}
                      style={{ flex: 1, padding: '8px 14px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`, borderRadius: 10, color: C.teal, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      ✏️ تعديل
                    </button>
                    {emp.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(emp.id, 'suspended')}
                        disabled={actionLoading === emp.id}
                        style={{ flex: 1, padding: '8px 14px', background: '#fee2e220', border: '1px solid #ef444430', borderRadius: 10, color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        {actionLoading === emp.id ? '...' : '🚫 إيقاف'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(emp.id, 'active')}
                        disabled={actionLoading === emp.id}
                        style={{ flex: 1, padding: '8px 14px', background: `${C.softGreen}20`, border: `1px solid ${C.softGreen}40`, borderRadius: 10, color: '#16a34a', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        {actionLoading === emp.id ? '...' : '✅ تفعيل'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(emp.id, emp.name_ar || emp.name)}
                      disabled={actionLoading === emp.id}
                      style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #ef444430', borderRadius: 10, color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Invite Modal ─── */}
      {showInvite && (
        <div onClick={e => e.target === e.currentTarget && setShowInvite(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: C.darkNavy, fontSize: '1.3rem' }}>دعوة موظف جديد</h2>
              <button onClick={() => setShowInvite(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {inviteError   && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: '0.9rem' }}>{inviteError}</div>}
            {inviteSuccess && <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#065f46', fontSize: '0.9rem' }}>{inviteSuccess}</div>}

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'email',      label: 'البريد الإلكتروني *', type: 'email',  placeholder: 'example@domain.com' },
                { key: 'name',       label: 'الاسم (إنجليزي) *',   type: 'text',  placeholder: 'Full Name' },
                { key: 'name_ar',    label: 'الاسم (عربي)',         type: 'text',  placeholder: 'الاسم بالعربية' },
                { key: 'position',   label: 'المنصب الوظيفي',       type: 'text',  placeholder: 'مثال: أستاذ، مدير قسم...' },
                { key: 'department', label: 'القسم / الإدارة',      type: 'text',  placeholder: 'مثال: قسم الأبحاث' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(inviteForm as any)[f.key]}
                    onChange={e => setInviteForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    required={f.key === 'email' || f.key === 'name'}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الدور الوظيفي *</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="employee">موظف</option>
                  <option value="institution_admin">مدير المؤسسة</option>
                </select>
              </div>
              <button type="submit" disabled={inviteLoading} style={{ padding: '12px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, fontSize: '1rem', cursor: inviteLoading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: inviteLoading ? 0.7 : 1 }}>
                {inviteLoading ? 'جاري الإرسال...' : '📧 إرسال الدعوة'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {editEmployee && (
        <div onClick={e => e.target === e.currentTarget && setEditEmployee(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: C.darkNavy, fontSize: '1.3rem' }}>تعديل: {editEmployee.name_ar || editEmployee.name}</h2>
              <button onClick={() => setEditEmployee(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'position',   label: 'المنصب الوظيفي', placeholder: 'مثال: أستاذ' },
                { key: 'department', label: 'القسم / الإدارة', placeholder: 'مثال: قسم الأبحاث' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={(editForm as any)[f.key] || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الدور</label>
                <select value={editForm.role || editEmployee.role} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="employee">موظف</option>
                  <option value="institution_admin">مدير المؤسسة</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الحالة</label>
                <select value={editForm.status || editEmployee.status} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="suspended">موقوف</option>
                </select>
              </div>
              <button onClick={handleEditSave} disabled={editLoading} style={{ padding: '12px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, fontSize: '1rem', cursor: editLoading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: editLoading ? 0.7 : 1 }}>
                {editLoading ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
