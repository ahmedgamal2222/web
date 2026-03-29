'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520' };
const T = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A' };

// ─── Unified block renderer ────────────────────────────────────────────────
function PreviewBlock({ block }: { block: any }) {
  if (block.type === 'hero') return (
    <div style={{ minHeight: `${block.minHeight || 60}vh`, display: 'flex', flexDirection: 'column', alignItems: block.align === 'right' ? 'flex-end' : block.align === 'left' ? 'flex-start' : 'center', justifyContent: 'center', textAlign: (block.align || 'center') as any, padding: '80px 40px', background: block.bgGradient || `linear-gradient(135deg,#080520 0%,#0f0a3a 50%,${C.teal}22 100%)`, position: 'relative', overflow: 'hidden' }}>
      {block.imageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${block.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: .22 }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, width: '100%', margin: '0 auto' }}>
        {block.title && <h1 style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 18px', background: `linear-gradient(135deg,#fff 0%,${T.mint} 40%,${T.green} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{block.title}</h1>}
        {block.subtitle && <p style={{ fontSize: '1.25rem', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.8 }}>{block.subtitle}</p>}
        {block.text && <p style={{ fontSize: '1rem', color: '#64748b', margin: '0 0 28px' }}>{block.text}</p>}
        {block.buttonLabel && block.buttonUrl && <a href={block.buttonUrl} style={{ display: 'inline-block', padding: '14px 40px', borderRadius: 32, background: `linear-gradient(135deg,${T.teal},${T.green})`, color: '#fff', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', boxShadow: `0 8px 30px ${T.teal}55` }}>{block.buttonLabel}</a>}
      </div>
    </div>
  );

  if (block.type === 'text') return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px', textAlign: (block.align || 'center') as any }}>
      {block.title && <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 18px' }}>{block.title}</h2>}
      {block.text && <p style={{ fontSize: `${block.fontSize || 17}px`, color: block.textColor || '#94a3b8', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{block.text}</p>}
    </div>
  );

  if (block.type === 'cta') {
    const bc = block.buttonColor || T.teal;
    const isOutline = block.btnStyle === 'outline';
    return (
      <div style={{ textAlign: 'center', padding: '70px 32px', background: block.bgColor || '#1a1a4a', borderTop: `1px solid ${T.teal}22`, borderBottom: `1px solid ${T.teal}22` }}>
        {block.title && <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>{block.title}</h2>}
        {block.subtitle && <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: 32 }}>{block.subtitle}</p>}
        {block.buttonLabel && block.buttonUrl && <a href={block.buttonUrl} style={{ display: 'inline-block', padding: '15px 44px', borderRadius: 32, background: isOutline ? 'transparent' : bc, border: isOutline ? `2px solid ${bc}` : 'none', color: isOutline ? bc : '#fff', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', boxShadow: isOutline ? 'none' : `0 8px 30px ${bc}55` }}>{block.buttonLabel}</a>}
      </div>
    );
  }

  if (block.type === 'features') return (
    <div style={{ padding: '70px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 48px' }}>{block.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(block.columns || 3, 4)},1fr)`, gap: 24 }}>
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} style={{ background: block.cardBg || 'rgba(255,255,255,.04)', border: `1px solid ${T.teal}22`, borderRadius: 18, padding: '32px 24px', textAlign: 'center' }}>
            {item.icon && <div style={{ fontSize: '2.4rem', marginBottom: 14 }}>{item.icon}</div>}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>{item.title}</h3>
            {item.text && <p style={{ fontSize: '.95rem', color: '#64748b', lineHeight: 1.8 }}>{item.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'image') return (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      {block.imageUrl
        ? <img src={block.imageUrl} alt={block.title || ''} style={{ maxWidth: '100%', height: `${block.imageHeight || 400}px`, objectFit: (block.objectFit || 'cover') as any, borderRadius: `${block.borderRadius || 0}px`, display: 'inline-block' }} />
        : null}
      {block.title && <p style={{ color: '#64748b', marginTop: 12, fontSize: '.9rem' }}>{block.title}</p>}
    </div>
  );

  if (block.type === 'video') {
    const url = block.videoUrl || '';
    const yt = url.includes('youtube.com') || url.includes('youtu.be');
    const ytId = yt ? (url.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/)?.[1] || '') : '';
    return (
      <div style={{ padding: '40px 32px', maxWidth: 900, margin: '0 auto' }}>
        {block.title && <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 24 }}>{block.title}</h2>}
        {yt && ytId ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 16, overflow: 'hidden' }}>
            <iframe src={`https://www.youtube.com/embed/${ytId}${block.autoplay ? '?autoplay=1&mute=1' : ''}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
          </div>
        ) : url ? (
          <video src={url} controls autoPlay={!!block.autoplay} style={{ width: '100%', borderRadius: 16 }} />
        ) : null}
      </div>
    );
  }

  if (block.type === 'gallery') return (
    <div style={{ padding: '60px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 36px' }}>{block.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns || 3},1fr)`, gap: 12 }}>
        {(block.galleryItems || []).map((item: any, i: number) => (
          <div key={i} style={{ borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            {item.caption && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.65))', color: '#fff', fontSize: '.82rem', padding: '20px 10px 8px' }}>{item.caption}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'stats') return (
    <div style={{ padding: '70px 32px', background: 'rgba(78,141,156,.05)', borderTop: '1px solid rgba(78,141,156,.14)', borderBottom: '1px solid rgba(78,141,156,.14)' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 44px' }}>{block.title}</h2>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} style={{ textAlign: 'center' }}>
            {item.icon && <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{item.icon}</div>}
            <div style={{ fontSize: '2.8rem', fontWeight: 900, background: `linear-gradient(135deg,${T.teal},${T.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>{item.value}</div>
            <div style={{ fontSize: '.95rem', color: '#64748b', marginTop: 6 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'testimonials') return (
    <div style={{ padding: '70px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 40px' }}>{block.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22 }}>
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '28px 24px' }}>
            <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.85, marginBottom: 20, fontStyle: 'italic' }}>"{item.text}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.avatar ? <img src={item.avatar} alt={item.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${T.teal},${T.navy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{item.name?.charAt(0)}</div>}
              <div><div style={{ color: '#fff', fontWeight: 700 }}>{item.name}</div>{item.role && <div style={{ fontSize: '.82rem', color: '#64748b' }}>{item.role}</div>}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'faq') return (
    <div style={{ padding: '70px 32px', maxWidth: 820, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 40px' }}>{block.title}</h2>}
      {(block.items || []).map((item: any, i: number) => <FaqItem key={i} item={item} />)}
    </div>
  );

  if (block.type === 'form') return <LiveFormBlock block={block} />;

  if (block.type === 'divider') {
    const col = block.color || 'rgba(78,141,156,.3)';
    return (
      <div style={{ padding: '16px 32px' }}>
        {block.style === 'gradient' ? <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${col},transparent)` }} /> :
         block.style === 'dots'     ? <div style={{ textAlign: 'center', color: col, letterSpacing: 12, fontSize: '1.2rem' }}>• • • • •</div> :
         <hr style={{ border: 'none', borderTop: `1.5px ${block.style === 'dashed' ? 'dashed' : 'solid'} ${col}` }} />}
      </div>
    );
  }

  if (block.type === 'spacer') return <div style={{ height: `${block.height || 60}px` }} />;
  if (block.type === 'html') return <div dangerouslySetInnerHTML={{ __html: block.rawHtml || '' }} />;
  return null;
}

function FaqItem({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'right', padding: '18px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Cairo,sans-serif' }}>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.02rem', flex: 1 }}>{item.question}</span>
        <span style={{ color: C.teal, fontSize: '1.2rem', marginRight: 10, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && <p style={{ color: '#94a3b8', lineHeight: 1.85, paddingBottom: 18, marginTop: 0 }}>{item.answer}</p>}
    </div>
  );
}

function LiveFormBlock({ block }: { block: any }) {
  const [vals, setVals] = useState<Record<string, any>>({});
  const [sent, setSent] = useState(false);
  const ff: any[] = block.formFields || [];
  const fS: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.055)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.95rem', boxSizing: 'border-box' };
  return (
    <div style={{ padding: '70px 32px', background: block.bgColor && block.bgColor !== 'transparent' ? block.bgColor : undefined }}>
      <div style={{ maxWidth: 620, margin: '0 auto', background: 'rgba(255,255,255,.03)', border: `1px solid ${C.teal}33`, borderRadius: 24, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}>
        {block.title && <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', textAlign: 'center', margin: '0 0 32px' }}>{block.title}</h2>}
        {sent ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>✅</div>
            <p style={{ color: C.green, fontWeight: 700, fontSize: '1.1rem' }}>{block.successMsg || 'تم الإرسال بنجاح!'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {ff.map((field: any) => (
              <div key={field.id}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,.75)', fontSize: '.9rem', fontWeight: 700, marginBottom: 7 }}>
                  {field.label}{field.required && <span style={{ color: '#f87171', marginRight: 4 }}>*</span>}
                </label>
                {field.type === 'textarea'  ? <textarea value={vals[field.id] || ''} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.value }))} placeholder={field.placeholder} rows={4} style={{ ...fS, resize: 'vertical' }} />
                : field.type === 'select'   ? <select value={vals[field.id] || ''} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.value }))} style={{ ...fS, cursor: 'pointer' }}><option value="">— اختر —</option>{(field.options || []).map((o: string, i: number) => <option key={i} value={o}>{o}</option>)}</select>
                : field.type === 'radio'    ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{(field.options || []).map((o: string, i: number) => <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#94a3b8' }}><input type="radio" name={field.id} value={o} checked={vals[field.id] === o} onChange={() => setVals(v => ({ ...v, [field.id]: o }))} style={{ accentColor: C.teal }} />{o}</label>)}</div>
                : field.type === 'checkbox' ? <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#94a3b8' }}><input type="checkbox" checked={!!vals[field.id]} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.checked }))} style={{ accentColor: C.teal, width: 18, height: 18 }} />{field.placeholder || field.label}</label>
                : <input type={field.type || 'text'} value={vals[field.id] || ''} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.value }))} placeholder={field.placeholder} style={fS} />}
              </div>
            ))}
            <button onClick={() => { const m = ff.filter((f: any) => f.required && !vals[f.id]); if (m.length) { alert(`يرجى ملء:\n${m.map((f: any) => f.label).join('، ')}`); return; } setSent(true); }} style={{ padding: '14px', borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.navy})`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', marginTop: 6 }}>
              {block.submitLabel || 'إرسال'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



export default function LandingPageClient({ slug: _slug }: { slug: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // With static export + _redirects rewrite, params.slug is always "default".
    // Read the real slug from the browser URL instead.
    const pathSlug = typeof window !== 'undefined'
      ? window.location.pathname.replace(/\/$/, '').split('/').pop()
      : _slug;
    const slug = (!pathSlug || pathSlug === 'default') ? _slug : pathSlug;
    if (!slug || slug === 'default') { setNotFound(true); setLoading(false); return; }

    fetch(`${API}/api/public/landing/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setData(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.teal, fontSize: '1.1rem' }}>جاري التحميل…</div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>🌌</div>
      <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 12px' }}>الصفحة غير موجودة</h1>
      <p style={{ color: '#94a3b8', marginBottom: 28 }}>قد تكون الصفحة غير منشورة أو تم حذفها</p>
      <Link href="/" style={{ padding: '10px 28px', borderRadius: 24, background: `linear-gradient(135deg,${C.teal},${C.green})`, color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
        الصفحة الرئيسية
      </Link>
    </div>
  );

  let blocks: any[] = [];
  try { blocks = Array.isArray(data.content) ? data.content : JSON.parse(data.content || '[]'); } catch {}

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo, sans-serif', direction: 'rtl', color: '#fff' }}>
      {/* Mini brand bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(8,5,32,0.96)', borderBottom: `1px solid ${C.teal}22` }}>
        <Link href="/" style={{ color: C.mint, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>✦ المجرة الحضارية</Link>
      </div>

      {blocks.length > 0
        ? blocks.map((block, i) => <PreviewBlock key={i} block={block} />)
        : (
          <div style={{ textAlign: 'center', padding: '100px 32px', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
            <h2 style={{ color: '#fff', margin: '0 0 12px' }}>{data.title}</h2>
            <p>هذه الصفحة لا تحتوي محتوى بعد</p>
          </div>
        )
      }

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px', borderTop: `1px solid ${C.teal}22`, color: '#4b5563', fontSize: '0.8rem', marginTop: 40 }}>
        مدعوم بواسطة{' '}
        <Link href="/" style={{ color: C.teal, textDecoration: 'none', fontWeight: 700 }}>المجرة الحضارية</Link>
      </div>
    </div>
  );
}
