'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchSiteSettings } from '@/lib/api';
import type { SiteSettings } from '@/lib/api';

export interface NavbarLink {
  id?: string;
  label: string;
  url: string;
  visible: boolean;
  icon?: string;
}

export interface SiteNavbarConfig {
  backgroundColor: string;
  logoType: 'text' | 'image';
  logoText: string;
  logoImageUrl: string;
  links: NavbarLink[];
  height?: number;
}

const DEFAULT_CONFIG: SiteNavbarConfig = {
  backgroundColor: '#0a0a1a',
  logoType: 'text',
  logoText: 'المجرة الحضارية',
  logoImageUrl: '',
  links: [],
  height: 72,
};

interface RealNavbarProps {
  config?: Partial<SiteNavbarConfig>;
  activePath?: string;
}

export default function RealNavbar({ config, activePath }: RealNavbarProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchSiteSettings();
      if (!cancelled && data) setSettings(data);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, height: DEFAULT_CONFIG.height,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', background: DEFAULT_CONFIG.backgroundColor,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ width: 120, height: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
        <div style={{ width: 200, height: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
      </header>
    );
  }

  const siteSettings = settings || {};
  const primaryColor = siteSettings.primary_color || '#FFD700';
  const secondaryColor = siteSettings.secondary_color || '#4E8D9C';
  const backgroundColor = config?.backgroundColor || siteSettings.background_color || DEFAULT_CONFIG.backgroundColor;

  let navbarLinks: NavbarLink[] = [];
  try {
    navbarLinks = siteSettings.navbar_links ? JSON.parse(siteSettings.navbar_links) : [];
  } catch {}

  const visibleLinks = navbarLinks.filter((l: NavbarLink) => l.visible !== false);

  const logoContent = (() => {
    const logoUrl = config?.logoImageUrl || siteSettings.logo_url || '';
    if (logoUrl) {
      return (
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', userSelect: 'none', flexShrink: 0 }}>
          <img src={logoUrl} alt={siteSettings.site_name || 'Logo'} width={48} height={48} style={{ borderRadius: 10, objectFit: 'contain' }} />
        </Link>
      );
    }
    const logoText = config?.logoText || siteSettings.site_name || DEFAULT_CONFIG.logoText;
    return (
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', userSelect: 'none', flexShrink: 0 }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: primaryColor, whiteSpace: 'nowrap' }}>{logoText}</span>
      </Link>
    );
  })();

  return (
    <>
      <style>{`
        .realnav-link { transition: all 0.2s; }
        .realnav-link:hover { filter: brightness(1.15); }
      `}</style>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: config?.height || DEFAULT_CONFIG.height,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: `linear-gradient(180deg, ${backgroundColor} 0%, ${backgroundColor} 65%, transparent 100%)`,
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderBottom: `1px solid ${secondaryColor}33`,
        boxShadow: `0 2px 40px rgba(0,0,0,0.6), inset 0 -1px 0 ${primaryColor}15`,
      }}>
        {logoContent}

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {visibleLinks.length === 0 && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', padding: '4px 12px' }}>لا توجد روابط</span>
          )}
          {visibleLinks.map((link: NavbarLink) => {
            const href = link.url || '#';
            const isExternal = href.startsWith('http://') || href.startsWith('https://');
            const isActive = !isExternal && activePath ? href === activePath || activePath.startsWith(href + '/') || activePath.startsWith(href + '?') : false;
            return (
              <Link
                key={link.id || href}
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="realnav-link"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px',
                  background: isActive ? `${primaryColor}18` : `${primaryColor}08`,
                  border: `1px solid ${isActive ? `${primaryColor}50` : `${primaryColor}25`}`,
                  borderRadius: 40,
                  color: isActive ? primaryColor : `${primaryColor}cc`,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  fontWeight: isActive ? 700 : 600,
                  transition: 'all 0.2s',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = primaryColor;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${primaryColor}50`;
                  (e.currentTarget as HTMLAnchorElement).style.background = `${primaryColor}18`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = `${primaryColor}cc`;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${primaryColor}25`;
                  (e.currentTarget as HTMLAnchorElement).style.background = `${primaryColor}08`;
                }}
              >
                {link.icon && <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ width: 80, flexShrink: 0 }} />
      </header>
    </>
  );
}
