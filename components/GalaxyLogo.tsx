'use client';

import Link from 'next/link';

export default function GalaxyLogo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', userSelect: 'none' }}>
      <img src="/logo.png" alt="المجرة الحضارية" width={54} height={54} style={{ borderRadius: 10, objectFit: 'contain' }} />
    </Link>
  );
}
