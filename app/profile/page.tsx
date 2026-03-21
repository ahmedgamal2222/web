'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/api';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal:      '#4E8D9C',
  darkNavy:  '#281C59',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface UserProfile {
  id: number;
  name: string;
  name_ar?: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  role: string;
  institution_id?: number;
  institution_name?: string;
  institution_name_ar?: string;
  position?: string;
  department?: string;
  status: string;
  is_verified?: boolean;
  created_at: string;
  last_login?: string;
  social_links?: { twitter?: string; linkedin?: string; website?: string };
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  link?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin:             'أدمن النظام',
  institution_admin: 'مدير مؤسسة',
  employee:          'موظف',
  explorer:          'مستكشف',
};

const ROLE_COLORS: Record<string, string> = {
  admin:             C.darkNavy,
  institution_admin: C.teal,
  employee:          C.softGreen,
  explorer:          '#9ca3af',
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile & { social_twitter: string; social_linkedin: string; social_website: string }>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError,   setSaveError]   = useState('');

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError,   setPwdError]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [actsLoading, setActsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/profile');
      return;
    }
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الملف الشخصي');
      const p: UserProfile = data.user || data.data || data;
      setProfile(p);
      const social = p.social_links || {};
      setEditForm({
        name:     p.name,
        name_ar:  p.name_ar,
        phone:    p.phone,
        bio:      p.bio,
        position: p.position,
        department: p.department,
        social_twitter:  social.twitter || '',
        social_linkedin: social.linkedin || '',
        social_website:  social.website  || '',
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities() {
    setActsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/activities`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.data || data || []);
      }
    } catch (_) {}
    setActsLoading(false);
  }

  useEffect(() => {
    if (activeTab === 'activity') loadActivities();
  }, [activeTab]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const payload: any = {
        name:       editForm.name,
        name_ar:    editForm.name_ar,
        phone:      editForm.phone,
        bio:        editForm.bio,
        position:   editForm.position,
        department: editForm.department,
        social_links: {
          twitter:  editForm.social_twitter,
          linkedin: editForm.social_linkedin,
          website:  editForm.social_website,
        },
      };
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      setSaveSuccess('تم تحديث الملف الشخصي بنجاح ✓');
      setEditMode(false);
      // Update localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        localStorage.setItem('user', JSON.stringify({ ...u, name: payload.name, name_ar: payload.name_ar }));
      }
      await loadProfile();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdError('كلمتا المرور الجديدتان غير متطابقتين');
      return;
    }
    if (pwdForm.next.length < 8) {
      setPwdError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ current_password: pwdForm.current, new_password: pwdForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');
      setPwdSuccess('تم تغيير كلمة المرور بنجاح ✓');
      setPwdForm({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setPwdLoading(false);
    }
  }

  function handleLogout() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
    router.push('/login');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1.5px solid ${C.teal}40`,
    borderRadius: 10, fontSize: '0.95rem', outline: 'none', color: C.darkNavy,
    background: 'white', boxSizing: 'border-box',
  };

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '10px 22px', borderRadius: 40, fontSize: '0.9rem', fontWeight: 600,
        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
        background: activeTab === tab ? C.teal : 'transparent',
        color:      activeTab === tab ? 'white' : C.teal,
      }}
    >{label}</button>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: C.teal }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
          <div>جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</div>
          <div>{error || 'فشل تحميل الملف الشخصي'}</div>
          <button onClick={loadProfile} style={{ marginTop: 16, padding: '10px 24px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, cursor: 'pointer' }}>إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>

      {/* ─── Cover + Avatar ─── */}
      <div style={{ background: `linear-gradient(135deg, ${C.darkNavy} 0%, ${C.teal} 100%)`, height: 220, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(133,199,154,0.15) 0%, transparent 70%)' }} />

        {/* Nav */}
        <div style={{ position: 'absolute', top: 20, right: 20, left: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>
            🌌 المجرة الحضارية
          </Link>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '7px 16px', borderRadius: 40, cursor: 'pointer', fontSize: '0.85rem' }}>
            خروج
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* ─── Profile Header Card ─── */}
        <div style={{ background: 'white', borderRadius: 22, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', marginTop: -70, position: 'relative', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '2rem',
              border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
                : getInitials(profile.name_ar || profile.name || '?')}
            </div>
            {profile.is_verified && (
              <div style={{ position: 'absolute', bottom: 4, left: 4, background: C.softGreen, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontSize: '0.75rem' }}>✓</div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0, fontSize: '1.7rem', color: C.darkNavy }}>{profile.name_ar || profile.name}</h1>
            {profile.name_ar && profile.name && <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 8 }}>{profile.name}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, background: `${ROLE_COLORS[profile.role] || '#888'}20`, color: ROLE_COLORS[profile.role] || '#888', border: `1px solid ${ROLE_COLORS[profile.role] || '#888'}30` }}>
                {ROLE_LABELS[profile.role] || profile.role}
              </span>
              {profile.institution_name_ar || profile.institution_name ? (
                <Link href={profile.institution_id ? `/institutions/${profile.institution_id}` : '#'} style={{ color: C.teal, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                  🏢 {profile.institution_name_ar || profile.institution_name}
                </Link>
              ) : null}
              {profile.position && <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>📌 {profile.position}</span>}
            </div>
            {profile.bio && <p style={{ margin: '12px 0 0', color: '#374151', fontSize: '0.92rem', lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            {profile.role === 'admin' && (
              <Link href="/admin" style={{ padding: '9px 18px', background: `${C.darkNavy}10`, border: `1px solid ${C.darkNavy}25`, borderRadius: 40, color: C.darkNavy, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                ⚙️ لوحة التحكم
              </Link>
            )}
            {profile.institution_id && (
              <Link href={`/institutions/${profile.institution_id}`} style={{ padding: '9px 18px', background: `${C.teal}10`, border: `1px solid ${C.teal}25`, borderRadius: 40, color: C.teal, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                🏢 مؤسستي
              </Link>
            )}
          </div>
        </div>

        {/* ─── Quick Stats ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, margin: '20px 0' }}>
          {[
            { label: 'تاريخ الانضمام', value: fmtDate(profile.created_at), icon: '📅' },
            { label: 'آخر دخول',       value: fmtDate(profile.last_login),  icon: '🕐' },
            { label: 'البريد',          value: profile.email,               icon: '✉️' },
            { label: 'الهاتف',          value: profile.phone || '—',        icon: '📞' },
          ].map(item => (
            <div key={item.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: C.darkNavy, wordBreak: 'break-word' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* ─── Tabs ─── */}
        <div style={{ background: 'white', borderRadius: 16, padding: '10px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tabBtn('info',     'المعلومات الشخصية')}
          {tabBtn('security', 'الأمان')}
          {tabBtn('activity', 'النشاط الأخير')}
        </div>

        {/* ─── Tab: Info ─── */}
        {activeTab === 'info' && (
          <div style={{ background: 'white', borderRadius: 18, padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: C.darkNavy, fontSize: '1.15rem' }}>المعلومات الشخصية</h2>
              {!editMode && (
                <button onClick={() => setEditMode(true)} style={{ padding: '8px 18px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`, borderRadius: 40, color: C.teal, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                  ✏️ تعديل
                </button>
              )}
            </div>

            {saveSuccess && <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#065f46', fontSize: '0.9rem' }}>{saveSuccess}</div>}
            {saveError   && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ef4444', fontSize: '0.9rem' }}>{saveError}</div>}

            {!editMode ? (
              /* ── View ── */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {[
                  { label: 'الاسم الكامل (عربي)',    value: profile.name_ar       || '—' },
                  { label: 'الاسم الكامل (إنجليزي)', value: profile.name          || '—' },
                  { label: 'البريد الإلكتروني',       value: profile.email         || '—' },
                  { label: 'رقم الهاتف',               value: profile.phone         || '—' },
                  { label: 'المنصب الوظيفي',           value: profile.position      || '—' },
                  { label: 'القسم / الإدارة',          value: profile.department    || '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: '0.95rem', color: C.darkNavy, fontWeight: 500 }}>{f.value}</div>
                  </div>
                ))}

                {profile.bio && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 4 }}>نبذة شخصية</div>
                    <div style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.7 }}>{profile.bio}</div>
                  </div>
                )}

                {/* Social links */}
                {profile.social_links && Object.values(profile.social_links).some(Boolean) && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 10 }}>روابط التواصل</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {profile.social_links.twitter  && <a href={profile.social_links.twitter}  target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', fontSize: '0.9rem', textDecoration: 'none', padding: '6px 14px', background: '#1d9bf010', border: '1px solid #1d9bf030', borderRadius: 20 }}>🐦 Twitter</a>}
                      {profile.social_links.linkedin && <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', fontSize: '0.9rem', textDecoration: 'none', padding: '6px 14px', background: '#0a66c210', border: '1px solid #0a66c230', borderRadius: 20 }}>💼 LinkedIn</a>}
                      {profile.social_links.website  && <a href={profile.social_links.website}  target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontSize: '0.9rem', textDecoration: 'none', padding: '6px 14px', background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 20 }}>🌐 الموقع</a>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Edit form ── */
              <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                {[
                  { key: 'name_ar',  label: 'الاسم الكامل (عربي)',    placeholder: 'الاسم بالعربية'    },
                  { key: 'name',     label: 'الاسم الكامل (إنجليزي)', placeholder: 'Full Name'        },
                  { key: 'phone',    label: 'رقم الهاتف',              placeholder: '+966 5XX XXX XXXX' },
                  { key: 'position', label: 'المنصب الوظيفي',          placeholder: 'مثال: أستاذ مساعد' },
                  { key: 'department',     label: 'القسم / الإدارة',   placeholder: 'مثال: قسم الأبحاث' },
                  { key: 'social_twitter',  label: 'رابط Twitter',     placeholder: 'https://twitter.com/...' },
                  { key: 'social_linkedin', label: 'رابط LinkedIn',    placeholder: 'https://linkedin.com/in/...' },
                  { key: 'social_website',  label: 'الموقع الشخصي',    placeholder: 'https://yoursite.com' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={(editForm as any)[f.key] || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>نبذة شخصية</label>
                  <textarea
                    placeholder="اكتب نبذة مختصرة عن نفسك..."
                    value={editForm.bio || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, paddingTop: 8 }}>
                  <button type="submit" disabled={saveLoading} style={{ flex: 1, padding: '12px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, cursor: saveLoading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', opacity: saveLoading ? 0.7 : 1 }}>
                    {saveLoading ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 40, cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ─── Tab: Security ─── */}
        {activeTab === 'security' && (
          <div style={{ background: 'white', borderRadius: 18, padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <h2 style={{ margin: '0 0 24px', color: C.darkNavy, fontSize: '1.15rem' }}>🔐 إعدادات الأمان</h2>

            {/* Account info */}
            <div style={{ background: `${C.lightMint}40`, borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>البريد الإلكتروني</div>
                <div style={{ fontWeight: 600, color: C.darkNavy }}>{profile.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>آخر دخول</div>
                <div style={{ fontWeight: 600, color: C.darkNavy }}>{fmtDate(profile.last_login)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>حالة الحساب</div>
                <div style={{ fontWeight: 600, color: profile.status === 'active' ? '#16a34a' : '#ef4444' }}>
                  {profile.status === 'active' ? '✅ نشط' : '⛔ موقوف'}
                </div>
              </div>
            </div>

            {/* Change password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: C.darkNavy }}>تغيير كلمة المرور</h3>
                <button onClick={() => setShowPwd(!showPwd)} style={{ background: 'none', border: `1px solid ${C.teal}40`, borderRadius: 40, padding: '6px 14px', color: C.teal, cursor: 'pointer', fontSize: '0.85rem' }}>
                  {showPwd ? 'إخفاء' : 'تغيير'}
                </button>
              </div>

              {showPwd && (
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440 }}>
                  {pwdError   && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 10, padding: '12px 16px', color: '#ef4444', fontSize: '0.9rem' }}>{pwdError}</div>}
                  {pwdSuccess && <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: 10, padding: '12px 16px', color: '#065f46', fontSize: '0.9rem' }}>{pwdSuccess}</div>}

                  {[
                    { key: 'current', label: 'كلمة المرور الحالية', ph: '••••••••' },
                    { key: 'next',    label: 'كلمة المرور الجديدة', ph: '8 أحرف على الأقل' },
                    { key: 'confirm', label: 'تأكيد كلمة المرور',    ph: '••••••••' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                      <input
                        type="password"
                        placeholder={f.ph}
                        value={(pwdForm as any)[f.key]}
                        onChange={e => setPwdForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        required
                        style={inputStyle}
                      />
                    </div>
                  ))}

                  <button type="submit" disabled={pwdLoading} style={{ padding: '12px', background: C.darkNavy, color: 'white', border: 'none', borderRadius: 40, cursor: pwdLoading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', opacity: pwdLoading ? 0.7 : 1 }}>
                    {pwdLoading ? 'جاري التغيير...' : '🔑 تغيير كلمة المرور'}
                  </button>
                </form>
              )}
            </div>

            {/* Danger zone */}
            <div style={{ marginTop: 36, borderTop: `1px solid #fee2e2`, paddingTop: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1rem', color: '#ef4444' }}>⚠️ منطقة الخطر</h3>
              <button onClick={handleLogout} style={{ padding: '10px 24px', background: '#fee2e2', border: '1px solid #ef444430', borderRadius: 40, color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                🚪 تسجيل الخروج من جميع الأجهزة
              </button>
            </div>
          </div>
        )}

        {/* ─── Tab: Activity ─── */}
        {activeTab === 'activity' && (
          <div style={{ background: 'white', borderRadius: 18, padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <h2 style={{ margin: '0 0 24px', color: C.darkNavy, fontSize: '1.15rem' }}>⚡ النشاط الأخير</h2>

            {actsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: C.teal }}>جاري التحميل...</div>
            ) : activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
                <div>لا يوجد نشاط مسجّل حتى الآن</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activities.map((act, i) => (
                  <div key={act.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '14px 0', borderBottom: i < activities.length - 1 ? `1px solid ${C.teal}10` : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                      {act.type === 'login'    ? '🔑'
                       : act.type === 'update' ? '✏️'
                       : act.type === 'create' ? '➕'
                       : act.type === 'delete' ? '🗑️'
                       : '⚡'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', color: C.darkNavy, fontWeight: 500 }}>
                        {act.link
                          ? <Link href={act.link} style={{ color: C.teal, textDecoration: 'none' }}>{act.description}</Link>
                          : act.description}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 3 }}>{fmtDate(act.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
