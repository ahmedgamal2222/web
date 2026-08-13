'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchSiteSettings, API_BASE } from '@/lib/api';
import type { NavbarLink } from '@/components/RealNavbar';

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

interface AdminNavbarEditorProps {
  onSaved?: () => void;
}

export default function AdminNavbarEditor({ onSaved }: AdminNavbarEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [siteName, setSiteName] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [navbarBg, setNavbarBg] = useState('#0a0a1a');
  const [navbarAlign, setNavbarAlign] = useState<'left' | 'center' | 'right'>('center');
  const [links, setLinks] = useState<NavbarLink[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NavbarLink>({ label: '', url: '', visible: true, icon: '🔗' });
  const [newLink, setNewLink] = useState<NavbarLink>({ label: '', url: '', visible: true, icon: '🔗', id: crypto.randomUUID() });

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchSiteSettings();
      if (cancelled || !data) return;
      setSiteName(data.site_name || '');
      setSiteTagline(data.site_tagline || '');
      setLogoUrl(data.logo_url || '');
      setLogoType(data.logo_url ? 'image' : 'text');
      setNavbarBg(data.background_color || '#0a0a1a');
      setNavbarAlign((data as any).navbar_align || 'center');
      try {
        const parsed = JSON.parse(data.navbar_links || '[]').map((l: NavbarLink, i: number) => ({ ...l, id: l.id || `nav-${i}-${Date.now()}` }));
        setLinks(parsed);
      } catch {
        setLinks([]);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const sid = localStorage.getItem('sessionId') || '';
      const body: Record<string, unknown> = {
        site_name: siteName,
        site_tagline: siteTagline,
        background_color: navbarBg,
        navbar_align: navbarAlign,
        navbar_links: JSON.stringify(links.map(l => ({ id: l.id, label: l.label, url: l.url, visible: l.visible, icon: l.icon }))),
      };

      if (logoType === 'image' && logoUrl) {
        body.logo_url = logoUrl;
      }

      const res = await fetch(`${API_BASE}/api/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'فشل الحفظ');
      setMessage({ type: 'success', text: 'تم حفظ إعدادات الناف بار بنجاح' });
      onSaved?.();
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'فشل الحفظ' });
    } finally {
      setSaving(false);
    }
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
        setLogoUrl(url);
        setLogoType('image');
        setMessage({ type: 'success', text: 'تم رفع الشعار بنجاح' });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'فشل رفع الشعار' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const addLink = () => {
    if (!newLink.label || !newLink.url || !newLink.url.trim()) {
      setMessage({ type: 'error', text: 'يرجى إدخال اسم الرابط والرابط' });
      return;
    }
    setLinks(prev => [...prev, { ...newLink }]);
    setNewLink({ label: '', url: '', visible: true, icon: '🔗', id: crypto.randomUUID() });
    setMessage(null);
  };

  const updateLink = (index: number, field: string, value: string | number | boolean) => {
    setLinks(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;
    setLinks(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, borderRadius: 16, color: C.muted }}>
        جاري تحميل إعدادات الناف بار...
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: '24px 28px', border: `1px solid ${C.border}` }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800, color: C.gold }}>🔗 تحكم الناف بار والشعار</h2>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? C.green : C.red}`, color: message.type === 'success' ? C.green : C.red, fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      {/* Site Identity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>اسم الموقع</label>
          <input value={siteName} onChange={e => setSiteName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>وصف الموقع</label>
          <input value={siteTagline} onChange={e => setSiteTagline(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
        </div>
      </div>

      {/* Logo Control */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>الشعار</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setLogoType('text')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${logoType === 'text' ? C.teal : C.border}`, background: logoType === 'text' ? C.teal : 'transparent', color: logoType === 'text' ? 'white' : C.muted, cursor: 'pointer', fontWeight: 600 }}>📝 نص</button>
          <button onClick={() => setLogoType('image')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${logoType === 'image' ? C.teal : C.border}`, background: logoType === 'image' ? C.teal : 'transparent', color: logoType === 'image' ? 'white' : C.muted, cursor: 'pointer', fontWeight: 600 }}>🖼️ صورة</button>
        </div>
        {logoType === 'text' ? (
          <input value={siteName} onChange={e => { setSiteName(e.target.value); setLogoUrl(''); }} placeholder="نص الشعار" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} ref={logoInputRef} />
            <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.teal}50`, background: 'transparent', color: C.teal, cursor: 'pointer', fontWeight: 600 }}>
              {uploadingLogo ? '⏳ جاري الرفع...' : '📁 رفع من الجهاز'}
            </button>
            {logoUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', border: `1px solid ${C.border}` }} />
                <button onClick={() => setLogoUrl('')} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.red}50`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: '0.8rem' }}>🗑️ حذف</button>
              </div>
            )}
            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="أو أدخل رابط الصورة: https://..." style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.95rem', outline: 'none' }} />
          </div>
        )}
      </div>

      {/* Navbar Background */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>لون خلفية الناف بار</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="color" value={navbarBg} onChange={e => setNavbarBg(e.target.value)} style={{ width: 48, height: 48, borderRadius: 10, border: `1px solid ${C.border}`, cursor: 'pointer', background: 'transparent' }} />
          <input value={navbarBg} onChange={e => setNavbarBg(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '0.85rem', fontFamily: 'monospace', outline: 'none' }} />
        </div>
      </div>

      {/* Navbar Links Position */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.teal, marginBottom: 6 }}>تمركز روابط الناف بار</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['left', 'center', 'right'] as const).map(pos => (
            <button
              key={pos}
              onClick={() => setNavbarAlign(pos)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 10,
                border: `1px solid ${navbarAlign === pos ? C.teal : C.border}`,
                background: navbarAlign === pos ? C.teal : 'transparent',
                color: navbarAlign === pos ? 'white' : C.muted,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              {pos === 'left' ? 'يسار' : pos === 'center' ? 'وسط' : 'يمين'}
            </button>
          ))}
        </div>
      </div>

      {/* Links Management */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>🔗 عناصر الناف بار</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {links.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: '0.9rem' }}>لا توجد عناصر في الناف بار</div>
          )}
          {links.map((link, index) => (
            <div key={link.id || index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => moveLink(index, 'up')} disabled={index === 0} style={{ background: 'transparent', border: 'none', color: index === 0 ? C.border : C.teal, cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem', padding: 2 }}>▲</button>
                <button onClick={() => moveLink(index, 'down')} disabled={index === links.length - 1} style={{ background: 'transparent', border: 'none', color: index === links.length - 1 ? C.border : C.teal, cursor: index === links.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem', padding: 2 }}>▼</button>
              </div>
              <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center' }}>{link.icon || '🔗'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</div>
                <div style={{ fontSize: '0.75rem', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</div>
              </div>
              {link.visible === false && <span style={{ fontSize: '0.7rem', color: C.red, background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4 }}>مخفي</span>}
              <button onClick={() => { setEditingIndex(index); setEditForm(link); }} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.teal}50`, background: 'transparent', color: C.teal, cursor: 'pointer', fontSize: '0.8rem' }}>✏️</button>
              <button onClick={() => removeLink(index)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.red}50`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
            </div>
          ))}
        </div>

        {/* Add New */}
        <div style={{ padding: '16px', background: C.card, borderRadius: 10, border: `1px dashed ${C.border}` }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700 }}>➕ إضافة رابط جديد</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={newLink.icon} onChange={e => setNewLink({ ...newLink, icon: e.target.value })} placeholder="أيقونة" style={{ width: 60, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem', textAlign: 'center' }} />
              <input value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })} placeholder="اسم الرابط" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem' }} />
            </div>
            <input value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} placeholder="الرابط (مثال: /events أو https://...)" style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.85rem' }} />
            <button onClick={addLink} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.teal}, #3a7a8a)`, color: 'white', fontWeight: 700, cursor: 'pointer' }}>➕ إضافة للناف بار</button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving} style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#0a0a1a', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,215,0,0.3)', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'جاري الحفظ...' : '💾 حفظ جميع الإعدادات'}
      </button>

      {/* Edit Modal */}
      {editingIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditingIndex(null)}>
          <div style={{ background: C.card, borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', color: C.gold, fontSize: '1.1rem', fontWeight: 800 }}>✏️ تعديل الرابط</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={editForm.icon || ''} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} placeholder="أيقونة" style={{ width: 60, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem', textAlign: 'center' }} />
                <input value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} placeholder="اسم الرابط" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem' }} />
              </div>
              <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} placeholder="الرابط" style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { updateLink(editingIndex, 'visible', !editForm.visible); setEditingIndex(null); }} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${editForm.visible ? C.green : C.red}50`, background: 'transparent', color: editForm.visible ? C.green : C.red, cursor: 'pointer', fontWeight: 600 }}>
                  {editForm.visible ? '✓ مرئي' : '✗ مخفي'}
                </button>
                <button onClick={() => setEditingIndex(null)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' }}>إلغاء</button>
                <button onClick={() => { 
                  if (!editForm.url || !editForm.url.trim()) {
                    setMessage({ type: 'error', text: 'يرجى إدخال رابط صالح' });
                    return;
                  }
                  updateLink(editingIndex, 'label', editForm.label); 
                  updateLink(editingIndex, 'url', editForm.url); 
                  updateLink(editingIndex, 'icon', editForm.icon); 
                  setEditingIndex(null); 
                  setMessage(null);
                }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: C.teal, color: 'white', fontWeight: 700, cursor: 'pointer' }}>💾 حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
