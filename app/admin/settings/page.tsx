'use client';

import { useEffect, useState, useRef } from 'react';
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
  _key?: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  visible: boolean;
  _key?: string;
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
        try {
          setNavbarLinks(JSON.parse(data.settings.navbar_links || '[]').map((l: any, i: number) => ({ ...l, _key: l._key || `nav-${i}-${Date.now()}` })));
        } catch { setNavbarLinks([]); }
        try {
          setSocialLinks(JSON.parse(data.settings.social_links || '[]').map((s: any, i: number) => ({ ...s, _key: s._key || `soc-${i}-${Date.now()}` })));
        } catch { setSocialLinks([]); }
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'فشل تحميل الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'فشل الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const addNavbarLink = () => {
    if (!newLink.label || !newLink.href) return;
    setNavbarLinks(prev => [...prev, { ...newLink }]);
    setNewLink({ label: '', href: '', icon: '🔗', visible: true, _key: crypto.randomUUID() });
  };

  const updateNavbarLink = (index: number, field: string, value: any) => {
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

  const updateSocialLink = (index: number, field: string, value: any) => {
    setSocialLinks(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
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
                { key: 'navbar', label: '🔗 الناف بار', icon: '🔗' },
                { key: 'colors', label: '🎨 الألوان', icon: '🎨' },
                { key: 'social', label: '📱 السوشيال', icon: '📱' },
                { key: 'general', label: '📝 عام', icon: '📝' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: activeTab === tab.key ? C.teal : 'transparent', color: activeTab === tab.key ? 'white' : C.muted, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Navbar Tab */}
            {activeTab === 'navbar' && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>🔗 عناصر الناف بار</h2>
                <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: C.muted }}>اسحب العناصر لإعادة ترتيبها، أو انقر لتعديلها</p>

                {/* Current Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {navbarLinks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: C.muted, fontSize: '0.9rem' }}>لا توجد عناصر في الناف بار</div>
                  )}
                  {navbarLinks.map((link, index) => (
                    <div key={link._key || index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button onClick={() => moveNavbarLink(index, 'up')} disabled={index === 0} style={{ background: 'transparent', border: 'none', color: index === 0 ? C.border : C.teal, cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem', padding: 2 }}>▲</button>
                        <button onClick={() => moveNavbarLink(index, 'down')} disabled={index === navbarLinks.length - 1} style={{ background: 'transparent', border: 'none', color: index === navbarLinks.length - 1 ? C.border : C.teal, cursor: index === navbarLinks.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem', padding: 2 }}>▼</button>
                      </div>
                      <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</div>
                        <div style={{ fontSize: '0.75rem', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.href}</div>
                      </div>
                      <button onClick={() => { setEditingIndex(index); setEditForm(link); }} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.teal}50`, background: 'transparent', color: C.teal, cursor: 'pointer', fontSize: '0.8rem' }}>✏️</button>
                      <button onClick={() => removeNavbarLink(index)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.red}50`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                    </div>
                  ))}
                </div>

                {/* Add New */}
                <div style={{ padding: '16px', background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}` }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>➕ إضافة رابط جديد</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={newLink.icon} onChange={e => setNewLink({ ...newLink, icon: e.target.value })} placeholder="أيقونة" style={{ width: 60, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.85rem', textAlign: 'center' }} />
                      <input value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })} placeholder="اسم الرابط" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.85rem' }} />
                    </div>
                    <input value={newLink.href} onChange={e => setNewLink({ ...newLink, href: e.target.value })} placeholder="الرابط (مثال: /events)" style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.85rem' }} />
                    <button onClick={addNavbarLink} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.teal}, #3a7a8a)`, color: 'white', fontWeight: 700, cursor: 'pointer' }}>➕ إضافة للناف بار</button>
                  </div>
                </div>

                {/* Edit Modal */}
                {editingIndex !== null && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditingIndex(null)}>
                    <div style={{ background: C.card, borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                      <h3 style={{ margin: '0 0 20px', color: C.gold, fontSize: '1.1rem', fontWeight: 800 }}>✏️ تعديل الرابط</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} placeholder="أيقونة" style={{ width: 60, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem', textAlign: 'center' }} />
                          <input value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} placeholder="اسم الرابط" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem' }} />
                        </div>
                        <input value={editForm.href} onChange={e => setEditForm({ ...editForm, href: e.target.value })} placeholder="الرابط" style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem' }} />
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => { updateNavbarLink(editingIndex, 'visible', !editForm.visible); setEditingIndex(null); }} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${editForm.visible ? C.green : C.red}50`, background: 'transparent', color: editForm.visible ? C.green : C.red, cursor: 'pointer', fontWeight: 600 }}>
                            {editForm.visible ? '✓ مرئي' : '✗ مخفي'}
                          </button>
                          <button onClick={() => setEditingIndex(null)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' }}>إلغاء</button>
                          <button onClick={() => { updateNavbarLink(editingIndex, 'label', editForm.label); updateNavbarLink(editingIndex, 'href', editForm.href); updateNavbarLink(editingIndex, 'icon', editForm.icon); setEditingIndex(null); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: C.teal, color: 'white', fontWeight: 700, cursor: 'pointer' }}>💾 حفظ</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>رابط الشعار</label>
                    <input value={form.logo_url} onChange={e => updateField('logo_url', e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
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
            {/* Navbar Preview */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: C.gold }}>👁 معاينة الناف بار</h3>
              <div style={{ background: form.background_color || '#0a0a1a', borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
                {/* Logo */}
                {form.logo_url && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img src={form.logo_url} alt="Logo" style={{ maxWidth: 60, maxHeight: 60, borderRadius: 8, objectFit: 'contain' }} />
                  </div>
                )}
                {/* Site Name */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: form.primary_color || C.gold }}>{form.site_name || 'اسم الموقع'}</div>
                  <div style={{ fontSize: '0.8rem', color: form.secondary_color || C.teal, marginTop: 4 }}>{form.site_tagline || 'وصف الموقع'}</div>
                </div>
                {/* Navbar */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', padding: '12px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                  {navbarLinks.filter(l => l.visible !== false).map((link, i) => (
                    <div key={link._key || i} style={{ padding: '6px 14px', borderRadius: 20, background: `${form.primary_color || C.gold}15`, color: form.primary_color || C.gold, fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {link.icon} {link.label}
                    </div>
                  ))}
                </div>
                {/* Social */}
                {socialLinks.filter(s => s.visible !== false).length > 0 && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                    {socialLinks.filter(s => s.visible !== false).map((social, i) => (
                      <div key={social._key || i} style={{ width: 32, height: 32, borderRadius: '50%', background: `${form.primary_color || C.gold}20`, color: form.primary_color || C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                        {social.icon}
                      </div>
                    ))}
                  </div>
                )}
                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: '0.75rem', color: C.muted }}>
                  {form.footer_text}
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
