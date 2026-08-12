'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
  bg: '#07091e',
  card: '#0d1129',
  border: '#1a1f3d',
  teal: '#4E8D9C',
  gold: '#FFD700',
  text: '#e2eaf2',
  muted: '#7a96aa',
  green: '#22c55e',
  red: '#ef4444',
};

interface NavbarLink {
  label: string;
  href: string;
  icon: string;
  visible: boolean;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  visible: boolean;
}

interface SiteSettings {
  id: number;
  site_name: string;
  site_tagline: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  navbar_links: string;
  social_links: string;
  footer_text: string;
  custom_css: string | null;
  updated_at: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    site_name: '',
    site_tagline: '',
    logo_url: '',
    primary_color: '#FFD700',
    secondary_color: '#4E8D9C',
    background_color: '#0a0a1a',
    text_color: '#e2eaf2',
    footer_text: '© 2026 المجرة الحضارية',
    custom_css: '',
    navbar_links: '' as string,
    social_links: '' as string,
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login?redirect=/admin/settings'); return; }
    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') { router.push('/'); return; }
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      const sid = localStorage.getItem('sessionId') || '';
      const res = await fetch(`${API_BASE}/api/site-settings`, {
        headers: { 'X-Session-ID': sid },
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setForm({
          site_name: data.settings.site_name || '',
          site_tagline: data.settings.site_tagline || '',
          logo_url: data.settings.logo_url || '',
          primary_color: data.settings.primary_color || '#FFD700',
          secondary_color: data.settings.secondary_color || '#4E8D9C',
          background_color: data.settings.background_color || '#0a0a1a',
          text_color: data.settings.text_color || '#e2eaf2',
          footer_text: data.settings.footer_text || '© 2026 المجرة الحضارية',
          custom_css: data.settings.custom_css || '',
          navbar_links: typeof data.settings.navbar_links === 'string' ? data.settings.navbar_links : JSON.stringify(data.settings.navbar_links || []),
          social_links: typeof data.settings.social_links === 'string' ? data.settings.social_links : JSON.stringify(data.settings.social_links || []),
        });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'فشل تحميل الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const sid = localStorage.getItem('sessionId') || '';
      const res = await fetch(`${API_BASE}/api/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'فشل الحفظ');
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
      loadSettings();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'فشل الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚙️</div>
          <div style={{ color: C.muted }}>جاري تحميل الإعدادات...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ color: C.teal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>→ لوحة التحكم</Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>⚙️ إعدادات الموقع</h1>
          <div style={{ marginRight: 'auto', display: 'flex', gap: 10 }}>
            <button onClick={() => setPreviewMode(false)} style={{ padding: '8px 20px', borderRadius: 10, border: previewMode ? 'none' : '2px solid ' + C.teal, background: previewMode ? 'transparent' : C.teal, color: previewMode ? C.muted : 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>✏️ تعديل</button>
            <button onClick={() => setPreviewMode(true)} style={{ padding: '8px 20px', borderRadius: 10, border: previewMode ? '2px solid ' + C.gold : 'none', background: previewMode ? 'rgba(255,215,0,0.15)' : 'transparent', color: C.gold, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>👁 معاينة</button>
          </div>
        </div>

        {message && (
          <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24, background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? C.green : C.red}`, color: message.type === 'success' ? C.green : C.red, fontWeight: 600 }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: previewMode ? '1fr 1fr' : '1fr', gap: 24 }}>
          {/* Settings Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* General Settings */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>📝 الإعدادات العامة</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>اسم الموقع</label>
                  <input value={form.site_name} onChange={e => updateField('site_name', e.target.value)} disabled={previewMode} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none', opacity: previewMode ? 0.6 : 1 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>وصف الموقع</label>
                  <input value={form.site_tagline} onChange={e => updateField('site_tagline', e.target.value)} disabled={previewMode} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none', opacity: previewMode ? 0.6 : 1 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>رابط الشعار (URL)</label>
                  <input value={form.logo_url} onChange={e => updateField('logo_url', e.target.value)} disabled={previewMode} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none', opacity: previewMode ? 0.6 : 1 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>نص الفوتر</label>
                  <input value={form.footer_text} onChange={e => updateField('footer_text', e.target.value)} disabled={previewMode} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none', opacity: previewMode ? 0.6 : 1 }} />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>🎨 الألوان</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { key: 'primary_color', label: 'اللون الأساسي' },
                  { key: 'secondary_color', label: 'اللون الثانوي' },
                  { key: 'background_color', label: 'لون الخلفية' },
                  { key: 'text_color', label: 'لون النص' },
                ].map(color => (
                  <div key={color.key}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>{color.label}</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={form[color.key as keyof typeof form] as string} onChange={e => updateField(color.key, e.target.value)} disabled={previewMode} style={{ width: 40, height: 40, borderRadius: 8, border: `1px solid ${C.border}`, cursor: previewMode ? 'not-allowed' : 'pointer', opacity: previewMode ? 0.6 : 1 }} />
                      <input value={form[color.key as keyof typeof form] as string} onChange={e => updateField(color.key, e.target.value)} disabled={previewMode} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem', outline: 'none', opacity: previewMode ? 0.6 : 1 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navbar Links */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>🔗 روابط الناف بار</h2>
              <textarea value={form.navbar_links} onChange={e => updateField('navbar_links', e.target.value)} disabled={previewMode} rows={8} placeholder='[{"label": "الرئيسية", "href": "/", "icon": "🏠", "visible": true}]' style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace', opacity: previewMode ? 0.6 : 1 }} />
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: C.muted }}>أضف الروابط كـ JSON array. كل عنصر يحتوي على: label, href, icon, visible</p>
            </div>

            {/* Social Links */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>📱 روابط التواصل الاجتماعي</h2>
              <textarea value={form.social_links} onChange={e => updateField('social_links', e.target.value)} disabled={previewMode} rows={6} placeholder='[{"platform": "youtube", "url": "https://...", "icon": "▶", "visible": true}]' style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace', opacity: previewMode ? 0.6 : 1 }} />
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: C.muted }}>أضف روابط التواصل كـ JSON array. كل عنصر يحتوي على: platform, url, icon, visible</p>
            </div>

            {/* Custom CSS */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>💨 CSS مخصص</h2>
              <textarea value={form.custom_css} onChange={e => updateField('custom_css', e.target.value)} disabled={previewMode} rows={6} placeholder="/* أضف CSS مخصص هنا */" style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace', opacity: previewMode ? 0.6 : 1 }} />
            </div>

            {/* Save Button */}
            {!previewMode && (
              <button onClick={handleSave} disabled={saving} style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#0a0a1a', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,215,0,0.3)', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
              </button>
            )}
          </div>

          {/* Preview Panel */}
          {previewMode && (
            <div style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: C.gold }}>👁 معاينة حية</h3>
                <div style={{ background: form.background_color || '#0a0a1a', borderRadius: 12, padding: 20, color: form.text_color || '#e2eaf2', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", border: `1px solid ${C.border}` }}>
                  {/* Logo Preview */}
                  {form.logo_url && (
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <img src={form.logo_url} alt="Logo" style={{ maxWidth: 80, maxHeight: 80, borderRadius: 10, objectFit: 'contain' }} />
                    </div>
                  )}
                  {/* Site Name */}
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: form.primary_color || C.gold }}>{form.site_name || 'اسم الموقع'}</div>
                    <div style={{ fontSize: '0.85rem', color: form.secondary_color || C.teal, marginTop: 4 }}>{form.site_tagline || 'وصف الموقع'}</div>
                  </div>
                  {/* Navbar Preview */}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', margin: '20px 0', padding: '12px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                    {(() => {
                      try {
                        const links = JSON.parse(form.navbar_links || '[]');
                        return links.filter((l: any) => l.visible !== false).map((link: NavbarLink, i: number) => (
                          <div key={i} style={{ padding: '6px 14px', borderRadius: 8, background: `${form.primary_color || C.gold}15`, color: form.primary_color || C.gold, fontSize: '0.85rem', fontWeight: 600 }}>
                            {link.icon} {link.label}
                          </div>
                        ));
                      } catch {
                        return <span style={{ color: C.muted }}>خطأ في JSON</span>;
                      }
                    })()}
                  </div>
                  {/* Social Preview */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0' }}>
                    {(() => {
                      try {
                        const socials = JSON.parse(form.social_links || '[]');
                        return socials.filter((s: any) => s.visible !== false).map((social: SocialLink, i: number) => (
                          <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: `${form.primary_color || C.gold}20`, color: form.primary_color || C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                            {social.icon}
                          </div>
                        ));
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                  {/* Footer */}
                  <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: '0.8rem', color: C.muted }}>
                    {form.footer_text}
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: C.gold }}>🎨 الألوان</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { name: 'أساسي', color: form.primary_color },
                    { name: 'ثانوي', color: form.secondary_color },
                    { name: 'خلفية', color: form.background_color },
                    { name: 'نص', color: form.text_color },
                  ].map(c => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: c.color, border: `1px solid ${C.border}`, boxShadow: `0 2px 8px ${c.color}40` }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: C.muted, fontFamily: 'monospace' }}>{c.color}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
