'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

// ── Country dial codes ──────────────────────────────────────
const COUNTRIES = [
  { code: 'SA', name: 'السعودية',      dial: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'الإمارات',      dial: '+971', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت',        dial: '+965', flag: '🇰🇼' },
  { code: 'QA', name: 'قطر',           dial: '+974', flag: '🇶🇦' },
  { code: 'BH', name: 'البحرين',       dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'عُمان',         dial: '+968', flag: '🇴🇲' },
  { code: 'YE', name: 'اليمن',         dial: '+967', flag: '🇾🇪' },
  { code: 'EG', name: 'مصر',           dial: '+20',  flag: '🇪🇬' },
  { code: 'JO', name: 'الأردن',        dial: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'لبنان',         dial: '+961', flag: '🇱🇧' },
  { code: 'SY', name: 'سوريا',         dial: '+963', flag: '🇸🇾' },
  { code: 'IQ', name: 'العراق',        dial: '+964', flag: '🇮🇶' },
  { code: 'PS', name: 'فلسطين',        dial: '+970', flag: '🇵🇸' },
  { code: 'LY', name: 'ليبيا',         dial: '+218', flag: '🇱🇾' },
  { code: 'TN', name: 'تونس',          dial: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'الجزائر',       dial: '+213', flag: '🇩🇿' },
  { code: 'MA', name: 'المغرب',        dial: '+212', flag: '🇲🇦' },
  { code: 'SD', name: 'السودان',       dial: '+249', flag: '🇸🇩' },
  { code: 'SO', name: 'الصومال',       dial: '+252', flag: '🇸🇴' },
  { code: 'MR', name: 'موريتانيا',     dial: '+222', flag: '🇲🇷' },
  { code: 'TR', name: 'تركيا',         dial: '+90',  flag: '🇹🇷' },
  { code: 'PK', name: 'باكستان',       dial: '+92',  flag: '🇵🇰' },
  { code: 'IN', name: 'الهند',         dial: '+91',  flag: '🇮🇳' },
  { code: 'GB', name: 'المملكة المتحدة', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'الولايات المتحدة', dial: '+1', flag: '🇺🇸' },
  { code: 'DE', name: 'ألمانيا',       dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'فرنسا',         dial: '+33',  flag: '🇫🇷' },
  { code: 'CA', name: 'كندا',          dial: '+1',   flag: '🇨🇦' },
  { code: 'AU', name: 'أستراليا',      dial: '+61',  flag: '🇦🇺' },
];

// ── Country picker component ─────────────────────────────────
function CountryPicker({
  value, onChange,
}: { value: string; onChange: (dial: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRIES.find(c => c.dial === value) ?? COUNTRIES[0];
  const filtered = q
    ? COUNTRIES.filter(c => c.name.includes(q) || c.dial.includes(q))
    : COUNTRIES;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: '100%', padding: '0 12px',
          background: 'rgba(79,195,247,0.07)',
          border: 'none', borderLeft: '1px solid rgba(79,195,247,0.2)',
          borderRadius: '0 10px 10px 0',
          color: '#e8f4fd', cursor: 'pointer', fontSize: '0.88rem',
          transition: 'background 0.18s', whiteSpace: 'nowrap',
          minWidth: 86,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,195,247,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(79,195,247,0.07)')}
      >
        <span style={{ fontSize: '1.1rem' }}>{selected.flag}</span>
        <span style={{ color: '#4fc3f7', fontWeight: 700 }}>{selected.dial}</span>
        <span style={{ fontSize: '0.55rem', color: '#5a7080' }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
          width: 250, maxHeight: 280, overflowY: 'auto',
          background: 'rgba(8,12,36,0.99)',
          border: '1px solid rgba(79,195,247,0.25)',
          borderRadius: 14, zIndex: 200,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
          direction: 'rtl',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(8,12,36,0.99)' }}>
            <input
              autoFocus
              type="text"
              placeholder="🔍 بحث عن دولة..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px', fontSize: '0.82rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(79,195,247,0.2)',
                borderRadius: 8, color: '#e8f4fd', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {filtered.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onChange(c.dial); setOpen(false); setQ(''); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', border: 'none',
                backgroundColor: c.dial === value ? 'rgba(79,195,247,0.12)' : 'transparent',
                color: c.dial === value ? '#4fc3f7' : '#c8d6e5',
                cursor: 'pointer', fontSize: '0.85rem', textAlign: 'right',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = c.dial === value ? 'rgba(79,195,247,0.12)' : 'transparent')}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{c.flag}</span>
              <span style={{ flex: 1 }}>{c.name}</span>
              <span style={{ color: '#4fc3f7', fontWeight: 700, fontSize: '0.8rem' }}>{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['', '#ff5050', '#ffc107', '#4fc3f7', '#66bb6a'];
  const labels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية جداً'];
  return (
    <div style={{ marginTop: 7 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.72rem', color: colors[score], fontWeight: 600 }}>{labels[score]}</span>
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────
const iStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(79,195,247,0.18)',
  borderRadius: 10, color: '#e8f4fd',
  fontSize: '0.92rem', outline: 'none',
  transition: 'all 0.2s', boxSizing: 'border-box',
};

const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(79,195,247,0.65)';
  e.currentTarget.style.background  = 'rgba(79,195,247,0.08)';
  e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(79,195,247,0.1)';
};
const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(79,195,247,0.18)';
  e.currentTarget.style.background  = 'rgba(255,255,255,0.05)';
  e.currentTarget.style.boxShadow   = 'none';
};

// ── Field wrapper ─────────────────────────────────────────────
function Field({ label, icon, required, children }: {
  label: string; icon: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: '0.79rem', fontWeight: 600,
        color: '#6a8898', marginBottom: 7, letterSpacing: '0.03em',
      }}>
        <span style={{ fontSize: '0.9rem' }}>{icon}</span>
        <span>{label}</span>
        {required && <span style={{ color: '#4fc3f7', opacity: 0.8 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dialCode, setDialCode]       = useState('+966');
  const [emailSent, setEmailSent]     = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [form, setForm] = useState({
    name_ar: '', name: '', email: '',
    phone: '', password: '', confirmPassword: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين'); return;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return;
    }
    setLoading(true); setError('');
    try {
      const fullPhone = form.phone ? `${dialCode}${form.phone}` : undefined;
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email, password: form.password,
          name: form.name, name_ar: form.name_ar || undefined,
          role: 'explorer', phone: fullPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // تسجيل دخول تلقائي بعد التسجيل
        try {
          const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email, password: form.password }),
          });
          const loginData = await loginRes.json();
          if (loginData.success) {
            localStorage.setItem('user', JSON.stringify(loginData.user));
            localStorage.setItem('sessionId', loginData.sessionId);
          }
        } catch (_) {}
        // عرض لوحة "تحقق من بريدك" بدلاً من التوجيه
        setRegisteredEmail(form.email);
        setEmailSent(true);
      } else {
        setError(data.error || 'فشل إنشاء الحساب');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const passMatch = form.confirmPassword
    ? form.confirmPassword === form.password : null;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, #0d0b2a 0%, #05041a 55%, #020210 100%)',
      padding: '24px 16px', direction: 'rtl',
      fontFamily: "'Tajawal', 'Cairo', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulseRing {
          0%,100% { box-shadow: 0 0 0 0 rgba(79,195,247,0.4); }
          50%     { box-shadow: 0 0 0 8px rgba(79,195,247,0); }
        }
        ::placeholder { color: rgba(138,164,188,0.35) !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(10,14,40,0.95) inset !important;
          -webkit-text-fill-color: #e8f4fd !important;
        }
      `}</style>

      {/* ─── لوحة تأكيد البريد بعد التسجيل ─── */}
      {emailSent && (
        <div style={{
          width: '100%', maxWidth: 480,
          background: 'rgba(8,10,32,0.95)',
          border: '1px solid rgba(78,141,156,0.4)',
          borderRadius: 24,
          padding: '48px 36px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>📧</div>
          <h2 style={{ color: '#EDF7BD', margin: '0 0 12px', fontSize: '1.5rem', fontWeight: 800 }}>
            تحقق من بريدك الإلكتروني
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 8px' }}>
            أرسلنا رابط التأكيد إلى:
          </p>
          <p style={{ color: '#4fc3f7', fontWeight: 700, margin: '0 0 24px', direction: 'ltr' }}>
            {registeredEmail}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 28px' }}>
            اضغط على الرابط في البريد لتأكيد حسابك، ثم يمكنك تقديم طلب اعتماد مؤسستك.
            الرابط صالح لمدة 24 ساعة.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a
              href="/"
              style={{
                display: 'block',
                background: 'linear-gradient(135deg, #4E8D9C, #281C59)',
                color: 'white',
                padding: '13px 28px',
                borderRadius: 40,
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              الذهاب للصفحة الرئيسية
            </a>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              لم تصل الرسالة؟ تحقق من مجلد البريد غير المرغوب فيه (Spam)
            </span>
          </div>
        </div>
      )}

      {!emailSent && <div style={{
        width: '100%', maxWidth: 500,
        background: 'rgba(8,10,32,0.93)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(79,195,247,0.13)',
        borderRadius: 26,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.88), 0 0 80px rgba(79,195,247,0.05)',
        overflow: 'hidden',
        animation: 'fadeUp 0.4s ease both',
      }}>
        {/* Gradient bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #7c4dff 0%, #4fc3f7 50%, #7c4dff 100%)' }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', margin: '0 auto 14px',
              background: 'radial-gradient(circle at 35% 35%, rgba(124,77,255,0.55), rgba(79,195,247,0.25), rgba(5,4,20,0.9))',
              border: '1px solid rgba(79,195,247,0.25)',
              boxShadow: '0 0 28px rgba(79,195,247,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', animation: 'pulseRing 3s ease-in-out infinite',
            }}>
              ✦
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.55rem', fontWeight: 800, color: '#e8f4fd', letterSpacing: '-0.01em' }}>
              انضم إلى المجرة الحضارية
            </h1>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#4a6070' }}>
              أنشئ حسابك مجاناً كمستكشف وابدأ رحلتك
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 18, padding: '11px 15px',
              background: 'rgba(255,80,80,0.09)', border: '1px solid rgba(255,80,80,0.28)',
              borderRadius: 11, color: '#ff8585', fontSize: '0.87rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="الاسم بالعربية" icon="👤" required>
                <input type="text" placeholder="محمد أحمد"
                  value={form.name_ar} onChange={set('name_ar')} required
                  style={iStyle} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="الاسم بالإنجليزية" icon="🔤" required>
                <input type="text" placeholder="Mohammed Ahmed"
                  value={form.name} onChange={set('name')} required
                  style={{ ...iStyle, direction: 'ltr' }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            {/* Email */}
            <Field label="البريد الإلكتروني" icon="📧" required>
              <input type="email" placeholder="example@domain.com"
                value={form.email} onChange={set('email')} required
                style={{ ...iStyle, direction: 'ltr' }} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            {/* Phone + country code */}
            <Field label="رقم الهاتف" icon="📱">
              <div style={{
                display: 'flex', flexDirection: 'row-reverse',
                border: '1px solid rgba(79,195,247,0.18)',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                transition: 'all 0.2s',
                position: 'relative',
              }}
                onFocusCapture={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = 'rgba(79,195,247,0.65)';
                  el.style.background  = 'rgba(79,195,247,0.08)';
                  el.style.boxShadow   = '0 0 0 3px rgba(79,195,247,0.1)';
                }}
                onBlurCapture={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = 'rgba(79,195,247,0.18)';
                  el.style.background  = 'rgba(255,255,255,0.05)';
                  el.style.boxShadow   = 'none';
                }}
              >
                <input
                  type="tel" placeholder="5X XXX XXXX"
                  value={form.phone} onChange={set('phone')}
                  style={{
                    flex: 1, padding: '13px 14px', background: 'transparent',
                    border: 'none', outline: 'none',
                    color: '#e8f4fd', fontSize: '0.92rem', direction: 'ltr', minWidth: 0,
                    borderRadius: '10px 0 0 10px',
                  }}
                />
                <CountryPicker value={dialCode} onChange={setDialCode} />
              </div>
            </Field>

            {/* Password */}
            <Field label="كلمة المرور" icon="🔒" required>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="8 أحرف على الأقل"
                  value={form.password} onChange={set('password')} required
                  style={{ ...iStyle, paddingLeft: 44 }} onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4a6070', fontSize: '1rem', padding: 2, lineHeight: 1,
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#4fc3f7')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a6070')}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </Field>

            {/* Confirm */}
            <Field label="تأكيد كلمة المرور" icon="🔐" required>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="أعد كتابة كلمة المرور"
                  value={form.confirmPassword} onChange={set('confirmPassword')} required
                  style={{
                    ...iStyle, paddingLeft: 44,
                    borderColor: passMatch === null
                      ? 'rgba(79,195,247,0.18)'
                      : passMatch ? 'rgba(102,187,106,0.45)' : 'rgba(255,80,80,0.4)',
                  }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4a6070', fontSize: '1rem', padding: 2, lineHeight: 1,
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#4fc3f7')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a6070')}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
                {passMatch !== null && (
                  <span style={{
                    position: 'absolute', left: 42, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.9rem',
                  }}>
                    {passMatch ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </Field>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4, padding: '14px',
                background: loading
                  ? 'rgba(79,195,247,0.15)'
                  : 'linear-gradient(135deg, #7c4dff 0%, #4fc3f7 100%)',
                border: loading ? '1px solid rgba(79,195,247,0.2)' : 'none',
                borderRadius: 14, color: '#fff',
                fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: loading ? 'none' : '0 4px 28px rgba(79,195,247,0.28)',
                transition: 'all 0.25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.87'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.25)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  جاري إنشاء حسابك...
                </>
              ) : (
                <> <span>✦</span> إنشاء الحساب والدخول مباشرةً </>
              )}
            </button>

            {/* Footer */}
            <div style={{
              textAlign: 'center', paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div>
                <span style={{ color: '#3a5060', fontSize: '0.86rem' }}>لديك حساب؟ </span>
                <Link href="/login" style={{
                  color: '#4fc3f7', fontWeight: 700, fontSize: '0.86rem', textDecoration: 'none',
                }}>
                  سجّل دخولك ←
                </Link>
              </div>
              <Link href="/" style={{ color: '#2a4050', fontSize: '0.8rem', textDecoration: 'none' }}>
                العودة للرئيسية
              </Link>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
