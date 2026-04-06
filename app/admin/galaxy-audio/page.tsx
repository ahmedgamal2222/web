'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface AudioTrack {
  id: number;
  title: string;
  file_url: string;
  file_key: string;
  file_size: number;
  is_active: number;
  sort_order: number;
  created_at: string;
}

export default function GalaxyAudioPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH: Record<string, string> = { 'X-Session-ID': sid };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/galaxy-audio');
      return;
    }
    loadTracks();
    return () => { previewRef.current?.pause(); };
  }, []);

  const loadTracks = async () => {
    setLoadingTracks(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/galaxy-audio`, { headers: authH });
      const d = await res.json();
      if (d.success) setTracks(d.data || []);
    } catch {}
    setLoadingTracks(false);
  };

  const handleUpload = async () => {
    if (!audioFile) { setErr('يرجى اختيار ملف صوتي'); return; }
    if (!newTitle.trim()) { setErr('يرجى كتابة عنوان للصوت'); return; }
    setUploading(true); setErr(''); setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('title', newTitle.trim());
      const res = await fetch(`${API_BASE}/api/admin/galaxy-audio/upload`, {
        method: 'POST',
        headers: { 'X-Session-ID': sid },
        body: formData,
      });
      const d = await res.json();
      if (d.success) {
        setSuccessMsg('تم رفع الصوت بنجاح!');
        setNewTitle(''); setAudioFile(null);
        loadTracks();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErr(d.error || 'فشل رفع الملف');
      }
    } catch {
      setErr('حدث خطأ أثناء الرفع');
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/admin/galaxy-audio/${id}/toggle`, {
        method: 'PUT', headers: authH,
      });
      loadTracks();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصوت؟')) return;
    try {
      await fetch(`${API_BASE}/api/admin/galaxy-audio/${id}`, {
        method: 'DELETE', headers: authH,
      });
      if (playingId === id) { previewRef.current?.pause(); setPlayingId(null); }
      loadTracks();
    } catch {}
  };

  const togglePreview = (track: AudioTrack) => {
    if (playingId === track.id) {
      previewRef.current?.pause();
      setPlayingId(null);
    } else {
      if (previewRef.current) previewRef.current.pause();
      const audio = new Audio(track.file_url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingId(null);
      previewRef.current = audio;
      setPlayingId(track.id);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const inputS: React.CSSProperties = {
    padding: '10px 14px', border: `1.5px solid ${COLORS.teal}40`, borderRadius: 10,
    fontSize: '0.9rem', outline: 'none', color: COLORS.darkNavy, background: 'white',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Tajawal', sans-serif", direction: 'rtl',
      background: `linear-gradient(135deg, ${COLORS.lightMint}30 0%, white 50%, ${COLORS.softGreen}15 100%)`,
    }}>
      {/* Top bar */}
      <div style={{
        background: 'white', borderBottom: `1px solid ${COLORS.teal}20`,
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: `0 2px 10px ${COLORS.darkNavy}08`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" style={{
            color: COLORS.teal, textDecoration: 'none', fontSize: '0.88rem',
            padding: '6px 14px', borderRadius: 10, background: `${COLORS.teal}10`,
            fontWeight: 600,
          }}>← لوحة التحكم</Link>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: COLORS.darkNavy, display: 'flex', alignItems: 'center', gap: 10 }}>
            🎵 إدارة صوت المجرة
          </h1>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
          borderRadius: 40, padding: '6px 18px', fontSize: '0.85rem', fontWeight: 700, color: 'white',
        }}>
          {tracks.filter(t => t.is_active).length} / {tracks.length} نشط
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Messages */}
        {err && <div style={{ background: '#fee2e2', border: '1px solid #ef444430', borderRadius: 12, padding: '10px 16px', marginBottom: 16, color: '#ef4444', fontSize: '0.88rem' }}>⚠️ {err}</div>}
        {successMsg && <div style={{ background: '#dcfce7', border: '1px solid #16a34a30', borderRadius: 12, padding: '10px 16px', marginBottom: 16, color: '#16a34a', fontSize: '0.88rem' }}>✅ {successMsg}</div>}

        {/* Upload Card */}
        <div style={{
          background: 'white', borderRadius: 20, padding: 28, marginBottom: 28,
          boxShadow: `0 4px 20px ${COLORS.darkNavy}10`,
          border: `2px dashed ${COLORS.teal}30`,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800, color: COLORS.teal, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⬆️ رفع صوت جديد
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: COLORS.teal, marginBottom: 6 }}>عنوان الصوت</label>
              <input
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="مثال: صوت الفضاء الهادئ..."
                style={{ ...inputS, width: '100%' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: COLORS.teal, marginBottom: 6 }}>ملف الصوت (mp3, wav, ogg, webm, flac)</label>
              <input
                type="file" accept="audio/*"
                onChange={e => { setAudioFile(e.target.files?.[0] || null); setErr(''); }}
                style={{ ...inputS, width: '100%', cursor: 'pointer' }}
              />
              {audioFile && (
                <div style={{ fontSize: '0.78rem', color: COLORS.teal, marginTop: 4 }}>
                  📁 {audioFile.name} ({formatSize(audioFile.size)})
                </div>
              )}
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                padding: '11px 28px', borderRadius: 40, border: 'none',
                cursor: uploading ? 'default' : 'pointer',
                background: uploading ? '#ccc' : `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
                color: 'white', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {uploading ? '⏳ جاري الرفع...' : '⬆️ رفع صوت جديد'}
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 12 }}>
            الحد الأقصى: 50 ميجابايت · الصيغ المدعومة: mp3, wav, ogg, webm, flac
          </div>
        </div>

        {/* Tracks Card */}
        <div style={{
          background: 'white', borderRadius: 20, padding: 28,
          boxShadow: `0 4px 20px ${COLORS.darkNavy}10`,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800, color: COLORS.darkNavy, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎶 الأصوات المرفوعة
          </h3>

          {loadingTracks ? (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.teal }}>⏳ جاري التحميل...</div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>🔇</div>
              <div style={{ fontSize: '0.95rem' }}>لا توجد أصوات بعد. ارفع أول صوت للمجرة!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tracks.map((track, i) => (
                <div key={track.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderRadius: 14,
                  border: `1.5px solid ${track.is_active ? COLORS.softGreen + '60' : COLORS.teal + '20'}`,
                  background: track.is_active ? `${COLORS.softGreen}08` : 'white',
                  transition: 'all 0.2s',
                }}>
                  {/* Number */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: track.is_active ? `${COLORS.softGreen}20` : `${COLORS.teal}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.88rem',
                    color: track.is_active ? COLORS.softGreen : COLORS.teal,
                  }}>
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: COLORS.darkNavy, fontSize: '0.92rem' }}>{track.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                      {formatSize(track.file_size)} · {new Date(track.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                    background: track.is_active ? `${COLORS.softGreen}18` : '#f3f4f6',
                    color: track.is_active ? COLORS.softGreen : '#9ca3af',
                  }}>
                    {track.is_active ? '🟢 مُفعّل' : '⚪ معطّل'}
                  </span>

                  {/* Preview */}
                  <button
                    onClick={() => togglePreview(track)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: `1px solid ${COLORS.teal}30`,
                      background: playingId === track.id ? `${COLORS.teal}18` : 'white',
                      cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    title={playingId === track.id ? 'إيقاف' : 'تشغيل'}
                  >
                    {playingId === track.id ? '⏸' : '▶️'}
                  </button>

                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggle(track.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      background: track.is_active ? '#fee2e220' : `${COLORS.softGreen}20`,
                      color: track.is_active ? '#ef4444' : COLORS.softGreen,
                      fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                    }}
                  >
                    {track.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(track.id)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: '1px solid #ef444430',
                      background: 'white', cursor: 'pointer', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    title="حذف"
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
