'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPulse, updatePulse, deletePulse } from '@/lib/api';

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

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  announcement:   { label: 'إعلان',       icon: '📢', color: '#3b82f6' },
  achievement:    { label: 'إنجاز',       icon: '🏆', color: '#f59e0b' },
  event:          { label: 'فعالية',      icon: '📅', color: '#8b5cf6' },
  general:        { label: 'عام',         icon: '📰', color: '#6b7280' },
  tweet:          { label: 'تغريدة',      icon: '🐦', color: '#06b6d4' },
  institution_join: { label: 'انضمام مؤسسة', icon: '🏛️', color: '#10b981' },
};

export default function AdminPulsePage() {
  const router = useRouter();
  const [pulses, setPulses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ content: '', url: '', image_url: '', is_visible: true, is_featured: false, category: 'general' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login?redirect=/admin/pulse'); return; }
    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') { router.push('/'); return; }
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    const result = await fetchPulse({ limit: 100 });
    setPulses(result.data);
    setLoading(false);
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({
      content: p.content,
      url: p.url || '',
      image_url: p.image_url || '',
      is_visible: !!p.is_visible,
      is_featured: !!p.is_featured,
      category: p.category || 'general',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const ok = await updatePulse(editingId, editForm);
    if (ok) { setEditingId(null); load(); }
    else { alert('فشل التحديث'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذه النبضة نهائياً؟')) return;
    const ok = await deletePulse(id);
    if (ok) load();
    else alert('فشل الحذف');
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/admin" style={{ color: C.teal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>→ لوحة التحكم</Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>💫 إدارة نبض المجرة</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>جاري التحميل...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pulses.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
                لا توجد نبضات حالياً
              </div>
            )}
            {pulses.map((p) => {
              const cat = CATEGORY_META[p.category] || CATEGORY_META.general;
              const isEditing = editingId === p.id;
              return (
                <div key={p.id} style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                    <span style={{
                      background: `${cat.color}20`,
                      color: cat.color,
                      padding: '3px 12px',
                      borderRadius: 20,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}>{cat.label}</span>
                    {p.is_featured && (
                      <span style={{ background: 'rgba(255,215,0,0.15)', color: C.gold, padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                        ⭐ مميز
                      </span>
                    )}
                    <span style={{ marginRight: 'auto', color: C.muted, fontSize: '0.8rem' }}>
                      {new Date(p.pulse_date).toLocaleString('ar-EG')}
                    </span>
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <textarea
                        value={editForm.content}
                        onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                        rows={3}
                        style={{ padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input
                          value={editForm.url}
                          onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                          placeholder="الرابط (اختياري)"
                          style={{ padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem', outline: 'none' }}
                        />
                        <input
                          value={editForm.image_url}
                          onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                          placeholder="رابط الصورة (اختياري)"
                          style={{ padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                          <input type="checkbox" checked={editForm.is_visible} onChange={e => setEditForm({ ...editForm, is_visible: e.target.checked })} />
                          مرئي
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                          <input type="checkbox" checked={editForm.is_featured} onChange={e => setEditForm({ ...editForm, is_featured: e.target.checked })} />
                          مميز
                        </label>
                        <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={{ padding: 8, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '0.9rem' }}>
                          {Object.entries(CATEGORY_META).map(([key, val]) => (
                            <option key={key} value={key}>{val.icon} {val.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={saveEdit} disabled={saving} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.teal}, #3a7a8a)`, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                          {saving ? 'جاري الحفظ...' : '💾 حفظ'}
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' }}>
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                      {p.content}
                    </div>
                  )}

                  {!isEditing && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button onClick={() => startEdit(p)} style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.teal}50`, background: 'transparent', color: C.teal, fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                        ✏️ تعديل
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.red}50`, background: 'transparent', color: C.red, fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                        🗑️ حذف
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
