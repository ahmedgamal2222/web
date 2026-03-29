'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface Employee {
  id: number;
  email: string;
  name: string;
  name_ar?: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  position?: string;
  department?: string;
  is_active: boolean;
  status?: string;
  last_login?: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  institution_admin: 'مدير المؤسسة',
  employee: 'موظف',
  admin: 'مدير النظام',
};

const ROLE_COLORS: Record<string, string> = {
  institution_admin: '#4E8D9C',
  employee: '#85C79A',
  admin: '#EDF7BD',
};

function getSessionId(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sessionId') || '';
  }
  return '';
}

// ─── Invite Modal ────────────────────────────────────────────
interface InviteModalProps {
  institutionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function InviteModal({ institutionId, onClose, onSuccess }: InviteModalProps) {
  const [form, setForm] = useState({ email: '', name: '', name_ar: '', role: 'employee', position: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${institutionId}/employees/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          name_ar: form.name_ar || undefined,
          role: form.role,
          position: form.position || undefined,
          department: form.department || undefined,
        }),
      });
      const data = await res.json() as any;
      if (!data.success) throw new Error(data.error || 'فشل الحفظ');
      if (data.temp_password) {
        setTempPassword(data.temp_password);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(5,4,20,0.6)',
    border: '1px solid rgba(78,141,156,0.35)',
    borderRadius: 10,
    color: '#e8f4f8',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    color: '#9ab0c0',
    marginBottom: 6,
  };

  if (tempPassword) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: 'rgba(8,5,32,0.97)', borderRadius: 20, padding: 40, maxWidth: 440, width: '90%', border: '1px solid rgba(78,141,156,0.3)', direction: 'rtl', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h3 style={{ color: '#EDF7BD', marginBottom: 12 }}>تمت الإضافة بنجاح</h3>
          <p style={{ color: '#9ab0c0', marginBottom: 20, fontSize: '0.9rem' }}>كلمة المرور المؤقتة للموظف الجديد:</p>
          <div style={{ background: 'rgba(78,141,156,0.15)', border: '1px solid rgba(78,141,156,0.4)', borderRadius: 12, padding: '14px 20px', marginBottom: 24 }}>
            <code style={{ color: '#EDF7BD', fontSize: '1.2rem', letterSpacing: '0.1em' }}>{tempPassword}</code>
          </div>
          <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: 24 }}>احتفظ بهذه الكلمة — لن تُعرض مرة أخرى.</p>
          <button
            onClick={() => { onSuccess(); onClose(); }}
            style={{ background: 'linear-gradient(135deg, #85C79A, #4E8D9C)', border: 'none', borderRadius: 30, padding: '12px 32px', color: '#281C59', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
          >
            موافق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'rgba(8,5,32,0.97)', borderRadius: 20, padding: 36, maxWidth: 500, width: '90%', border: '1px solid rgba(78,141,156,0.3)', direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#EDF7BD', fontSize: '1.1rem', fontWeight: 700 }}>➕ إضافة موظف جديد</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#ff505015', border: '1px solid #ff505050', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#ff8080', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>الاسم *</label>
              <input required style={inputStyle} placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>الاسم بالعربية</label>
              <input style={inputStyle} placeholder="الاسم الكامل" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>البريد الإلكتروني *</label>
            <input required type="email" style={inputStyle} placeholder="employee@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>الدور</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="employee">موظف</option>
              <option value="institution_admin">مدير المؤسسة</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>المنصب الوظيفي</label>
              <input style={inputStyle} placeholder="مثال: مشرف" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>القسم</label>
              <input style={inputStyle} placeholder="مثال: قسم التعليم" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{
              flex: 1, background: 'linear-gradient(135deg, #85C79A, #4E8D9C)', border: 'none',
              borderRadius: 30, padding: '12px', color: '#281C59', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontSize: '0.95rem',
            }}>
              {loading ? 'جاري الإضافة...' : 'إضافة الموظف'}
            </button>
            <button type="button" onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 30, padding: '12px 20px', color: '#888', cursor: 'pointer', fontSize: '0.95rem',
            }}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Employee Card ────────────────────────────────────────────
function EmployeeCard({ employee, canManage, onRemove }: { employee: Employee; canManage: boolean; onRemove: (id: number) => void }) {
  const [removing, setRemoving] = useState(false);

  const initials = (employee.name_ar || employee.name || '?').charAt(0).toUpperCase();
  const roleColor = ROLE_COLORS[employee.role] || '#9ab0c0';
  const roleLabel = ROLE_LABELS[employee.role] || employee.role;

  async function handleRemove() {
    if (!confirm(`هل تريد إزالة "${employee.name_ar || employee.name}" من المؤسسة؟`)) return;
    setRemoving(true);
    onRemove(employee.id);
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${roleColor}30`,
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,141,156,0.07)'; e.currentTarget.style.borderColor = `${roleColor}60`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = `${roleColor}30`; }}
    >
      {/* Avatar */}
      {employee.avatar_url ? (
        <img src={employee.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${roleColor}` }} />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${roleColor}, #281C59)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '1.2rem',
          boxShadow: `0 0 12px ${roleColor}40`,
          flexShrink: 0,
        }}>
          {initials}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontWeight: 600, color: '#e8f4f8', fontSize: '0.95rem', marginBottom: 3 }}>
          {employee.name_ar || employee.name}
        </div>
        <div style={{ fontSize: '0.83rem', color: '#6a8090', marginBottom: 4 }}>{employee.email}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}40`, borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>
            {roleLabel}
          </span>
          {employee.position && (
            <span style={{ background: 'rgba(255,255,255,0.05)', color: '#9ab0c0', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem' }}>
              {employee.position}
            </span>
          )}
          {employee.department && (
            <span style={{ background: 'rgba(255,255,255,0.04)', color: '#7a9aa8', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem' }}>
              {employee.department}
            </span>
          )}
          <span style={{
            background: employee.is_active ? '#85C79A18' : 'rgba(158,158,158,0.1)',
            color: employee.is_active ? '#85C79A' : '#9E9E9E',
            borderRadius: 20, padding: '2px 8px', fontSize: '0.78rem',
          }}>
            {employee.status === 'suspended' ? '⛔ موقوف' : employee.is_active ? '✅ نشط' : '⚪ غير نشط'}
          </span>
        </div>
      </div>

      {/* Remove */}
      {canManage && (
        <button
          onClick={handleRemove}
          disabled={removing}
          title="إزالة الموظف"
          style={{
            background: 'rgba(255,80,80,0.08)',
            border: '1px solid rgba(255,80,80,0.2)',
            borderRadius: 10,
            color: '#ff8080',
            width: 36, height: 36,
            cursor: removing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem',
            flexShrink: 0,
            transition: 'all 0.2s',
            opacity: removing ? 0.5 : 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.2)'; }}
        >
          🗑️
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EmployeesPage() {
  const [institutionId, setInstitutionId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [institutionName, setInstitutionName] = useState('');

  // Get institution ID from URL
  useEffect(() => {
    const id = window.location.pathname.split('/').filter(Boolean)[1] ?? '';
    setInstitutionId(id);
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  async function loadEmployees(id: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${id}/employees`, {
        headers: { 'X-Session-ID': getSessionId() },
      });
      const data = await res.json() as any;
      if (!data.success) throw new Error(data.error || 'فشل التحميل');
      setEmployees((data.data ?? []).filter((e: any) => e != null && e.id != null));
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل الموظفين');
    } finally {
      setLoading(false);
    }
  }

  async function loadInstitution(id: string) {
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${id}`);
      const data = await res.json() as any;
      if (data.success && data.data) {
        setInstitutionName(data.data.name_ar || data.data.name || '');
      }
    } catch {}
  }

  useEffect(() => {
    if (!institutionId) return;
    loadEmployees(institutionId);
    loadInstitution(institutionId);
  }, [institutionId]);

  async function handleRemove(userId: number) {
    try {
      const res = await fetch(`${API_BASE}/api/institutions/${institutionId}/employees/${userId}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': getSessionId() },
      });
      const data = await res.json() as any;
      if (!data.success) throw new Error(data.error || 'فشل الإزالة');
      setEmployees(prev => prev.filter(e => e.id !== userId));
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الإزالة');
    }
  }

  const canManage = user?.role === 'admin' ||
    (user?.role === 'institution_admin' && String(user?.institution_id) === institutionId);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || (e.name_ar || e.name || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  const admins = filtered.filter(e => e.role === 'institution_admin');
  const staff = filtered.filter(e => e.role !== 'institution_admin');

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, #0d0b2a 0%, #05041a 60%, #020210 100%)',
      direction: 'rtl',
      fontFamily: "'Cairo', 'Segoe UI', system-ui, sans-serif",
      color: '#e8f4f8',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(5,4,20,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(78,141,156,0.2)',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/institutions/${institutionId}`} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#4E8D9C', textDecoration: 'none', fontSize: '0.88rem',
            padding: '6px 12px', borderRadius: 20,
            border: '1px solid rgba(78,141,156,0.2)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(78,141,156,0.6)'; e.currentTarget.style.color = '#85C79A'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(78,141,156,0.2)'; e.currentTarget.style.color = '#4E8D9C'; }}
          >
            ← العودة للمؤسسة
          </Link>
          <span style={{ color: 'rgba(78,141,156,0.4)' }}>|</span>
          <span style={{ fontWeight: 700, color: '#EDF7BD', fontSize: '0.95rem' }}>
            👥 إدارة الموظفين
            {institutionName && <span style={{ color: '#4E8D9C', fontWeight: 400, marginRight: 6 }}>— {institutionName}</span>}
          </span>
        </div>

        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            style={{
              background: 'linear-gradient(135deg, #85C79A, #4E8D9C)',
              border: 'none', borderRadius: 30, padding: '9px 20px',
              color: '#281C59', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ➕ إضافة موظف
          </button>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        {/* Stats */}
        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'إجمالي الموظفين', value: employees.length, color: COLORS.teal, icon: '👥' },
              { label: 'المديرون', value: employees.filter(e => e.role === 'institution_admin').length, color: '#EDF7BD', icon: '⭐' },
              { label: 'الموظفون النشطون', value: employees.filter(e => e.is_active && e.status !== 'suspended').length, color: COLORS.softGreen, icon: '✅' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${stat.color}25`,
                borderRadius: 14, padding: '16px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                  <span style={{ marginLeft: 6, fontSize: '1rem' }}>{stat.icon}</span>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6a8090', marginTop: 5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {!loading && !error && employees.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="search"
              placeholder="🔍 بحث بالاسم أو البريد..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 200, padding: '10px 16px',
                background: 'rgba(5,4,20,0.6)', border: '1px solid rgba(78,141,156,0.3)',
                borderRadius: 30, color: '#e8f4f8', fontSize: '0.88rem', outline: 'none',
              }}
            />
            {['all', 'institution_admin', 'employee'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '10px 18px', borderRadius: 30, border: `1px solid ${roleFilter === r ? COLORS.teal : 'rgba(255,255,255,0.1)'}`,
                background: roleFilter === r ? `${COLORS.teal}20` : 'transparent',
                color: roleFilter === r ? COLORS.teal : '#888',
                cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s',
              }}>
                {r === 'all' ? 'الكل' : ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              width: 40, height: 40, border: `3px solid ${COLORS.teal}`,
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 1s linear infinite', margin: '0 auto 20px',
            }} />
            <p style={{ color: '#4E8D9C' }}>جاري تحميل الموظفين...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#ff505012', border: '1px solid rgba(255,80,80,0.2)',
            borderRadius: 16, padding: '40px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#ff8080', marginBottom: 16 }}>{error}</p>
            {error.includes('مصرح') || error.includes('403') ? (
              <p style={{ color: '#666', fontSize: '0.85rem' }}>ليس لديك صلاحية لعرض موظفي هذه المؤسسة</p>
            ) : (
              <button onClick={() => loadEmployees(institutionId)} style={{
                background: `${COLORS.teal}20`, border: `1px solid ${COLORS.teal}`,
                borderRadius: 20, padding: '10px 24px', color: COLORS.teal, cursor: 'pointer',
              }}>
                إعادة المحاولة
              </button>
            )}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && employees.length === 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: `1px dashed ${COLORS.teal}`,
            borderRadius: 16, padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div>
            <h3 style={{ color: '#EDF7BD', marginBottom: 8 }}>لا يوجد موظفون بعد</h3>
            <p style={{ color: '#6a8090', marginBottom: canManage ? 20 : 0 }}>لم يتم إضافة أي موظف لهذه المؤسسة حتى الآن.</p>
            {canManage && (
              <button onClick={() => setShowInvite(true)} style={{
                background: 'linear-gradient(135deg, #85C79A, #4E8D9C)', border: 'none',
                borderRadius: 30, padding: '12px 28px', color: '#281C59', fontWeight: 700, cursor: 'pointer',
              }}>
                ➕ إضافة أول موظف
              </button>
            )}
          </div>
        )}

        {/* Admins section */}
        {!loading && !error && admins.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: '#EDF7BD', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⭐</span> مديرو المؤسسة ({admins.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {admins.map(e => (
                <EmployeeCard key={e.id} employee={e} canManage={canManage} onRemove={handleRemove} />
              ))}
            </div>
          </div>
        )}

        {/* Staff section */}
        {!loading && !error && staff.length > 0 && (
          <div>
            <h3 style={{ color: '#85C79A', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👤</span> موظفو المؤسسة ({staff.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staff.map(e => (
                <EmployeeCard key={e.id} employee={e} canManage={canManage} onRemove={handleRemove} />
              ))}
            </div>
          </div>
        )}

        {/* No filter results */}
        {!loading && !error && employees.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            لا توجد نتائج للبحث
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          institutionId={institutionId}
          onClose={() => setShowInvite(false)}
          onSuccess={() => loadEmployees(institutionId)}
        />
      )}
    </main>
  );
}