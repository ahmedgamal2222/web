'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const C = {
  primary: '#281C59',
  teal: '#4E8D9C',
  green: '#85C79A',
  red: '#FF6B6B',
};

interface Episode {
  id: number;
  title: string;
  description?: string;
  audio_url?: string;
  cover_url?: string;
  duration?: number;
  episode_number: number;
  season: number;
  guest_name?: string;
  institution_name_ar?: string;
  plays: number;
  status: string;
  published_at?: string;
  created_at: string;
}

const emptyForm = {
  title: '',
  description: '',
  audio_url: '',
  cover_url: '',
  duration: '',
  episode_number: '',
  season: '1',
  guest_name: '',
  guest_bio: '',
  institution_id: '',
  tags: '',
  status: 'published' as 'published' | 'draft',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: C.primary }}>{label}</label>
      <div style={{ display: 'contents' }}>{children}</div>
    </div>
  );
}

const iStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.teal}40`,
  fontSize: '0.9rem', outline: 'none', color: C.primary, width: '100%', boxSizing: 'border-box',
};

function fmtDuration(secs?: number) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AdminPodcastPage() {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH = { 'X-Session-ID': sid };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') { router.push('/login?redirect=/admin/podcast'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [epRes, instRes] = await Promise.all([
        fetch(`${API_BASE}/api/podcast?limit=200`, { headers: authH }),
        fetch(`${API_BASE}/api/institutions?limit=200`, { headers: authH }),
      ]);
      const ed = await epRes.json();
      const id = await instRes.json();
      setEpisodes(ed.data || []);
      setInstitutions(id.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleAudioUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) { setErr('يرجى اختيار ملف صوتي'); return; }
    if (file.size > 200 * 1024 * 1024) { setErr('الملف أكبر من 200 ميجا'); return; }
    setUploading(true); setUploadProgress(0); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'audio');
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = e => e.lengthComputable && setUploadProgress(Math.round((e.loaded / e.total) * 100));
      await new Promise<void>((res, rej) => {
        xhr.onload = () => {
          try {
            const d = JSON.parse(xhr.responseText);
            if (d.url) { setForm(f => ({ ...f, audio_url: d.url })); res(); }
            else rej(new Error(d.message || 'فشل الرفع'));
          } catch { rej(new Error('استجابة غير صالحة')); }
        };
        xhr.onerror = () => rej(new Error('فشل الاتصال'));
        xhr.open('POST', `${API_BASE}/api/podcast/upload`);
        xhr.setRequestHeader('X-Session-ID', sid);
        xhr.send(fd);
      });
    } catch (ex: any) {
      setErr('فشل رفع الملف: ' + ex.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('العنوان مطلوب'); return; }
    setSubmitting(true); setErr('');
    try {
      const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await fetch(`${API_BASE}/api/podcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          audio_url: form.audio_url || undefined,
          cover_url: form.cover_url || undefined,
          duration: form.duration ? Number(form.duration) : undefined,
          episode_number: form.episode_number ? Number(form.episode_number) : undefined,
          season: Number(form.season) || 1,
          guest_name: form.guest_name || undefined,
          guest_bio: form.guest_bio || undefined,
          institution_id: form.institution_id ? Number(form.institution_id) : undefined,
          tags: tagsArr,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل الإنشاء');
      setShowCreate(false);
      setForm(emptyForm);
      setSuccess('✓ تم نشر الحلقة بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      loadAll();
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`حذف "${title}"؟`)) return;
    try {
      await fetch(`${API_BASE}/api/podcast/${id}`, { method: 'DELETE', headers: authH });
      setEpisodes(prev => prev.filter(ep => ep.id !== id));
      setSuccess('✓ تم الحذف');
      setTimeout(() => setSuccess(''), 2000);
    } catch { alert('فشل الحذف'); }
  };

  const handleStatusToggle = async (ep: Episode) => {
    const newStatus = ep.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`${API_BASE}/api/podcast/${ep.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({ status: newStatus }),
      });
      setEpisodes(prev => prev.map(e => e.id === ep.id ? { ...e, status: newStatus } : e));
      setSuccess(`✓ تم تغيير الحالة`);
      setTimeout(() => setSuccess(''), 2000);
    } catch { alert('فشلت العملية'); }
  };

  const filtered = episodes.filter(ep => {
    if (!search) return true;
    const q = search.toLowerCase();
    return ep.title.toLowerCase().includes(q) || (ep.guest_name || '').toLowerCase().includes(q);
  });

  const totalPlays = episodes.reduce((s, e) => s + e.plays, 0);
  const published = episodes.filter(e => e.status === 'published').length;

  return (
    <div className="admin-page" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>🎙️ إدارة البودكاست الحضاري</h1>
          <p style={{ opacity: 0.75, margin: '6px 0 0', fontSize: '0.9rem' }}>نشر وإدارة حلقات بودكاست المجرة الحضارية</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/podcast" target="_blank" style={{ padding: '10px 18px', borderRadius: 30, background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontSize: '0.88rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            🔗 فتح البودكاست
          </Link>
          <Link href="/admin" style={{ padding: '10px 20px', borderRadius: 30, background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            ← لوحة الأدمن
          </Link>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', borderRadius: 30, background: C.red, color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
            + نشر حلقة جديدة
          </button>
        </div>
      </div>

      {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#15803d', fontWeight: 600 }}>{success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الحلقات', val: episodes.length, color: C.red,   icon: '🎙️' },
          { label: 'منشورة',          val: published,          color: C.green, icon: '✅' },
          { label: 'مسودات',          val: episodes.length - published, color: '#9E9E9E', icon: '📝' },
          { label: 'إجمالي الاستماعات', val: totalPlays,      color: C.teal,  icon: '▶️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: `0 3px 12px ${C.primary}12`, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
            <div style={{ fontSize: '0.78rem', color: C.teal, marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ background: 'white', borderRadius: 14, padding: '14px 18px', marginBottom: 20, boxShadow: `0 3px 12px ${C.primary}08` }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 بحث بعنوان الحلقة أو اسم الضيف..."
          style={{ width: '100%', padding: '9px 14px', borderRadius: 30, border: `1.5px solid ${C.teal}40`, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Episodes */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /> جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 16, color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎙️</div>
          <div>لا توجد حلقات بعد</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {filtered.map(ep => (
            <div key={ep.id} style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: `0 4px 16px ${C.primary}12`, border: `1px solid ${C.red}20` }}>
              {ep.cover_url && (
                <div style={{ height: 130, background: `url(${ep.cover_url}) center/cover no-repeat` }} />
              )}
              {!ep.cover_url && (
                <div style={{ height: 80, background: `linear-gradient(135deg, ${C.primary}, #FF6B6B44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎙️</div>
              )}
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: C.teal, fontWeight: 700, marginBottom: 3 }}>
                      الموسم {ep.season} · الحلقة {ep.episode_number}
                    </div>
                    <h3 style={{ margin: 0, color: C.primary, fontSize: '0.95rem', fontWeight: 700 }}>{ep.title}</h3>
                  </div>
                  <button
                    onClick={() => handleStatusToggle(ep)}
                    style={{ padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      background: ep.status === 'published' ? '#dcfce7' : '#fee2e2',
                      color: ep.status === 'published' ? '#15803d' : '#b91c1c' }}
                  >
                    {ep.status === 'published' ? '✅ منشورة' : '📝 مسودة'}
                  </button>
                </div>
                {ep.guest_name && (
                  <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: 6 }}>👤 {ep.guest_name}</div>
                )}
                <div style={{ display: 'flex', gap: 12, fontSize: '0.82rem', color: '#888', marginBottom: 10 }}>
                  <span>▶️ {ep.plays} استماع</span>
                  {ep.duration && <span>⏱ {fmtDuration(ep.duration)}</span>}
                </div>
                {ep.audio_url && (
                  <audio controls style={{ width: '100%', height: 32, marginBottom: 10 }} src={ep.audio_url} />
                )}
                <button
                  onClick={() => handleDelete(ep.id, ep.title)}
                  style={{ width: '100%', padding: '7px 0', borderRadius: 20, border: 'none', background: '#ff505015', color: '#ff5050', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  🗑 حذف الحلقة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, direction: 'rtl', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '32px 36px', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 24px 80px ${C.primary}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: C.primary, margin: 0, fontSize: '1.3rem' }}>🎙️ نشر حلقة جديدة</h2>
              <button onClick={() => { setShowCreate(false); setErr(''); setForm(emptyForm); }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            {err && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: 16 }}>{err}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <Field label="عنوان الحلقة *">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="عنوان الحلقة..." style={iStyle} />
              </Field>

              <Field label="الوصف">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="ملخص الحلقة..." style={{ ...iStyle, resize: 'vertical' }} />
              </Field>

              {/* Audio upload */}
              <Field label="ملف الصوت (MP3 / M4A / OGG — حتى 200 ميجا)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.audio_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#15803d"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      <span style={{ fontSize: '0.82rem', color: '#15803d', flex: 1, wordBreak: 'break-all' }}>{form.audio_url.split('/').pop()}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, audio_url: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1rem' }}>✕</button>
                    </div>
                  )}
                  {uploading && (
                    <div style={{ background: `${C.teal}10`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.teal, marginBottom: 4 }}>
                        <span>جاري رفع الملف الصوتي...</span><span>{uploadProgress}%</span>
                      </div>
                      <div style={{ height: 4, background: `${C.teal}20`, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: C.teal, borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}
                  {!form.audio_url && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: `${C.red}08`, border: `1.5px dashed ${C.red}60`, borderRadius: 10, cursor: uploading ? 'default' : 'pointer', fontSize: '0.88rem', color: C.red }}>
                      <input type="file" accept="audio/*" style={{ display: 'none' }} disabled={uploading} onChange={e => e.target.files?.[0] && handleAudioUpload(e.target.files[0])} />
                      <span style={{ fontSize: '1.3rem' }}>🎵</span>
                      <span>{uploading ? 'جاري الرفع...' : 'اختر ملف صوتي من الجهاز'}</span>
                    </label>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: `${C.teal}20` }} />
                    <span style={{ fontSize: '0.78rem', color: '#999' }}>أو أدخل رابطاً مباشراً</span>
                    <div style={{ flex: 1, height: 1, background: `${C.teal}20` }} />
                  </div>
                  <input value={form.audio_url} onChange={e => setForm({ ...form, audio_url: e.target.value })} placeholder="https://... (رابط مباشر للملف الصوتي)" style={iStyle} />
                </div>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="رقم الموسم">
                  <input type="number" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} min="1" style={iStyle} />
                </Field>
                <Field label="رقم الحلقة (تلقائي)">
                  <input type="number" value={form.episode_number} onChange={e => setForm({ ...form, episode_number: e.target.value })} placeholder="تلقائي" min="1" style={iStyle} />
                </Field>
                <Field label="المدة (بالثواني)">
                  <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="مثال: 3600" min="1" style={iStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="اسم الضيف">
                  <input value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} placeholder="د. محمد عبدالله" style={iStyle} />
                </Field>
                <Field label="المؤسسة">
                  <select value={form.institution_id} onChange={e => setForm({ ...form, institution_id: e.target.value })} style={iStyle}>
                    <option value="">— عامة —</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="نبذة الضيف">
                <textarea value={form.guest_bio} onChange={e => setForm({ ...form, guest_bio: e.target.value })} rows={2} placeholder="نبذة مختصرة عن الضيف..." style={{ ...iStyle, resize: 'vertical' }} />
              </Field>

              <Field label="صورة الغلاف (رابط)">
                <input value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." style={iStyle} />
              </Field>

              <Field label="الوسوم (مفصولة بفاصلة)">
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="قيادة، إدارة، حضارة..." style={iStyle} />
              </Field>

              <Field label="الحالة">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'published' | 'draft' })} style={iStyle}>
                  <option value="published">✅ نشر فوري</option>
                  <option value="draft">📝 حفظ كمسودة</option>
                </select>
              </Field>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={submitting || uploading} style={{ flex: 1, padding: '12px', borderRadius: 12, background: submitting ? '#ccc' : `linear-gradient(135deg, ${C.red}, #FF9B4E)`, border: 'none', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: (submitting || uploading) ? 'default' : 'pointer' }}>
                  {submitting ? 'جاري النشر...' : '🎙️ نشر الحلقة'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setErr(''); setForm(emptyForm); }} style={{ padding: '12px 20px', borderRadius: 12, background: '#f3f4f6', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 600 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
