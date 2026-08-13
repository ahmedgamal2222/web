'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminNavbarEditor from '@/components/AdminNavbarEditor';

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
  _key?: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  visible: boolean;
  _key?: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'navbar' | 'colors' | 'social' | 'general'>('navbar');

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

  const [navbarLinks, setNavbarLinks] = useState<NavbarLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NavbarLink>({ label: '', href: '', icon: '🔗', visible: true, _key: '' });
  const [newLink, setNewLink] = useState<NavbarLink>({ label: '', href: '', icon: '🔗', visible: true, _key: crypto.randomUUID() });
  const logoInputRef = useRef<HTMLInputElement>(null);

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
        try {
          setNavbarLinks(JSON.parse(data.settings.navbar_links || '[]').map((l: NavbarLink, i: number) => ({ ...l, _key: l._key || `nav-${i}-${Date.now()}` })));
        } catch { setNavbarLinks([]); }
        try {
          setSocialLinks(JSON.parse(data.settings.social_links || '[]').map((s: SocialLink, i: number) => ({ ...s, _key: s._key || `soc-${i}-${Date.now()}` })));
        } catch { setSocialLinks([]); }
      }
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'فشل تحميل الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const sid = localStorage.getItem('sessionId') || '';
      const res = await fetch(`${API_BASE}/api/upload/logo`, {
        method: 'POST',
        headers: { 'X-Session-ID': sid },
        body: formData,
      });
      const data = await res.json();
      if (!data.success && !data.url) throw new Error(data.error || 'فشل رفع الشعار');
      const url = data.url || data.data?.url || '';
      if (url) {
        updateField('logo_url', url);
        setMessage({ type: 'success', text: 'تم رفع الشعار بنجاح' });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'فشل رفع الشعار' });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const sid = localStorage.getItem('sessionId') || '';
      const body = {
        ...form,
        navbar_links: JSON.stringify(navbarLinks),
        social_links: JSON.stringify(socialLinks),
      };
      const res = await fetch(`${API_BASE}/api/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'فشل الحفظ');
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
      loadSettings();
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'فشل الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const addNavbarLink = () => {
    if (!newLink.label || !newLink.href) return;
    setNavbarLinks(prev => [...prev, { ...newLink }]);
    setNewLink({ label: '', href: '', icon: '🔗', visible: true, _key: crypto.randomUUID() });
  };

  const updateNavbarLink = (index: number, field: string, value: string | number | boolean) => {
    setNavbarLinks(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const removeNavbarLink = (index: number) => {
    setNavbarLinks(prev => prev.filter((_, i) => i !== index));
  };

  const moveNavbarLink = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= navbarLinks.length) return;
    setNavbarLinks(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const addSocialLink = () => {
    if (!newLink.label || !newLink.href) return;
    setSocialLinks(prev => [...prev, { ...newLink, platform: newLink.label.toLowerCase() }]);
    setNewLink({ label: '', href: '', icon: '🔗', visible: true, _key: crypto.randomUUID() });
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
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

  const visibleNavLinks = navbarLinks.filter(l => l.visible !== false);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ color: C.teal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>→ لوحة التحكم</Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>⚙️ إعدادات الموقع</h1>
        </div>

        {message && (
          <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24, background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? C.green : C.red}`, color: message.type === 'success' ? C.green : C.red, fontWeight: 600 }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Settings Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, background: C.card, padding: 6, borderRadius: 12, border: `1px solid ${C.border}` }}>
              {[
                { key: 'navbar' as const, label: '🔗 الناف بار', icon: '🔗' },
                { key: 'colors' as const, label: '🎨 الألوان', icon: '🎨' },
                { key: 'social' as const, label: '📱 السوشيال', icon: '📱' },
                { key: 'general' as const, label: '📝 عام', icon: '📝' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: activeTab === tab.key ? C.teal : 'transparent', color: activeTab === tab.key ? 'white' : C.muted, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Navbar Tab */}
            {activeTab === 'navbar' && (
              <AdminNavbarEditor onSaved={loadSettings} />
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>🎨 ألوان الموقع</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                  {[
                    { key: 'primary_color', label: 'اللون الأساسي', desc: 'الأزرار، الروابط، التحديدات' },
                    { key: 'secondary_color', label: 'اللون الثانوي', desc: 'العناوين، التدرجات' },
                    { key: 'background_color', label: 'لون الخلفية', desc: 'خلفية الصفحة' },
                    { key: 'text_color', label: 'لون النص', desc: 'النصوص والعناوين' },
                  ].map(color => (
                    <div key={color.key} style={{ padding: 16, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: C.teal, marginBottom: 4 }}>{color.label}</label>
                      <div style={{ fontSize: '0.75rem', color: C.muted, marginBottom: 10 }}>{color.desc}</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input type="color" value={form[color.key as keyof typeof form] as string} onChange={e => updateField(color.key, e.target.value)} style={{ width: 48, height: 48, borderRadius: 10, border: `1px solid ${C.border}`, cursor: 'pointer', background: 'transparent' }} />
                        <input value={form[color.key as keyof typeof form] as string} onChange={e => updateField(color.key, e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem', fontFamily: 'monospace', outline: 'none' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>📱 روابط التواصل الاجتماعي</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {socialLinks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: C.muted, fontSize: '0.9rem' }}>لا توجد روابط تواصل</div>
                  )}
                  {socialLinks.map((link, index) => (
                    <div key={link._key || index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: '1.2rem', width: 32, textAlign: 'center' }}>{link.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'capitalize' }}>{link.platform}</div>
                        <div style={{ fontSize: '0.75rem', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</div>
                      </div>
                      <button onClick={() => removeSocialLink(index)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.red}50`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}` }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>➕ إضافة رابط تواصل</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={newLink.icon} onChange={e => setNewLink({ ...newLink, icon: e.target.value })} placeholder="أيقونة" style={{ width: 60, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.85rem', textAlign: 'center' }} />
                      <input value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })} placeholder="المنصة (youtube, instagram...)" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.85rem' }} />
                    </div>
                    <input value={newLink.href} onChange={e => setNewLink({ ...newLink, href: e.target.value })} placeholder="رابط الحساب" style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.85rem' }} />
                    <button onClick={addSocialLink} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.teal}, #3a7a8a)`, color: 'white', fontWeight: 700, cursor: 'pointer' }}>➕ إضافة</button>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>📝 الإعدادات العامة</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>اسم الموقع</label>
                    <input value={form.site_name} onChange={e => updateField('site_name', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>وصف الموقع</label>
                    <input value={form.site_tagline} onChange={e => updateField('site_tagline', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الشعار</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.teal}50`, background: 'transparent', color: C.teal, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                        {uploadingLogo ? '⏳ جاري الرفع...' : '📁 رفع من الجهاز'}
                      </button>
                      {form.logo_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Image src={form.logo_url} alt="Logo" width={48} height={48} style={{ borderRadius: 8, objectFit: 'contain', border: `1px solid ${C.border}` }} unoptimized />
                          <button onClick={() => updateField('logo_url', '')} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.red}50`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: '0.8rem' }}>🗑️ حذف</button>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: '0.75rem', color: C.muted }}>أو أدخل رابط الشعار يدوياً:</label>
                      <input value={form.logo_url} onChange={e => updateField('logo_url', e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none', marginTop: 6 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>نص الفوتر</label>
                    <input value={form.footer_text} onChange={e => updateField('footer_text', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving} style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#0a0a1a', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,215,0,0.3)', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ جميع الإعدادات'}
            </button>
          </div>

          {/* Preview Panel */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Navbar Preview - Realistic */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: C.gold }}>👁 معاينة الناف بار</h3>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
                {/* Realistic navbar matching app/page.tsx */}
                <header style={{
                  position: 'relative',
                  top: 0, left: 0, right: 0,
                  zIndex: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 24px',
                  height: 68,
                  background: `linear-gradient(180deg, ${form.background_color || '#0a0a1a'} 0%, ${form.background_color || '#0a0a1a'} 65%, transparent 100%)`,
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  borderBottom: `1px solid ${form.secondary_color || C.teal}33`,
                  boxShadow: `0 2px 40px rgba(0,0,0,0.6), inset 0 -1px 0 ${form.primary_color || C.gold}15`,
                }}>
                  {/* Logo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {form.logo_url ? (
                      <Image src={form.logo_url} alt="Logo" width={40} height={40} style={{ borderRadius: 8, objectFit: 'contain' }} unoptimized />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, ${form.primary_color || C.gold}, ${form.secondary_color || C.teal})`, display: 'flex', alignItems: 'center', justifyContentContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>🌌</div>
                    )}
                    {form.site_name && (
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: form.primary_color || C.gold, whiteSpace: 'nowrap' }}>{form.site_name}</span>
                    )}
                  </div>

                  {/* Nav Links */}
                  <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {visibleNavLinks.length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: C.muted, padding: '4px 12px' }}>لا توجد روابط</span>
                    )}
                    {visibleNavLinks.map((link, i) => (
                      <div key={link._key || i} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px',
                        background: `${form.primary_color || C.gold}08`,
                        border: `1px solid ${form.primary_color || C.gold}25`,
                        borderRadius: 40,
                        color: `${form.primary_color || C.gold}cc`,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ fontSize: '0.8rem' }}>{link.icon}</span>
                        <span>{link.label}</span>
                      </div>
                    ))}
                  </nav>

                  {/* Right side - user area placeholder */}
                  <div style={{ width: 80, flexShrink: 0 }} />
                </header>
              </div>
            </div>

            {/* Footer Preview */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: C.gold }}>👣 معاينة الفوتر</h3>
              <div style={{ background: form.background_color || '#0a0a1a', borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  {form.footer_text || '© 2026 المجرة الحضارية'}
                </div>
              </div>
            </div>

            {/* Colors Preview */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: C.gold }}>🎨 معاينة الألوان</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'الخلفية', color: form.background_color },
                  { name: 'النص', color: form.text_color },
                  { name: 'أساسي', color: form.primary_color },
                  { name: 'ثانوي', color: form.secondary_color },
                ].map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: c.color, border: `1px solid ${C.border}`, boxShadow: `0 4px 12px ${c.color}40`, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>{c.color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
