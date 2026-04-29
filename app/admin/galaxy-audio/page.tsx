'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createFFmpeg } from '@ffmpeg/ffmpeg';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

// ✅ تحميل ffmpeg مرة واحدة
const ffmpeg = createFFmpeg({ log: false });

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

  // ✅ 🔥 ضغط الصوت باستخدام ffmpeg (بديل lamejs)
  const toUint8Array = async (file: File): Promise<Uint8Array> => {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
};

const compressAudio = async (file: File): Promise<File> => {
  // مهم جداً عشان Next.js build
  if (typeof window === 'undefined') return file;

  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const inputName = 'input';
  const outputName = 'output.mp3';

  // ✅ بديل fetchFile
  const data = await toUint8Array(file);

  ffmpeg.FS('writeFile', inputName, data);

  await ffmpeg.run(
    '-i', inputName,
    '-t', '10',
    '-ac', '1',
    '-ar', '8000',
    '-b:a', '8k',
    outputName
  );

  const output = ffmpeg.FS('readFile', outputName);

  return new File([output.buffer], file.name.replace(/\.[^.]+$/, '.mp3'), {
    type: 'audio/mpeg',
  });
};
  const handleUpload = async () => {
    if (!audioFile) { setErr('يرجى اختيار ملف صوتي'); return; }
    if (!newTitle.trim()) { setErr('يرجى كتابة عنوان للصوت'); return; }

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
        setSuccessMsg(`تم رفع الصوت بنجاح (${formatSize(fileToUpload.size)})`);
        setNewTitle('');
        setAudioFile(null);
        setCompressedSize(null);
        loadTracks();
      } else {
        setErr(d.error || 'فشل رفع الملف');
      }
    } catch (e) {
      console.error(e);
      setErr('حدث خطأ أثناء الضغط أو الرفع');
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
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingId(null);
      previewRef.current = audio;
      setPlayingId(track.id);
    }
  };

  const handleToggle = async (id: number) => {
    await fetch(`${API_BASE}/api/admin/galaxy-audio/${id}/toggle`, {
      method: 'PUT', headers: authH,
    });
    loadTracks();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد؟')) return;
    await fetch(`${API_BASE}/api/admin/galaxy-audio/${id}`, {
      method: 'DELETE', headers: authH,
    });
    loadTracks();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('audio/')) {
      setAudioFile(file);
      setCompressedSize(null);
    } else {
      setErr('ملف غير صالح');
    }
  };

  const activeCount = tracks.filter(t => t.is_active).length;

  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', background: '#07091e', color: '#fff' }}>
      <div style={{ padding: 20 }}>
        <h2>🎵 إدارة صوت المجرة</h2>

        {err && <div style={{ color: 'red' }}>{err}</div>}
        {successMsg && <div style={{ color: 'green' }}>{successMsg}</div>}

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

        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? (compressing ? 'جاري الضغط...' : 'جاري الرفع...') : 'رفع'}
        </button>

        <hr />

        {tracks.map(track => (
          <div key={track.id}>
            {track.title}
            <button onClick={() => togglePreview(track)}>▶</button>
            <button onClick={() => handleToggle(track.id)}>تفعيل</button>
            <button onClick={() => handleDelete(track.id)}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}