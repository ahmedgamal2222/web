'use client';

import Link from 'next/link';

export default function GalaxyLogo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
      <img src="/logo.png" alt="المجرة الحضارية" width={54} height={54} style={{ borderRadius: 10, objectFit: 'contain' }} />
      <div>
        <div style={{
          fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '1px',
          background: 'linear-gradient(90deg, #FFD700, #FFA000, #FF6F00)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', fontFamily: "'Tajawal', sans-serif",
        }}>
          المجرة الحضارية
        </div>
        <div style={{ fontSize: '0.72rem', color: '#FFD700', display: 'block', marginTop: -2, fontFamily: "'Tajawal', sans-serif" }}>
          كوكبة المؤسسات المضيئة
        </div>
      </div>
    </Link>
  );
}
