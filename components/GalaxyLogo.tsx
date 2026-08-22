'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';

export const GALAXY_BRAND_STYLE: CSSProperties = {
  fontFamily: "'Cairo', 'Arial', sans-serif",
  fontSize: '1.32rem',
  fontWeight: 800,
  letterSpacing: '0.4px',
  backgroundImage: 'linear-gradient(135deg, #FFF3C4 0%, #FFD700 40%, #FFB300 68%, #C9962E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 2px 10px rgba(255,215,0,0.28), 0 0 24px rgba(255,215,0,0.18)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

export default function GalaxyLogo({ href = '/', showBrand = true }: { href?: string; showBrand?: boolean }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', userSelect: 'none' }}>
      <img src="/logo.png" alt="المجرة الحضارية" width={54} height={54} style={{ borderRadius: 10, objectFit: 'contain' }} />
      {showBrand && <span style={GALAXY_BRAND_STYLE}>المجرة الحضارية</span>}
    </Link>
  );
}
