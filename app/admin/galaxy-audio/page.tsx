'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// @ts-ignore
import lamejs from 'lamejs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
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
  const [dragOver, setDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  /**
   * ضغط الملف الصوتي إلى ~10 كيلوبايت MP3
   * mono, 8kHz, 8kbps, أقصى 10 ثوانٍ (loop)
   */
  const compressAudio = async (file: File): Promise<File> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();

    // أقصى 10 ثوانٍ
    const maxDuration = Math.min(decoded.duration, 10);
    const targetSampleRate = 8000;
    const frameCount = Math.floor(maxDuration * targetSampleRate);

    // Resample إلى mono 8kHz
    const offlineCtx = new OfflineAudioContext(1, frameCount, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0, 0, maxDuration);
    const rendered = await offlineCtx.startRendering();

    // تحويل إلى MP3 باستخدام lamejs
    const samples = rendered.getChannelData(0);
    const sampleCount = samples.length;
    const int16 = new Int16Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const mp3enc = new lamejs.Mp3Encoder(1, targetSampleRate, 8); // mono, 8kHz, 8kbps
    const blockSize = 1152;
    const mp3Data: Uint8Array[] = [];
    for (let i = 0; i < int16.length; i += blockSize) {
      const chunk = int16.subarray(i, i + blockSize);
      const buf = mp3enc.encodeBuffer(chunk);
      if (buf.length > 0) mp3Data.push(new Uint8Array(buf));
    }
    const flush = mp3enc.flush();
    if (flush.length > 0) mp3Data.push(new Uint8Array(flush));

    const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
    return new File([blob], file.name.replace(/\.[^.]+$/, '.mp3'), { type: 'audio/mpeg' });
  };

  const handleUpload = async () => {
    if (!audioFile) { setErr('يرجى اختيار ملف صوتي'); return; }
    if (!newTitle.trim()) { setErr('يرجى كتابة عنوان للصوت'); return; }
    setUploading(true); setErr(''); setSuccessMsg('');
    try {
      // ضغط الملف الصوتي أولاً
      setCompressing(true);
      let fileToUpload: File;
      try {
        fileToUpload = await compressAudio(audioFile);
        setCompressedSize(fileToUpload.size);
      } catch (compErr) {
        console.error('Compression error:', compErr);
        setErr('فشل ضغط الملف الصوتي');
        setUploading(false); setCompressing(false);
        return;
      }
      setCompressing(false);

      const formData = new FormData();
      formData.append('audio', fileToUpload);
      formData.append('title', newTitle.trim());
      const res = await fetch(`${API_BASE}/api/admin/galaxy-audio/upload`, {
        method: 'POST',
        headers: { 'X-Session-ID': sid },
        body: formData,
      });
      const d = await res.json();
      if (d.success) {
        setSuccessMsg(`تم رفع الصوت بنجاح! (${formatSize(fileToUpload.size)} بعد الضغط)`);
        setNewTitle(''); setAudioFile(null); setCompressedSize(null);
        loadTracks();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErr(d.error || 'فشل رفع الملف');
      }
    } catch {
      setErr('حدث خطأ أثناء الرفع');
    } finally {
      setUploading(false); setCompressing(false);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) { setAudioFile(file); setErr(''); setCompressedSize(null); }
    else setErr('يرجى اختيار ملف صوتي فقط');
  };

  const activeCount = tracks.filter(t => t.is_active).length;

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Tajawal', sans-serif", direction: 'rtl', background: '#07091e', color: '#e2eaf2' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .ga-inp:focus { border-color: ${C.teal} !important; box-shadow: 0 0 0 3px ${C.teal}30 !important; }
        .ga-inp::placeholder { color: rgba(255,255,255,0.25); }
        select.ga-inp option { background: #0a102a; color: #e2eaf2; }
      `}</style>

      {/* Header */}
      <div style={{ background: 'rgba(7,9,30,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(78,141,156,0.18)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" style={{ color: C.teal, textDecoration: 'none', fontSize: 14 }}>← لوحة التحكم</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, background: `linear-gradient(90deg, ${C.lightMint}, ${C.softGreen})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎵 إدارة صوت المجرة
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ background: 'rgba(133,199,154,0.15)', border: '1px solid rgba(133,199,154,0.25)', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: C.softGreen }}>
              {activeCount} نشط
            </span>
            <span style={{ background: 'rgba(78,141,156,0.12)', border: '1px solid rgba(78,141,156,0.2)', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: C.teal }}>
              {tracks.length} إجمالي
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Messages */}
        {err && (
          <div style={{ background: 'rgba(255,50,50,0.12)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#ff6b6b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚠️</span> {err}
            <button onClick={() => setErr('')} style={{ marginRight: 'auto', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'rgba(133,199,154,0.12)', border: '1px solid rgba(133,199,154,0.3)', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: C.softGreen, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span> {successMsg}
          </div>
        )}

        {/* Upload Card */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            background: dragOver ? 'rgba(78,141,156,0.12)' : 'rgba(10,16,42,0.90)',
            border: `2px dashed ${dragOver ? C.teal : 'rgba(78,141,156,0.18)'}`,
            borderRadius: 20, padding: 28, marginBottom: 28,
            transition: 'all 0.3s',
          }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: C.lightMint, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⬆️ رفع صوت جديد
          </h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.teal, marginBottom: 6 }}>عنوان الصوت</label>
              <input
                className="ga-inp"
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="مثال: صوت الفضاء الهادئ..."
                style={{ width: '100%', padding: '11px 16px', border: '1px solid rgba(78,141,156,0.25)', borderRadius: 12, fontSize: 14, outline: 'none', color: '#e2eaf2', background: 'rgba(10,16,42,0.60)', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.teal, marginBottom: 6 }}>ملف الصوت (mp3, wav, ogg, webm, flac)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '11px 16px', border: '1px solid rgba(78,141,156,0.25)', borderRadius: 12, fontSize: 14, color: audioFile ? '#e2eaf2' : 'rgba(255,255,255,0.35)', background: 'rgba(10,16,42,0.60)', boxSizing: 'border-box', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}
              >
                {audioFile ? (
                  <>📁 {audioFile.name} <span style={{ fontSize: 12, color: C.teal, marginRight: 'auto' }}>({formatSize(audioFile.size)})</span></>
                ) : (
                  <>📂 اسحب ملف هنا أو انقر للاختيار</>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file" accept="audio/*"
                onChange={e => { setAudioFile(e.target.files?.[0] || null); setErr(''); setCompressedSize(null); }}
                style={{ display: 'none' }}
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                cursor: uploading ? 'default' : 'pointer',
                background: uploading ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`,
                color: 'white', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
                whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1,
                boxShadow: uploading ? 'none' : `0 4px 20px rgba(78,141,156,0.3)`,
                transition: 'all 0.2s',
              }}
            >
              {uploading ? (compressing ? '🔄 جاري الضغط...' : '⏳ جاري الرفع...') : '⬆️ رفع'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 14 }}>
            الصيغ المدعومة: mp3, wav, ogg, webm, flac · يتم ضغط الصوت تلقائياً إلى ~10 كيلوبايت (mono, 8kHz, 10 ثوانٍ loop)
          </div>
        </div>

        {/* Tracks Card */}
        <div style={{ background: 'rgba(10,16,42,0.90)', border: '1px solid rgba(78,141,156,0.18)', borderRadius: 20, padding: 28 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: C.lightMint, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎶 الأصوات المرفوعة
          </h3>

          {loadingTracks ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <div style={{ width: 40, height: 40, border: `3px solid rgba(78,141,156,0.2)`, borderTopColor: C.teal, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>جاري التحميل...</div>
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>🔇</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>لا توجد أصوات بعد</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>ارفع أول صوت للمجرة!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tracks.map((track, i) => {
                const isPlaying = playingId === track.id;
                const isActive = !!track.is_active;
                return (
                  <div key={track.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    borderRadius: 14,
                    border: `1px solid ${isActive ? 'rgba(133,199,154,0.2)' : 'rgba(78,141,156,0.1)'}`,
                    background: isPlaying
                      ? 'rgba(78,141,156,0.12)'
                      : isActive
                        ? 'rgba(133,199,154,0.05)'
                        : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.25s',
                  }}>
                    {/* Number bubble */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: isActive ? 'rgba(133,199,154,0.15)' : 'rgba(78,141,156,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14,
                      color: isActive ? C.softGreen : C.teal,
                    }}>
                      {i + 1}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                        {formatSize(track.file_size)} · {new Date(track.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: isActive ? 'rgba(133,199,154,0.12)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? C.softGreen : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${isActive ? 'rgba(133,199,154,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                      {isActive ? '● مُفعّل' : '○ معطّل'}
                    </span>

                    {/* Preview button */}
                    <button
                      onClick={() => togglePreview(track)}
                      style={{
                        width: 38, height: 38, borderRadius: 10,
                        border: `1px solid ${isPlaying ? C.teal : 'rgba(78,141,156,0.2)'}`,
                        background: isPlaying ? 'rgba(78,141,156,0.2)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', color: isPlaying ? C.lightMint : '#fff',
                        boxShadow: isPlaying ? `0 0 12px rgba(78,141,156,0.3)` : 'none',
                      }}
                      title={isPlaying ? 'إيقاف' : 'تشغيل'}
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>

                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggle(track.id)}
                      style={{
                        padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: isActive ? 'rgba(255,80,80,0.1)' : 'rgba(133,199,154,0.12)',
                        color: isActive ? '#ff6b6b' : C.softGreen,
                        fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isActive ? 'تعطيل' : 'تفعيل'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(track.id)}
                      style={{
                        width: 38, height: 38, borderRadius: 10,
                        border: '1px solid rgba(255,80,80,0.15)',
                        background: 'rgba(255,80,80,0.06)', cursor: 'pointer', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', color: '#ff6b6b',
                      }}
                      title="حذف"
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.06)'; }}
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
