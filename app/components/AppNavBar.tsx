'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { mint: '#EDF7BD', green: '#85C79A', teal: '#4E8D9C', navy: '#281C59', bg: '#080520' };

export function GalaxyLogo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
      <svg width="42" height="42" viewBox="0 0 54 54" fill="none">
        <defs>
          <radialGradient id="rg_shared" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EDF7BD" />
            <stop offset="42%" stopColor="#85C79A" />
            <stop offset="100%" stopColor="#4E8D9C" />
          </radialGradient>
        </defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
        <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_shared)" />
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
      </svg>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, background: `linear-gradient(130deg,${C.mint} 0%,${C.green} 48%,${C.teal} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          المجرة الحضارية
        </div>
        <div style={{ fontSize: '0.7rem', color: C.teal, letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase' }}>
          Civilization Galaxy
        </div>
      </div>
    </Link>
  );
}

const NAV_LINKS = [
  { href: '/news',        label: 'الأخبار' },
  { href: '/campaigns',   label: 'الحملات' },
  { href: '/marketplace', label: 'السوق الرقمي' },
  { href: '/cloud',       label: '☁️ SAAS' },
  { href: '/services',    label: 'الخدمات' },
  { href: '/library',     label: 'المكتبة' },
  { href: '/forum',       label: 'المنتدى' },
  { href: '/podcast',     label: 'البودكاست' },
];

interface AppNavBarProps {
  /** href of the current page to highlight in nav */
  activePage?: string;
}

export default function AppNavBar({ activePage }: AppNavBarProps) {
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
    if (!sid) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success && d.user) setSession(d.user); })
      .catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        .appnav-link { transition: all .18s; }
        .appnav-link:hover { color: #EDF7BD !important; }
        @media (max-width: 768px) {
          .appnav-desktop { display: none !important; }
          .appnav-mobile-btn { display: flex !important; }
        }
      `}</style>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100, height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: 'rgba(8,5,32,.96)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(78,141,156,.2)',
        boxShadow: '0 2px 32px rgba(0,0,0,0.5)',
        fontFamily: "'Cairo', sans-serif",
      }}>
        <GalaxyLogo />

        {/* Desktop nav links */}
        <nav className="appnav-desktop" style={{ display: 'flex', gap: 6 }}>
          {NAV_LINKS.map(l => {
            const isActive = l.href === activePage;
            return (
              <Link key={l.href} href={l.href} className="appnav-link" style={{
                padding: '8px 16px', borderRadius: 24, textDecoration: 'none',
                fontSize: '0.85rem', fontWeight: 600,
                color: isActive ? '#fff' : '#9ca3af',
                background: isActive ? `linear-gradient(135deg,${C.teal},${C.green})` : 'transparent',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,.06)',
                transition: 'all 0.2s',
              }}>{l.label}</Link>
            );
          })}
        </nav>

        {/* Right: auth + mobile menu btn */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!session ? (
            <Link href="/login" style={{
              padding: '7px 18px', borderRadius: 22,
              background: `linear-gradient(135deg,${C.teal},${C.navy})`,
              color: '#fff', fontWeight: 700, fontSize: '.84rem', textDecoration: 'none',
            }}>دخول</Link>
          ) : (
            <Link href="/profile" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', padding: '5px 12px', borderRadius: 20,
              background: `rgba(78,141,156,.12)`, border: '1px solid rgba(78,141,156,.25)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `linear-gradient(135deg,${C.teal},${C.navy})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.8rem', fontWeight: 700, color: '#fff',
              }}>{session.name?.charAt(0) || 'U'}</div>
              <span style={{ color: C.teal, fontSize: '.83rem', fontWeight: 600 }}>{session.name}</span>
            </Link>
          )}

          {/* Hamburger - mobile only */}
          <button
            className="appnav-mobile-btn"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'none', background: 'none', border: 'none',
              color: '#9ca3af', cursor: 'pointer', fontSize: '1.3rem', padding: 4,
            }}
          >{menuOpen ? '✕' : '☰'}</button>
        </div>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, right: 0, left: 0, zIndex: 99,
          background: 'rgba(8,5,32,.97)', borderBottom: '1px solid rgba(78,141,156,.2)',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '10px 16px', borderRadius: 12, textDecoration: 'none',
                color: l.href === activePage ? C.mint : '#ccc',
                background: l.href === activePage ? `rgba(78,141,156,.15)` : 'transparent',
                fontWeight: l.href === activePage ? 700 : 400, fontSize: '0.95rem',
              }}
            >{l.label}</Link>
          ))}
        </div>
      )}
    </>
  );
}
