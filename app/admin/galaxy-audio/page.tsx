'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    return () => previewRef.current?.pause();
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

  // ✅ ضغط الصوت بدون أي مكتبات
  const compressAudio = async (file: File): Promise<File> => {
    if (typeof window === 'undefined') return file;

    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();

    const duration = Math.min(decoded.duration, 10);
    const sampleRate = 8000;
    const frameCount = Math.floor(duration * sampleRate);

    const offlineCtx = new OfflineAudioContext(1, frameCount, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0, 0, duration);

    const rendered = await offlineCtx.startRendering();
    const samples = rendered.getChannelData(0);

    const wavBuffer = encodeWAV(samples, sampleRate);

    return new File([wavBuffer], file.name.replace(/\.[^.]+$/, '.wav'), {
      type: 'audio/wav',
    });
  };

  const encodeWAV = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s * 0x7fff, true);
      offset += 2;
    }

    return buffer;
  };

  const handleUpload = async () => {
    if (!audioFile) { setErr('يرجى اختيار ملف صوتي'); return; }
    if (!newTitle.trim()) { setErr('يرجى كتابة عنوان'); return; }

    setUploading(true); setErr(''); setSuccessMsg('');

    try {
      setCompressing(true);
      const fileToUpload = await compressAudio(audioFile);
      setCompressedSize(fileToUpload.size);
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
        setSuccessMsg(`تم الرفع (${formatSize(fileToUpload.size)})`);
        setNewTitle('');
        setAudioFile(null);
        loadTracks();
      } else {
        setErr(d.error || 'فشل الرفع');
      }
    } catch {
      setErr('خطأ أثناء الضغط أو الرفع');
    } finally {
      setUploading(false);
      setCompressing(false);
    }
  };

  const togglePreview = (track: AudioTrack) => {
    if (playingId === track.id) {
      previewRef.current?.pause();
      setPlayingId(null);
    } else {
      previewRef.current?.pause();
      const audio = new Audio(track.file_url);
      audio.play().catch(() => {});
      previewRef.current = audio;
      setPlayingId(track.id);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('تأكيد الحذف؟')) return;
    await fetch(`${API_BASE}/api/admin/galaxy-audio/${id}`, {
      method: 'DELETE',
      headers: authH,
    });
    loadTracks();
  };

  const formatSize = (b: number) =>
    b < 1024 ? `${b}B` : `${(b / 1024).toFixed(1)}KB`;

  return (
    <div style={{ minHeight: '100vh', background: '#07091e', color: '#fff', direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid #333' }}>
        <Link href="/admin">← رجوع</Link>
        <h2>🎵 إدارة صوت المجرة</h2>
      </div>

      <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>

        {/* Upload */}
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="عنوان الصوت"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          />

          <button onClick={handleUpload}>
            {uploading ? (compressing ? 'جاري الضغط...' : 'جاري الرفع...') : 'رفع'}
          </button>
        </div>

        {/* Messages */}
        {err && <div style={{ color: 'red' }}>{err}</div>}
        {successMsg && <div style={{ color: 'green' }}>{successMsg}</div>}

        {/* List */}
        {tracks.map(t => (
          <div key={t.id} style={{ marginBottom: 10 }}>
            {t.title}
            <button onClick={() => togglePreview(t)}>▶</button>
            <button onClick={() => handleDelete(t.id)}>🗑</button>
          </div>
        ))}

      </div>
    </div>
  );
}