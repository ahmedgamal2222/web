'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, accent }: { value: number; onChange: (n: number) => void; accent: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4, direction: 'ltr' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: '1.7rem', color: n <= (hover || value) ? '#facc15' : 'rgba(255,255,255,.18)', transition: 'color .15s, transform .1s', transform: n <= (hover || value) ? 'scale(1.15)' : 'scale(1)' }}>
          ★
        </button>
      ))}
      {value > 0 && <span style={{ alignSelf: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.8rem', marginRight: 6 }}>{value}/5</span>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PublicFormClient() {
  const pathname = usePathname();
  const formId = pathname.split('/').pop();

  const [form, setForm]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [values, setValues]           = useState<Record<string, any>>({});
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');

  // Theming from form settings
  const [accentColor, setAccentColor] = useState('#4E8D9C');
  const [bgColor, setBgColor]         = useState('#080520');
  const [cardBg, setCardBg]           = useState('#10103a');
  const [successMsg, setSuccessMsg]   = useState('تم إرسال النموذج بنجاح، شكراً لك!');
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    if (!formId || formId === 'default') return;
    fetch(`${API}/api/cloud/forms/${formId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setForm(data.data);
          const s = data.data.settings || {};
          if (s.accent_color) setAccentColor(s.accent_color);
          if (s.bg_color)     setBgColor(s.bg_color);
          if (s.card_bg)      setCardBg(s.card_bg);
          if (s.success_message) setSuccessMsg(s.success_message);
          if (s.redirect_url) setRedirectUrl(s.redirect_url);
          // init default values
          const init: Record<string, any> = {};
          (data.data.fields || []).forEach((f: any) => {
            if (f.type === 'checkbox') init[f.id] = [];
            else if (f.type === 'rating') init[f.id] = 0;
            else init[f.id] = '';
          });
          setValues(init);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [formId]);

  const setVal = (id: string, v: any) => {
    setValues(prev => ({ ...prev, [id]: v }));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const toggleCheck = (id: string, opt: string) => {
    setValues(prev => {
      const arr: string[] = prev[id] || [];
      return { ...prev, [id]: arr.includes(opt) ? arr.filter((x: string) => x !== opt) : [...arr, opt] };
    });
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    (form?.fields || []).forEach((f: any) => {
      if (!f.required || f.type === 'divider') return;
      const v = values[f.id];
      if (f.type === 'checkbox' && (!v || !v.length)) errs[f.id] = 'يرجى اختيار خيار واحد على الأقل';
      else if (f.type === 'rating' && (!v || v === 0)) errs[f.id] = 'يرجى اختيار تقييم';
      else if (!v || String(v).trim() === '') errs[f.id] = 'هذا الحقل مطلوب';
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/public/forms/${formId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values, submitter_name: name, submitter_email: email }),
      });
      const j = await res.json();
      if (j.success) {
        setSubmitted(true);
        if (redirectUrl) setTimeout(() => { window.location.href = redirectUrl; }, 3500);
      } else { alert(j.error || 'حدث خطأ أثناء الإرسال'); }
    } catch { alert('تعذّر الاتصال بالخادم'); }
    setSubmitting(false);
  };

  // ── states ──────────────────────────────────────────────────────────────────
  const lightBg = bgColor.startsWith('#f') || bgColor.startsWith('#e') || parseInt(bgColor.slice(1, 3), 16) > 180;
  const textColor = lightBg ? '#1a1a2e'      : '#e8f4f8';
  const subText   = lightBg ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)';
  const fieldBg   = lightBg ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.06)';
  const fieldBdr  = lightBg ? 'rgba(0,0,0,.15)' : 'rgba(255,255,255,.14)';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: subText, fontFamily: 'Cairo,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
        <div>جاري تحميل النموذج...</div>
      </div>
    </div>
  );

  if (!form) return (
    <div style={{ minHeight: '100vh', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo,sans-serif' }}>
      <div style={{ textAlign: 'center', color: subText }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</div>
        <div>النموذج غير موجود أو تم حذفه</div>
      </div>
    </div>
  );

  if (form.status === 'closed') return (
    <div style={{ minHeight: '100vh', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo,sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40, background: cardBg, borderRadius: 20, border: `1px solid ${accentColor}30`, maxWidth: 460, color: textColor }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 14 }}>🔒</div>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 8 }}>النموذج مغلق</div>
        <div style={{ color: subText, fontSize: '.9rem' }}>هذا النموذج لم يعد يقبل ردوداً جديدة.</div>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo,sans-serif', padding: 20 }}>
      <div style={{ textAlign: 'center', padding: 48, background: cardBg, borderRadius: 24, border: `2px solid ${accentColor}40`, maxWidth: 500, width: '100%', color: textColor, boxShadow: `0 0 60px ${accentColor}18` }}>
        <div style={{ fontSize: '3.2rem', marginBottom: 16 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 10, color: accentColor }}>{successMsg}</div>
        {redirectUrl && <div style={{ color: subText, fontSize: '.83rem', marginTop: 16 }}>سيتم تحويلك خلال ثوانٍ...</div>}
      </div>
    </div>
  );

  const fields: any[] = form.fields || [];

  return (
    <div style={{ minHeight: '100vh', background: bgColor, fontFamily: 'Cairo,sans-serif', direction: 'rtl', padding: '30px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header Card */}
        <div style={{ background: cardBg, borderRadius: 20, padding: '28px 30px', marginBottom: 18, border: `1px solid ${accentColor}30`, boxShadow: `0 4px 40px rgba(0,0,0,.3)` }}>
          <div style={{ width: 44, height: 5, background: accentColor, borderRadius: 3, marginBottom: 16 }} />
          <h1 style={{ color: textColor, fontWeight: 900, fontSize: '1.45rem', margin: '0 0 8px' }}>{form.title}</h1>
          {form.description && <p style={{ color: subText, fontSize: '.92rem', margin: 0, lineHeight: 1.7 }}>{form.description}</p>}
        </div>

        {/* Respondent info */}
        <div style={{ background: cardBg, borderRadius: 16, padding: '20px 24px', marginBottom: 14, border: `1px solid ${accentColor}20` }}>
          <div style={{ fontWeight: 700, color: textColor, fontSize: '.88rem', marginBottom: 12 }}>معلومات المُستجيب (اختيارية)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.74rem', color: subText, marginBottom: 4, fontWeight: 600 }}>الاسم</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكامل (اختياري)" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${fieldBdr}`, background: fieldBg, color: textColor, outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.85rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.74rem', color: subText, marginBottom: 4, fontWeight: 600 }}>البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="بريدك الإلكتروني (اختياري)" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${fieldBdr}`, background: fieldBg, color: textColor, outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.85rem', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Fields */}
        {fields.length > 0 && (
          <div style={{ background: cardBg, borderRadius: 16, padding: '20px 24px', marginBottom: 18, border: `1px solid ${accentColor}20` }}>
            <FieldGrid fields={fields} values={values} errors={errors} textColor={textColor} subText={subText} fieldBg={fieldBg} fieldBdr={fieldBdr} accentColor={accentColor} onVal={setVal} onCheck={toggleCheck} />
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg,${accentColor},${accentColor}88)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '1.05rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Cairo,sans-serif', opacity: submitting ? .7 : 1, boxShadow: `0 6px 24px ${accentColor}40`, transition: 'opacity .2s' }}>
          {submitting ? '⏳ جاري الإرسال...' : '📨 إرسال النموذج'}
        </button>
      </div>
    </div>
  );
}

// ─── Field Grid ────────────────────────────────────────────────────────────────
function FieldGrid({ fields, values, errors, textColor, subText, fieldBg, fieldBdr, accentColor, onVal, onCheck }: any) {
  // Pair half-width fields
  const rows: any[][] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.type === 'divider') { rows.push([f]); i++; continue; }
    if ((f.width || 'full') === 'half' && i + 1 < fields.length && (fields[i + 1].width || 'full') === 'half' && fields[i + 1].type !== 'divider') {
      rows.push([f, fields[i + 1]]); i += 2;
    } else {
      rows.push([f]); i++;
    }
  }

  const iStyle = (hasErr: boolean) => ({
    width: '100%', padding: '9px 12px', borderRadius: 9,
    border: `1px solid ${hasErr ? '#ef4444' : fieldBdr}`,
    background: fieldBg, color: textColor, outline: 'none',
    fontFamily: 'Cairo,sans-serif', fontSize: '.88rem', boxSizing: 'border-box' as const,
    transition: 'border-color .2s',
  });

  const renderField = (f: any) => {
    if (f.type === 'divider') return (
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
        <div style={{ flex: 1, height: 1, background: `${accentColor}30` }} />
        {f.label && <span style={{ color: subText, fontSize: '.8rem', whiteSpace: 'nowrap' }}>{f.label}</span>}
        {f.label && <div style={{ flex: 1, height: 1, background: `${accentColor}30` }} />}
      </div>
    );

    const err = errors[f.id];
    const val = values[f.id];

    const labelEl = (
      <label style={{ display: 'block', fontWeight: 700, color: textColor, marginBottom: 5, fontSize: '.88rem' }}>
        {f.label}
        {f.required && <span style={{ color: '#ef4444', marginRight: 3 }}>*</span>}
      </label>
    );
    const helpEl = f.helpText && <div style={{ color: subText, fontSize: '.75rem', marginTop: 4 }}>{f.helpText}</div>;
    const errEl  = err && <div style={{ color: '#ef4444', fontSize: '.74rem', marginTop: 3 }}>{err}</div>;

    let input: React.ReactNode;
    const baseInputStyle = iStyle(!!err);

    if (f.type === 'textarea') {
      input = <textarea value={val || ''} onChange={e => onVal(f.id, e.target.value)} placeholder={f.placeholder} rows={4} style={{ ...baseInputStyle, resize: 'vertical' }} />;
    } else if (f.type === 'select') {
      input = (
        <select value={val || ''} onChange={e => onVal(f.id, e.target.value)} style={{ ...baseInputStyle, appearance: 'none' }}>
          <option value="">— اختر خياراً —</option>
          {(f.options || []).map((o: string, i: number) => <option key={i} value={o}>{o}</option>)}
        </select>
      );
    } else if (f.type === 'radio') {
      input = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 2 }}>
          {(f.options || []).map((o: string, i: number) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: textColor, fontSize: '.88rem' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${val === o ? accentColor : fieldBdr}`, background: val === o ? accentColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {val === o && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'block' }} />}
              </span>
              <input type="radio" name={f.id} value={o} checked={val === o} onChange={() => onVal(f.id, o)} style={{ display: 'none' }} />
              {o}
            </label>
          ))}
        </div>
      );
    } else if (f.type === 'checkbox') {
      const checked: string[] = val || [];
      input = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 2 }}>
          {(f.options || []).map((o: string, i: number) => {
            const on = checked.includes(o);
            return (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: textColor, fontSize: '.88rem' }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${on ? accentColor : fieldBdr}`, background: on ? accentColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                  {on && <span style={{ color: '#fff', fontSize: '.7rem', fontWeight: 800 }}>✓</span>}
                </span>
                <input type="checkbox" checked={on} onChange={() => onCheck(f.id, o)} style={{ display: 'none' }} />
                {o}
              </label>
            );
          })}
        </div>
      );
    } else if (f.type === 'rating') {
      input = <StarRating value={val || 0} onChange={v => onVal(f.id, v)} accent={accentColor} />;
    } else if (f.type === 'file') {
      input = <input type="file" onChange={e => onVal(f.id, e.target.files?.[0]?.name || '')} style={{ ...baseInputStyle, paddingTop: 7 }} />;
    } else {
      const typeMap: Record<string, string> = { email: 'email', phone: 'tel', number: 'number', date: 'date', text: 'text' };
      input = <input type={typeMap[f.type] || 'text'} value={val || ''} onChange={e => onVal(f.id, e.target.value)} placeholder={f.placeholder} style={baseInputStyle} />;
    }

    return (
      <div>
        {labelEl}
        {input}
        {helpEl}
        {errEl}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((row, ri) => (
        row.length === 1 ? (
          <div key={ri}>{renderField(row[0])}</div>
        ) : (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {row.map((f, fi) => <div key={fi}>{renderField(f)}</div>)}
          </div>
        )
      ))}
    </div>
  );
}
