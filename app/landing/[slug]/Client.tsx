'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520' };

interface Block {
  type: string;
  title?: string;
  subtitle?: string;
  text?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  imageUrl?: string;
  items?: Array<{ icon?: string; title: string; text?: string }>;
}

function HeroBlock({ block }: { block: Block }) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '80px 32px',
      background: `linear-gradient(135deg, ${C.bg} 0%, #0f0a3a 50%, ${C.teal}22 100%)`,
    }}>
      {block.title && (
        <h1 style={{
          fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, lineHeight: 1.15, margin: '0 0 20px',
          background: `linear-gradient(135deg,#fff 0%,${C.mint} 40%,${C.green} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>{block.title}</h1>
      )}
      {block.subtitle && (
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.8 }}>
          {block.subtitle}
        </p>
      )}
      {block.buttonLabel && block.buttonUrl && (
        <a href={block.buttonUrl} style={{
          display: 'inline-block', padding: '14px 36px', borderRadius: 30,
          background: `linear-gradient(135deg,${C.teal},${C.green})`,
          color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
        }}>{block.buttonLabel}</a>
      )}
    </div>
  );
}

function TextBlock({ block }: { block: Block }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 32px', textAlign: 'center' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>{block.title}</h2>}
      {block.text && <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.9 }}>{block.text}</p>}
    </div>
  );
}

function CtaBlock({ block }: { block: Block }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 32px',
      background: `linear-gradient(135deg,${C.navy}88,${C.teal}22)`,
      borderTop: `1px solid ${C.teal}33`, borderBottom: `1px solid ${C.teal}33`,
    }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>{block.title}</h2>}
      {block.subtitle && <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: '1rem' }}>{block.subtitle}</p>}
      {block.buttonLabel && block.buttonUrl && (
        <a href={block.buttonUrl} style={{
          display: 'inline-block', padding: '14px 40px', borderRadius: 30,
          background: `linear-gradient(135deg,${C.teal},${C.navy})`,
          color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
        }}>{block.buttonLabel}</a>
      )}
    </div>
  );
}

function FeaturesBlock({ block }: { block: Block }) {
  const items = block.items || [];
  return (
    <div style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 40px' }}>{block.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.teal}33`,
            borderRadius: 16, padding: '28px 24px', textAlign: 'center',
          }}>
            {item.icon && <div style={{ fontSize: '2rem', marginBottom: 12 }}>{item.icon}</div>}
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{item.title}</h3>
            {item.text && <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, lineHeight: 1.7 }}>{item.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormBlock({ block }: { block: Block }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div style={{ padding: '60px 32px', maxWidth: 600, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 32px' }}>{block.title}</h2>}
      {sent ? (
        <div style={{ textAlign: 'center', color: C.green, fontSize: '1.1rem', fontWeight: 700 }}>✅ تم إرسال رسالتك بنجاح</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'الاسم', value: name, onChange: setName, type: 'text' },
            { label: 'البريد الإلكتروني', value: email, onChange: setEmail, type: 'email' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.teal}44`, color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6 }}>الرسالة</label>
            <textarea
              value={msg} onChange={e => setMsg(e.target.value)} rows={4}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.teal}44`, color: '#fff', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={() => { if (name && email) setSent(true); }}
            style={{ padding: '12px', borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.green})`, border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          >{block.buttonLabel || 'إرسال'}</button>
        </div>
      )}
    </div>
  );
}

function ImageBlock({ block }: { block: Block }) {
  if (!block.imageUrl) return null;
  return (
    <div style={{ textAlign: 'center', padding: '40px 32px' }}>
      <img src={block.imageUrl} alt={block.title || ''} style={{ maxWidth: '100%', borderRadius: 16, maxHeight: 500, objectFit: 'cover' }} />
      {block.title && <p style={{ color: '#94a3b8', marginTop: 12, fontSize: '0.9rem' }}>{block.title}</p>}
    </div>
  );
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'hero':     return <HeroBlock key={i} block={block} />;
    case 'text':     return <TextBlock key={i} block={block} />;
    case 'cta':      return <CtaBlock key={i} block={block} />;
    case 'features': return <FeaturesBlock key={i} block={block} />;
    case 'form':     return <FormBlock key={i} block={block} />;
    case 'image':    return <ImageBlock key={i} block={block} />;
    default:         return null;
  }
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

  let blocks: Block[] = [];
  try { blocks = JSON.parse(data.content || '[]'); } catch {}

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo, sans-serif', direction: 'rtl', color: '#fff' }}>
      {/* Mini brand bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(8,5,32,0.96)', borderBottom: `1px solid ${C.teal}22` }}>
        <Link href="/" style={{ color: C.mint, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>✦ المجرة الحضارية</Link>
      </div>

      {blocks.length > 0
        ? blocks.map((block, i) => renderBlock(block, i))
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
