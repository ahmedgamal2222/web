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
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

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

const POSITIONS = [
  '', 'أستاذ', 'أستاذ مشارك', 'أستاذ مساعد', 'محاضر', 'مدرّس',
  'باحث', 'باحث أول', 'مدير', 'مدير تنفيذي', 'نائب مدير', 'رئيس قسم',
  'منسّق', 'مشرف', 'مستشار', 'محلّل', 'مهندس', 'مطوّر برمجيات',
  'مصمّم', 'مسوّق', 'محاسب', 'مدير مالي', 'مدير موارد بشرية',
  'أخصائي إداري', 'سكرتير تنفيذي', 'موظف خدمة عملاء',
  'مدير مشروع', 'مدير عمليات', 'مدير تقنية المعلومات',
  'طالب دكتوراه', 'طالب ماجستير', 'أخرى',
];
const DEPARTMENTS = [
  '', 'الإدارة العليا', 'الشؤون الأكاديمية', 'شؤون الطلاب',
  'الموارد البشرية', 'المالية والمحاسبة', 'تقنية المعلومات',
  'التسويق والإعلام', 'خدمة العملاء', 'العمليات والمشتريات',
  'البحث والتطوير', 'الشؤون القانونية', 'الجودة والتميّز',
  'العلاقات الدولية', 'التدريب والتطوير', 'الاستراتيجية والتخطيط',
  'الشراكات والاتفاقيات', 'الأمن والسلامة', 'أخرى',
];

const COUNTRIES = [
  { name: 'السعودية', code: '+966' },
  { name: 'مصر', code: '+20' },
  { name: 'الإمارات', code: '+971' },
  { name: 'الكويت', code: '+965' },
  { name: 'البحرين', code: '+973' },
  { name: 'قطر', code: '+974' },
  { name: 'عُمان', code: '+968' },
  { name: 'الأردن', code: '+962' },
  { name: 'العراق', code: '+964' },
  { name: 'لبنان', code: '+961' },
  { name: 'فلسطين', code: '+970' },
  { name: 'اليمن', code: '+967' },
  { name: 'السودان', code: '+249' },
  { name: 'ليبيا', code: '+218' },
  { name: 'تونس', code: '+216' },
  { name: 'الجزائر', code: '+213' },
  { name: 'المغرب', code: '+212' },
  { name: 'موريتانيا', code: '+222' },
  { name: 'الصومال', code: '+252' },
  { name: 'جيبوتي', code: '+253' },
  { name: 'جزر القمر', code: '+269' },
];

function getCountryCode(country: string): string {
  const found = COUNTRIES.find(c => c.name === country);
  return found?.code || '';
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
function getInitials(name: string) {
  return (name || '؟').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

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
  country?: string;
  city?: string;
  status?: string;
  is_verified?: boolean;
  email_verified?: boolean;
  created_at?: string;
  last_login?: string;
  social_links?: { twitter?: string; linkedin?: string; youtube?: string; website?: string };
}

const INP: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: `2px solid #cbd5e120`,
  background: '#f7fbfd',
  color: C.darkNavy,
  fontSize: '0.93rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', name_ar: '', phone: '', bio: '',
    position: '', department: '', avatar_url: '',
    country: '', city: '',
    social_twitter: '', social_linkedin: '',
    social_youtube: '', social_website: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg,     setSaveMsg]     = useState('');
  const [saveErr,     setSaveErr]     = useState('');

  const [pwdForm,    setPwdForm]    = useState({ current: '', next: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg,     setPwdMsg]     = useState('');
  const [pwdErr,     setPwdErr]     = useState('');
  const [showPwd,    setShowPwd]    = useState(false);

  const [activities,  setActivities]  = useState<any[]>([]);
  const [actsLoading, setActsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg,     setVerifyMsg]     = useState('');

  useEffect(() => {
    if (!localStorage.getItem('user')) { router.push('/login?redirect=/profile'); return; }
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!data.authenticated) throw new Error('جلسة منتهية — يرجى تسجيل الدخول مجدداً');
      const p: UserProfile = data.user;
      setProfile(p);
      const sl = p.social_links || {};
      setEditForm({
        name:            p.name        || '',
        name_ar:         p.name_ar     || '',
        phone:           p.phone       || '',
        bio:             p.bio         || '',
        position:        p.position    || '',
        department:      p.department  || '',
        avatar_url:      p.avatar_url  || '',
        country:         p.country     || '',
        city:            p.city        || '',
        social_twitter:  sl.twitter   || '',
        social_linkedin: sl.linkedin  || '',
        social_youtube:  sl.youtube   || '',
        social_website:  sl.website   || '',
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaveLoading(true); setSaveErr(''); setSaveMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({
          name:       editForm.name       || undefined,
          name_ar:    editForm.name_ar    || undefined,
          phone:      editForm.phone      || undefined,
          bio:        editForm.bio        || undefined,
          position:   editForm.position   || undefined,
          department: editForm.department || undefined,
          avatar_url: editForm.avatar_url || undefined,
          country:    editForm.country    || undefined,
          city:       editForm.city       || undefined,
          social_links: {
            twitter:  editForm.social_twitter  || undefined,
            linkedin: editForm.social_linkedin || undefined,
            youtube:  editForm.social_youtube  || undefined,
            website:  editForm.social_website  || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      setSaveMsg('تم تحديث الملف الشخصي بنجاح ✓');
      setEditMode(false);
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...u, name: editForm.name, name_ar: editForm.name_ar }));
      } catch (_) {}
      await loadProfile();
    } catch (e: any) {
      setSaveErr(e.message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault(); setPwdErr(''); setPwdMsg('');
    if (pwdForm.next !== pwdForm.confirm) { setPwdErr('كلمتا المرور غير متطابقتين'); return; }
    if (pwdForm.next.length < 8) { setPwdErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ current_password: pwdForm.current, new_password: pwdForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');
      setPwdMsg('تم تغيير كلمة المرور بنجاح ✓');
      setPwdForm({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      setPwdErr(e.message);
    } finally {
      setPwdLoading(false);
    }
  }

  async function loadActivities() {
    setActsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/activities`, { headers: getAuthHeaders() });
      if (res.ok) { const d = await res.json(); setActivities(d.data || d || []); }
    } catch (_) {}
    setActsLoading(false);
  }
  useEffect(() => { if (activeTab === 'activity') loadActivities(); }, [activeTab]);

  function handleLogout() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    localStorage.removeItem('user'); localStorage.removeItem('sessionId');
    router.push('/login');
  }

  async function handleResendVerification() {
    setVerifyLoading(true); setVerifyMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST', headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال البريد');
      setVerifyMsg('✅ تم إرسال رابط التفعيل إلى بريدك — تحقق من صندوق الوارد');
    } catch (e: any) {
      setVerifyMsg(`⚠️ ${e.message}`);
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData(); formData.append('logo', file);
      const res = await fetch(`${API_BASE}/api/upload/logo`, {
        method: 'POST',
        headers: { 'X-Session-ID': localStorage.getItem('sessionId') || '' },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل رفع الصورة');
      const url: string = data.url || data.data?.url || '';
      if (url) {
        await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'PUT', headers: getAuthHeaders(),
          body: JSON.stringify({ avatar_url: url }),
        });
        await loadProfile();
      }
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  // ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', direction: 'rtl', gap: 10, color: C.teal, fontSize: '1.05rem' }}>
      ⏳ جاري التحميل...
    </div>
  );

  if (error || !profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', gap: 14, direction: 'rtl' }}>
      <span style={{ fontSize: '3rem' }}>❌</span>
      <span style={{ color: '#ef4444' }}>{error || 'فشل تحميل الملف الشخصي'}</span>
      <button onClick={loadProfile} style={{ padding: '10px 24px', background: C.teal, color: 'white', border: 'none', borderRadius: 40, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '.93rem' }}>
        إعادة المحاولة
      </button>
    </div>
  );

  const sl = profile.social_links || {};

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', direction: 'rtl', fontFamily: 'Tajawal, Cairo, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .inp-focus:focus { border-color: ${C.teal} !important; box-shadow: 0 0 0 3px ${C.teal}22 !important; }
        @media (max-width: 600px) {
          .prof-head { flex-direction: column !important; align-items: center !important; }
          .prof-actions { justify-content: center !important; }
        }
      `}</style>

      {/* Cover */}
      <div style={{ background: `linear-gradient(135deg, ${C.darkNavy} 0%, ${C.teal} 100%)`, height: 200, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(133,199,154,.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: 18, right: 20, left: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,.75)', textDecoration: 'none', fontSize: '.88rem', fontFamily: 'inherit' }}>🌌 المجرة الحضارية</Link>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.28)', color: 'white', padding: '7px 16px', borderRadius: 40, cursor: 'pointer', fontSize: '.85rem', fontFamily: 'inherit' }}>خروج</button>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* Header card */}
        <div className="prof-head" style={{ background: 'white', borderRadius: 22, padding: '28px 30px', boxShadow: '0 4px 24px rgba(0,0,0,.09)', marginTop: -70, position: 'relative', display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Avatar block */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 104, height: 104, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '2rem',
              border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,.15)',
              overflow: 'hidden',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(profile.name_ar || profile.name)}
            </div>

            {/* Edit avatar button */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              title="تغيير الصورة الشخصية"
              style={{
                position: 'absolute', bottom: 2, left: 2,
                width: 28, height: 28,
                background: avatarUploading ? '#aaa' : C.teal,
                border: '2px solid white',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: avatarUploading ? 'default' : 'pointer',
                fontSize: '.75rem', boxShadow: '0 2px 8px rgba(0,0,0,.2)',
              }}
            >
              {avatarUploading
                ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                : '✏️'}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

            {(profile.is_verified || profile.email_verified) && (
              <div style={{ position: 'absolute', bottom: 26, left: -2, background: C.softGreen, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontSize: '.7rem' }}>✓</div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: '0 0 2px', fontSize: '1.65rem', color: C.darkNavy, fontWeight: 900 }}>{profile.name_ar || profile.name}</h1>
            {profile.name_ar && profile.name && <div style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: 8 }}>{profile.name}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '4px 13px', borderRadius: 20, fontSize: '.8rem', fontWeight: 700, background: `${ROLE_COLORS[profile.role] || '#888'}18`, color: ROLE_COLORS[profile.role] || '#888', border: `1px solid ${ROLE_COLORS[profile.role] || '#888'}30` }}>
                {ROLE_LABELS[profile.role] || profile.role}
              </span>
              {(profile.institution_name_ar || profile.institution_name) && (
                <Link href={profile.institution_id ? `/institutions/${profile.institution_id}` : '#'} style={{ color: C.teal, textDecoration: 'none', fontSize: '.85rem', fontWeight: 500, fontFamily: 'inherit' }}>
                  🏢 {profile.institution_name_ar || profile.institution_name}
                </Link>
              )}
              {profile.position && <span style={{ color: '#6b7280', fontSize: '.83rem' }}>📌 {profile.position}</span>}
            </div>
            {profile.bio && <p style={{ margin: '10px 0 0', color: '#374151', fontSize: '.9rem', lineHeight: 1.65 }}>{profile.bio}</p>}

            {/* Social links view */}
            {(sl.twitter || sl.linkedin || sl.youtube || sl.website) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {sl.twitter  && <a href={sl.twitter}  target="_blank" rel="noopener noreferrer" style={{ color: '#000', fontSize: '.82rem', padding: '4px 12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 18, textDecoration: 'none', fontFamily: 'inherit' }}>𝕏 X (تويتر)</a>}
                {sl.linkedin && <a href={sl.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', fontSize: '.82rem', padding: '4px 12px', background: '#0a66c210', border: '1px solid #0a66c230', borderRadius: 18, textDecoration: 'none', fontFamily: 'inherit' }}>💼 LinkedIn</a>}
                {sl.youtube  && <a href={sl.youtube}  target="_blank" rel="noopener noreferrer" style={{ color: '#ff0000', fontSize: '.82rem', padding: '4px 12px', background: '#ff000010', border: '1px solid #ff000030', borderRadius: 18, textDecoration: 'none', fontFamily: 'inherit' }}>▶ YouTube</a>}
                {sl.website  && <a href={sl.website}  target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontSize: '.82rem', padding: '4px 12px', background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 18, textDecoration: 'none', fontFamily: 'inherit' }}>🌐 الموقع</a>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="prof-actions" style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            {profile.role === 'admin' && (
              <Link href="/admin" style={{ padding: '9px 18px', background: `${C.darkNavy}12`, border: `1px solid ${C.darkNavy}22`, borderRadius: 40, color: C.darkNavy, textDecoration: 'none', fontSize: '.86rem', fontWeight: 600, fontFamily: 'inherit' }}>⚙️ لوحة التحكم</Link>
            )}
            {profile.institution_id
              ? <Link href={`/institutions/${profile.institution_id}`} style={{ padding: '9px 18px', background: `${C.teal}12`, border: `1px solid ${C.teal}22`, borderRadius: 40, color: C.teal, textDecoration: 'none', fontSize: '.86rem', fontWeight: 600, fontFamily: 'inherit' }}>🏢 مؤسستي</Link>
              : <Link href="/my-institution-request" style={{ padding: '9px 18px', background: 'rgba(245,200,66,.12)', border: '1px solid rgba(245,200,66,.3)', borderRadius: 40, color: '#f5c842', textDecoration: 'none', fontSize: '.86rem', fontWeight: 600, fontFamily: 'inherit' }}>🏛️ طلبات اعتماد</Link>
            }
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 12, margin: '18px 0' }}>
          {[
            { label: 'تاريخ الانضمام', value: fmtDate(profile.created_at), icon: '📅' },
            { label: 'آخر دخول',        value: fmtDate(profile.last_login),  icon: '🕐' },
            { label: 'البريد',           value: profile.email,               icon: '✉️' },
            { label: 'الهاتف',           value: profile.phone || '—',        icon: '📞' },
            { label: 'الدولة',           value: profile.country || '—',      icon: '🌍' },
            { label: 'القسم',            value: profile.department || '—',   icon: '🏷️' },
          ].map(item => (
            <div key={item.label} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: '.78rem', color: '#9ca3af', marginBottom: 4 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: '.86rem', fontWeight: 600, color: C.darkNavy, wordBreak: 'break-all' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: '8px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.05)', marginBottom: 18, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(['info', 'security', 'activity'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 22px', borderRadius: 40, fontSize: '.9rem', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all .2s',
              background: activeTab === tab ? C.teal : 'transparent',
              color:      activeTab === tab ? 'white' : C.teal,
              fontFamily: 'inherit',
            }}>
              {tab === 'info' ? '👤 المعلومات' : tab === 'security' ? '🔐 الأمان' : '⚡ النشاط'}
            </button>
          ))}
        </div>

        {/* ══════════ Tab: Info ══════════ */}
        {activeTab === 'info' && (
          <div style={{ background: 'white', borderRadius: 18, padding: '28px 30px', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, color: C.darkNavy, fontSize: '1.1rem', fontWeight: 800 }}>المعلومات الشخصية</h2>
              {!editMode && (
                <button onClick={() => { setEditMode(true); setSaveMsg(''); setSaveErr(''); }} style={{
                  padding: '8px 18px', background: `${C.teal}15`, border: `1px solid ${C.teal}30`,
                  borderRadius: 40, color: C.teal, cursor: 'pointer', fontWeight: 600, fontSize: '.87rem', fontFamily: 'inherit',
                }}>✏️ تعديل</button>
              )}
            </div>

            {saveMsg && <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: '#065f46', fontSize: '.9rem' }}>{saveMsg}</div>}
            {saveErr && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: '#ef4444', fontSize: '.9rem' }}>{saveErr}</div>}

            {/* View mode */}
            {!editMode ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                {[
                  { label: 'الاسم (عربي)',      value: profile.name_ar    || '—' },
                  { label: 'الاسم (إنجليزي)',   value: profile.name       || '—' },
                  { label: 'الدولة',             value: profile.country    || '—' },
                  { label: 'المدينة',            value: profile.city       || '—' },
                  { label: 'رقم الهاتف',         value: profile.phone      || '—' },
                  { label: 'المنصب الوظيفي',     value: profile.position   || '—' },
                  { label: 'القسم / الإدارة',    value: profile.department || '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: '.78rem', color: '#9ca3af', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: '.93rem', color: C.darkNavy, fontWeight: 500 }}>{f.value}</div>
                  </div>
                ))}

                {/* Email field with verify button */}
                <div>
                  <div style={{ fontSize: '.78rem', color: '#9ca3af', marginBottom: 4 }}>البريد الإلكتروني</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.93rem', color: C.darkNavy, fontWeight: 500 }}>{profile.email}</span>
                    {(profile.email_verified || profile.is_verified)
                      ? <span style={{ fontSize: '.75rem', color: '#10b981', fontWeight: 700, background: '#d1fae5', padding: '2px 10px', borderRadius: 20 }}>✅ مؤكّد</span>
                      : (
                        <button
                          onClick={handleResendVerification}
                          disabled={verifyLoading}
                          style={{
                            fontSize: '.75rem', fontWeight: 700, padding: '4px 13px',
                            borderRadius: 20, border: '1px solid #f59e0b',
                            background: '#fffbeb', color: '#92400e',
                            cursor: verifyLoading ? 'default' : 'pointer',
                            opacity: verifyLoading ? .6 : 1,
                            fontFamily: 'inherit',
                          }}
                        >
                          {verifyLoading ? 'جاري الإرسال...' : '⚠️ تفعيل البريد'}
                        </button>
                      )
                    }
                  </div>
                  {verifyMsg && (
                    <div style={{ fontSize: '.8rem', marginTop: 6, color: verifyMsg.startsWith('✅') ? '#065f46' : '#92400e' }}>{verifyMsg}</div>
                  )}
                </div>
                {profile.bio && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '.78rem', color: '#9ca3af', marginBottom: 4 }}>نبذة شخصية</div>
                    <div style={{ fontSize: '.93rem', color: '#374151', lineHeight: 1.7 }}>{profile.bio}</div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode */
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>

                  {/* Text inputs */}
                  {[
                    { key: 'name_ar', label: 'الاسم الكامل (عربي)',    ph: 'الاسم بالعربية' },
                    { key: 'name',    label: 'الاسم الكامل (إنجليزي)', ph: 'Full Name' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                      <input
                        className="inp-focus"
                        type="text"
                        placeholder={f.ph}
                        value={(editForm as any)[f.key]}
                        onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ ...INP, border: `2px solid ${C.teal}25` }}
                      />
                    </div>
                  ))}

                  {/* Country select */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>الدولة</label>
                    <select
                      className="inp-focus"
                      value={editForm.country}
                      onChange={e => {
                        const country = e.target.value;
                        const code = getCountryCode(country);
                        setEditForm(p => ({
                          ...p,
                          country,
                          phone: code ? (p.phone && !p.phone.startsWith('+') ? code + ' ' + p.phone : code + ' ') : p.phone,
                        }));
                      }}
                      style={{ ...INP, border: `2px solid ${C.teal}25`, cursor: 'pointer' }}
                    >
                      <option value="">— اختر الدولة —</option>
                      {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.code})</option>)}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>المدينة</label>
                    <input
                      className="inp-focus"
                      type="text"
                      placeholder="أدخل المدينة"
                      value={editForm.city}
                      onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                      style={{ ...INP, border: `2px solid ${C.teal}25` }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>رقم الهاتف</label>
                    <input
                      className="inp-focus"
                      type="text"
                      placeholder={editForm.country ? getCountryCode(editForm.country) + ' 5XX XXX XXXX' : '+966 5XX XXX XXXX'}
                      value={editForm.phone}
                      onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      style={{ ...INP, border: `2px solid ${C.teal}25`, direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>

                  {/* Position select */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>المنصب الوظيفي</label>
                    <select
                      className="inp-focus"
                      value={editForm.position}
                      onChange={e => setEditForm(p => ({ ...p, position: e.target.value }))}
                      style={{ ...INP, border: `2px solid ${C.teal}25`, cursor: 'pointer' }}
                    >
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos || '— اختر المنصب —'}</option>)}
                    </select>
                  </div>

                  {/* Department select */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>القسم / الإدارة</label>
                    <select
                      className="inp-focus"
                      value={editForm.department}
                      onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                      style={{ ...INP, border: `2px solid ${C.teal}25`, cursor: 'pointer' }}
                    >
                      {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep || '— اختر القسم —'}</option>)}
                    </select>
                  </div>

                  {/* Bio — full width */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>نبذة شخصية</label>
                    <textarea
                      className="inp-focus"
                      placeholder="اكتب نبذة مختصرة عن نفسك..."
                      value={editForm.bio}
                      onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      style={{ ...INP, border: `2px solid ${C.teal}25`, resize: 'vertical' }}
                    />
                  </div>

                  {/* Social links — section */}
                  <div style={{ gridColumn: '1 / -1', borderTop: `1px solid ${C.teal}18`, paddingTop: 16 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: C.darkNavy, marginBottom: 14 }}>🔗 روابط التواصل الاجتماعي</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>

                      <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: '#555', marginBottom: 6 }}>𝕏 X (تويتر)</label>
                        <input className="inp-focus" type="url" placeholder="https://x.com/username" value={editForm.social_twitter}
                          onChange={e => setEditForm(p => ({ ...p, social_twitter: e.target.value }))}
                          style={{ ...INP, border: `2px solid #33333318` }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: '#0a66c2', marginBottom: 6 }}>💼 LinkedIn</label>
                        <input className="inp-focus" type="url" placeholder="https://linkedin.com/in/..." value={editForm.social_linkedin}
                          onChange={e => setEditForm(p => ({ ...p, social_linkedin: e.target.value }))}
                          style={{ ...INP, border: `2px solid #0a66c218` }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: '#ff0000', marginBottom: 6 }}>▶ YouTube</label>
                        <input className="inp-focus" type="url" placeholder="https://youtube.com/@channel" value={editForm.social_youtube}
                          onChange={e => setEditForm(p => ({ ...p, social_youtube: e.target.value }))}
                          style={{ ...INP, border: `2px solid #ff000018` }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>🌐 الموقع الشخصي</label>
                        <input className="inp-focus" type="url" placeholder="https://yoursite.com" value={editForm.social_website}
                          onChange={e => setEditForm(p => ({ ...p, social_website: e.target.value }))}
                          style={{ ...INP, border: `2px solid ${C.teal}22` }} />
                      </div>

                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, paddingTop: 8 }}>
                    <button type="submit" disabled={saveLoading} style={{
                      flex: 1, padding: '12px 0',
                      background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`,
                      color: 'white', border: 'none', borderRadius: 12,
                      cursor: saveLoading ? 'default' : 'pointer',
                      fontWeight: 700, fontSize: '.95rem', opacity: saveLoading ? .7 : 1, fontFamily: 'inherit',
                    }}>
                      {saveLoading ? '⏳ جاري الحفظ...' : '💾 حفظ التعديلات'}
                    </button>
                    <button type="button" onClick={() => { setEditMode(false); setSaveErr(''); }} style={{
                      flex: 1, padding: '12px 0', background: 'transparent',
                      color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 12,
                      cursor: 'pointer', fontWeight: 600, fontSize: '.95rem', fontFamily: 'inherit',
                    }}>إلغاء</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ══════════ Tab: Security ══════════ */}
        {activeTab === 'security' && (
          <div style={{ background: 'white', borderRadius: 18, padding: '28px 30px', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
            <h2 style={{ margin: '0 0 22px', color: C.darkNavy, fontSize: '1.1rem', fontWeight: 800 }}>🔐 إعدادات الأمان</h2>

            <div style={{ background: `${C.lightMint}50`, borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {[
                { label: 'البريد',        value: profile.email },
                { label: 'تاريخ الانضمام', value: fmtDate(profile.created_at) },
                { label: 'آخر دخول',      value: fmtDate(profile.last_login) },
                { label: 'تأكيد البريد',  value: (profile.email_verified || profile.is_verified) ? '✅ مؤكّد' : '⚠️ غير مؤكّد' },
                { label: 'حالة الحساب',   value: profile.status === 'active' ? '✅ نشط' : (profile.status ? '⛔ موقوف' : '—') },
              ].map(it => (
                <div key={it.label}>
                  <div style={{ fontSize: '.8rem', color: '#9ca3af' }}>{it.label}</div>
                  <div style={{ fontWeight: 600, color: C.darkNavy, fontSize: '.92rem' }}>{it.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPwd ? 18 : 0 }}>
              <h3 style={{ margin: 0, fontSize: '.98rem', color: C.darkNavy }}>تغيير كلمة المرور</h3>
              <button onClick={() => setShowPwd(v => !v)} style={{ background: 'none', border: `1px solid ${C.teal}40`, borderRadius: 40, padding: '6px 14px', color: C.teal, cursor: 'pointer', fontSize: '.85rem', fontFamily: 'inherit' }}>
                {showPwd ? 'إخفاء' : 'تغيير'}
              </button>
            </div>

            {showPwd && (
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 440, marginTop: 8 }}>
                {pwdErr && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: '.9rem' }}>{pwdErr}</div>}
                {pwdMsg && <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: 10, padding: '10px 14px', color: '#065f46', fontSize: '.9rem' }}>{pwdMsg}</div>}
                {[
                  { key: 'current', label: 'كلمة المرور الحالية' },
                  { key: 'next',    label: 'كلمة المرور الجديدة (8+ أحرف)' },
                  { key: 'confirm', label: 'تأكيد كلمة المرور الجديدة' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: C.teal, marginBottom: 6 }}>{f.label}</label>
                    <input
                      className="inp-focus"
                      type="password"
                      placeholder="••••••••"
                      value={(pwdForm as any)[f.key]}
                      onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                      required
                      style={{ ...INP, border: `2px solid ${C.teal}25` }}
                    />
                  </div>
                ))}
                <button type="submit" disabled={pwdLoading} style={{
                  padding: '12px 0', background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`,
                  color: 'white', border: 'none', borderRadius: 12,
                  cursor: pwdLoading ? 'default' : 'pointer',
                  fontWeight: 700, fontSize: '.95rem', opacity: pwdLoading ? .7 : 1, fontFamily: 'inherit',
                }}>
                  {pwdLoading ? '⏳ جاري التغيير...' : '🔑 تغيير كلمة المرور'}
                </button>
              </form>
            )}

            <div style={{ marginTop: 36, borderTop: '1px solid #fee2e2', paddingTop: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '.98rem', color: '#ef4444' }}>⚠️ منطقة الخطر</h3>
              <button onClick={handleLogout} style={{ padding: '10px 24px', background: '#fee2e2', border: '1px solid #ef444430', borderRadius: 40, color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '.9rem', fontFamily: 'inherit' }}>
                🚪 تسجيل الخروج
              </button>
            </div>
          </div>
        )}

        {/* ══════════ Tab: Activity ══════════ */}
        {activeTab === 'activity' && (
          <div style={{ background: 'white', borderRadius: 18, padding: '28px 30px', boxShadow: '0 2px 16px rgba(0,0,0,.07)' }}>
            <h2 style={{ margin: '0 0 22px', color: C.darkNavy, fontSize: '1.1rem', fontWeight: 800 }}>⚡ النشاط الأخير</h2>
            {actsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.teal }}>⏳ جاري التحميل...</div>
            ) : activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
                <div>لا يوجد نشاط مسجّل حتى الآن</div>
              </div>
            ) : activities.map((act, i) => (
              <div key={act.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '13px 0', borderBottom: i < activities.length - 1 ? `1px solid ${C.teal}12` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.95rem' }}>
                  {act.type === 'login' ? '🔑' : act.type === 'update' ? '✏️' : act.type === 'create' ? '➕' : act.type === 'delete' ? '🗑️' : '⚡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.9rem', color: C.darkNavy, fontWeight: 500 }}>
                    {act.link ? <Link href={act.link} style={{ color: C.teal, textDecoration: 'none' }}>{act.description}</Link> : act.description}
                  </div>
                  <div style={{ fontSize: '.82rem', color: '#9ca3af', marginTop: 2 }}>{fmtDate(act.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
