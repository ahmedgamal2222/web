'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  gold: '#FFD700',
  coral: '#FF6B6B',
};

interface Episode {
  id: number;
  title: string;
  description?: string;
  audio_url?: string;
  video_url?: string;
  cover_url?: string;
  duration?: number;
  episode_number?: number;
  season: number;
  guest_name?: string;
  guest_bio?: string;
  institution_id?: number;
  institution_name_ar?: string;
  institution_name?: string;
  logo_url?: string;
  tags?: string;
  plays: number;
  published_at?: string;
  created_at: string;
}

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
      <svg width="42" height="42" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_p" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD" /><stop offset="42%" stopColor="#85C79A" /><stop offset="100%" stopColor="#4E8D9C" /></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
        <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_p)" />
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
      </svg>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, background: 'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize: '0.7rem', color: '#4E8D9C', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
}

function getVideoType(url: string): 'youtube' | 'vimeo' | 'direct' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'direct';
}

function getYouTubeId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/);
  return m?.[1] || '';
}

function getVimeoId(url: string): string {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] || '';
}

// ============================================================
// Audio Player (full-featured)
// ============================================================
function AudioPlayer({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnded = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    a.volume = volume;
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('ended', onEnded); };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause(); else a.play().catch(() => {});
    setPlaying(p => !p);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * duration;
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    const m = !muted;
    setMuted(m);
    a.muted = m;
  };

  const changeSpeed = () => {
    const a = audioRef.current;
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (a) a.playbackRate = next;
  };

  const skip = (sec: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + sec));
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'linear-gradient(145deg, #1a1240, #0f0a2e)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 28, maxWidth: 700, width: '100%', boxShadow: '0 -16px 80px rgba(255,107,107,0.1), 0 32px 100px rgba(0,0,0,0.75)', overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #FF6B6B, #C084FC, #4E8D9C)' }} />

        <div style={{ padding: '28px 32px 32px' }}>
          {/* Episode Info */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
            <div style={{ width: 90, height: 90, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,107,107,0.2)', boxShadow: playing ? '0 0 30px rgba(255,107,107,0.3)' : 'none', transition: 'box-shadow 0.3s' }}>
              {episode.cover_url ? <Image src={episode.cover_url} alt={episode.title} width={90} height={90} style={{ objectFit: 'cover' }} /> : <span style={{ fontSize: '2.5rem', opacity: 0.5 }}>🎙️</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ background: 'rgba(255,107,107,0.15)', color: COLORS.coral, padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                  {episode.episode_number ? `الحلقة ${episode.episode_number}` : 'بودكاست'}
                </span>
                {episode.duration && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>⏱ {formatDuration(episode.duration)}</span>}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', lineHeight: 1.3 }}>{episode.title}</h3>
              {episode.guest_name && <p style={{ fontSize: '0.85rem', color: '#4E8D9C', margin: 0, fontWeight: 600 }}>🎤 {episode.guest_name}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>▶ {episode.plays} استماع</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', color: '#94a3b8', alignSelf: 'flex-start', flexShrink: 0 }}>✕</button>
          </div>

          {/* Waveform / Progress */}
          <div style={{ marginBottom: 20 }}>
            <div
              onClick={seek}
              style={{ height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,107,107,0.15)' }}
            >
              {/* Fake waveform bars */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 2, padding: '0 12px', opacity: 0.5 }}>
                {[...Array(60)].map((_, i) => {
                  const h = 20 + Math.sin(i * 0.7) * 10 + Math.sin(i * 0.3) * 8 + Math.random() * 10;
                  return <div key={i} style={{ flex: 1, height: `${h}%`, background: i / 60 * 100 < pct ? '#FF6B6B' : 'rgba(255,255,255,0.25)', borderRadius: 2, transition: 'background 0.1s' }} />;
                })}
              </div>
              {/* Progress overlay */}
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, rgba(255,107,107,0.2), transparent)', borderRight: '2px solid #FF6B6B', transition: 'width 0.1s linear', pointerEvents: 'none' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.78rem', color: '#6b7280' }}>
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>{formatDuration(Math.floor(duration))}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
            {/* Speed */}
            <button onClick={changeSpeed} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: COLORS.coral, fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Cairo', sans-serif", minWidth: 52 }}>
              {speed}×
            </button>

            {/* Back 30s */}
            <button onClick={() => skip(-30)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>-30</button>

            {/* Play/Pause */}
            <button
              onClick={toggle}
              style={{ width: 68, height: 68, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.coral}, #e91e63)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: playing ? '0 0 30px rgba(255,107,107,0.6), 0 8px 24px rgba(255,107,107,0.4)' : '0 8px 24px rgba(255,107,107,0.3)', transition: 'all 0.2s', transform: playing ? 'scale(0.96)' : 'scale(1)' }}
            >
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>

            {/* Forward 30s */}
            <button onClick={() => skip(30)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>+30</button>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={toggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={e => changeVolume(Number(e.target.value))}
                style={{ width: 80, accentColor: COLORS.coral }} />
            </div>
          </div>
        </div>

        <audio ref={audioRef} src={episode.audio_url} preload="metadata" />
      </div>
    </div>
  );
}

// ============================================================
// Video Player (YouTube / Vimeo / direct video)
// ============================================================
function VideoPlayer({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const url = episode.video_url!;
  const type = getVideoType(url);

  let embedSrc = '';
  if (type === 'youtube') {
    embedSrc = `https://www.youtube.com/embed/${getYouTubeId(url)}?autoplay=1&rel=0`;
  } else if (type === 'vimeo') {
    embedSrc = `https://player.vimeo.com/video/${getVimeoId(url)}?autoplay=1`;
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div style={{ background: 'linear-gradient(145deg, #1a1240, #0f0a2e)', border: '1px solid rgba(192,132,252,0.25)', borderRadius: 24, maxWidth: 900, width: '100%', overflow: 'hidden', boxShadow: '0 24px 80px rgba(192,132,252,0.15), 0 0 120px rgba(0,0,0,0.8)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #C084FC, #FF6B6B, #4E8D9C)' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {episode.cover_url && (
            <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
              <Image src={episode.cover_url} alt={episode.title} width={52} height={52} style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ background: 'rgba(192,132,252,0.15)', color: '#C084FC', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>🎬 مرئي</span>
              {episode.episode_number && <span style={{ background: 'rgba(255,107,107,0.15)', color: COLORS.coral, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>الحلقة #{episode.episode_number}</span>}
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{episode.title}</h3>
            {episode.guest_name && <p style={{ margin: 0, fontSize: '0.82rem', color: COLORS.teal }}>🎤 {episode.guest_name}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}>✕</button>
        </div>

        {/* Video content */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
          {embedSrc ? (
            <iframe
              src={embedSrc}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={url}
              controls
              autoPlay
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
            />
          )}
        </div>

        {/* Description */}
        {episode.description && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>{episode.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EpisodeCard({ episode, onClick, onVideoClick }: { episode: Episode; onClick: () => void; onVideoClick?: () => void }) {
  const tags: string[] = (() => { try { return JSON.parse(episode.tags || '[]'); } catch { return []; } })();
  const hasAudio = !!episode.audio_url;
  const hasVideo = !!episode.video_url;

  return (
    <div
      onClick={hasAudio ? onClick : hasVideo ? onClick : undefined}
      style={{ background: 'linear-gradient(160deg, rgba(26,18,64,0.97), rgba(15,10,46,0.9))', border: `1px solid ${hasVideo && !hasAudio ? 'rgba(192,132,252,0.2)' : 'rgba(255,107,107,0.15)'}`, borderRadius: 20, overflow: 'hidden', cursor: hasAudio || hasVideo ? 'pointer' : 'default', transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { if (!hasAudio && !hasVideo) return; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(255,107,107,0.2), 0 4px 24px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = hasVideo && !hasAudio ? 'rgba(192,132,252,0.5)' : 'rgba(255,107,107,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = hasVideo && !hasAudio ? 'rgba(192,132,252,0.2)' : 'rgba(255,107,107,0.15)'; }}
    >
      {/* Cover */}
      <div style={{ position: 'relative', paddingBottom: '56%', background: 'rgba(255,255,255,0.03)' }}>
        {episode.cover_url ? (
          <Image src={episode.cover_url} alt={episode.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(192,132,252,0.1))' }}>
            <span style={{ fontSize: '3rem', opacity: 0.4 }}>🎙️</span>
          </div>
        )}
        {/* Ep number badge */}
        {episode.episode_number && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 10, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, color: COLORS.coral }}>
            #{episode.episode_number}
          </div>
        )}
        {/* Play overlay */}
        {(hasAudio || hasVideo) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'all 0.2s', opacity: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.style.opacity = '0'; }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,107,107,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasAudio && <span style={{ background: 'rgba(255,107,107,0.12)', color: COLORS.coral, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>🎵 صوتي</span>}
          {hasVideo && <span style={{ background: 'rgba(192,132,252,0.12)', color: '#C084FC', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>🎬 مرئي</span>}
          {episode.duration && <span style={{ fontSize: '0.72rem', color: '#4b5563' }}>⏱ {formatDuration(episode.duration)}</span>}
        </div>

        <h3 style={{ fontSize: '0.97rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.4 }}>{episode.title}</h3>

        {episode.description && (
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{episode.description}</p>
        )}

        {episode.guest_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(78,141,156,0.08)', borderRadius: 10, border: '1px solid rgba(78,141,156,0.15)' }}>
            <span style={{ fontSize: '0.85rem' }}>🎤</span>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>{episode.guest_name}</div>
              {episode.guest_bio && <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>{episode.guest_bio}</div>}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.slice(0, 3).map(tag => <span key={tag} style={{ background: 'rgba(133,199,154,0.08)', color: '#4b8060', padding: '2px 10px', borderRadius: 14, fontSize: '0.72rem' }}>#{tag}</span>)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#4b5563' }}>
          <span>{formatDate(episode.published_at || episode.created_at)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasAudio && hasVideo && onVideoClick && (
              <button
                onClick={e => { e.stopPropagation(); onVideoClick(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.3)', color: '#C084FC', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🎬 شاهد
              </button>
            )}
            <span>▶ {episode.plays}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);
  const [videoEpisode, setVideoEpisode] = useState<Episode | null>(null);
  const [latestEpisode, setLatestEpisode] = useState<Episode | null>(null);
  const limit = 12;

  useEffect(() => { fetchEpisodes(); }, [search, page]);

  const fetchEpisodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page), ...(search && { search }) });
      const res = await fetch(`${API_BASE}/api/podcast?${params}`);
      const data = await res.json();
      const eps: Episode[] = data.data || [];
      setEpisodes(eps);
      setTotal(data.total || 0);
      if (page === 1 && eps.length > 0 && !latestEpisode) setLatestEpisode(eps[0]);
    } catch { setEpisodes([]); }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / limit);
  const otherEpisodes = episodes.filter(e => !latestEpisode || e.id !== latestEpisode.id);

  return (
    <div style={{ minHeight: '100dvh', background: '#080520', color: '#fff', fontFamily: "'Cairo', sans-serif", direction: 'rtl' }}>
      {/* Stars */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(70)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'white', opacity: Math.random() * 0.4 + 0.05, width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite alternate` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 60% 10%, rgba(255,107,107,0.08) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 20% 70%, rgba(192,132,252,0.06) 0%, transparent 60%)' }} />
      </div>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(8,5,32,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(78,141,156,0.2)', boxShadow: '0 2px 32px rgba(0,0,0,0.5)' }}>
        <GalaxyLogo />
        <nav style={{ display: 'flex', gap: 6 }}>
          {[{ href: '/news', label: 'الأخبار' }, { href: '/services', label: 'الخدمات' }, { href: '/library', label: 'المكتبة' }, { href: '/forum', label: 'المنتدى' }, { href: '/podcast', label: 'البودكاست', active: true }].map(link => (
            <Link key={link.href} href={link.href} style={{ padding: '8px 16px', borderRadius: 24, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, color: (link as any).active ? '#fff' : '#9ca3af', background: (link as any).active ? 'linear-gradient(135deg, #FF6B6B, #e91e63)' : 'transparent', border: (link as any).active ? 'none' : '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}>{link.label}</Link>
          ))}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 40, padding: '8px 20px', marginBottom: 24 }}>
            <span style={{ fontSize: '1.2rem' }}>🎙️</span>
            <span style={{ fontSize: '0.85rem', color: COLORS.coral, fontWeight: 700, letterSpacing: '0.1em' }}>GALAXY PODCAST</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.08, margin: '0 0 16px', background: 'linear-gradient(135deg, #fff 0%, #FFD700 35%, #FF6B6B 70%, #C084FC 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            بودكاست المجرة الحضارية
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            حوارات عميقة وتجارب ملهمة من المؤسسات الحضارية — صوت المجرة الذي يحكي قصصها
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {[{ icon: '🎤', label: 'ضيوف متميزون' }, { icon: '🏛️', label: 'تجارب مؤسسية' }, { icon: '💡', label: 'أفكار حضارية' }].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' }}>
                <span>{f.icon}</span><span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Featured latest episode */}
        {latestEpisode && (
          <div
            onClick={() => { if (latestEpisode.audio_url) setPlayingEpisode(latestEpisode); else if (latestEpisode.video_url) setVideoEpisode(latestEpisode); }}
            style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.12), rgba(192,132,252,0.08), rgba(78,141,156,0.1))', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 28, padding: '36px 40px', marginBottom: 60, cursor: (latestEpisode.audio_url || latestEpisode.video_url) ? 'pointer' : 'default', transition: 'all 0.3s', boxShadow: '0 8px 40px rgba(255,107,107,0.1)', display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32, alignItems: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 60px rgba(255,107,107,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(255,107,107,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 160, height: 160, borderRadius: 24, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,107,107,0.2)', boxShadow: '0 8px 32px rgba(255,107,107,0.2)' }}>
              {latestEpisode.cover_url
                ? <Image src={latestEpisode.cover_url} alt={latestEpisode.title} width={160} height={160} style={{ objectFit: 'cover' }} />
                : <span style={{ fontSize: '4rem', opacity: 0.5 }}>🎙️</span>}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,215,0,0.15)', color: COLORS.gold, padding: '4px 16px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>✦ أحدث حلقة</span>
                {latestEpisode.episode_number && <span style={{ background: 'rgba(255,107,107,0.15)', color: COLORS.coral, padding: '4px 16px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>الحلقة #{latestEpisode.episode_number}</span>}
                {latestEpisode.duration && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>⏱ {formatDuration(latestEpisode.duration)}</span>}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>{latestEpisode.title}</h2>
              {latestEpisode.description && <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{latestEpisode.description}</p>}
              {latestEpisode.guest_name && <p style={{ fontSize: '0.88rem', color: COLORS.teal, margin: '0 0 16px', fontWeight: 700 }}>🎤 ضيف الحلقة: {latestEpisode.guest_name}</p>}
              {(latestEpisode.audio_url || latestEpisode.video_url) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #e91e63)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(255,107,107,0.5)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{latestEpisode.audio_url ? 'اضغط للاستماع' : 'اضغط للمشاهدة'}</span>
                  </div>
                  {latestEpisode.audio_url && latestEpisode.video_url && (
                    <button
                      onClick={e => { e.stopPropagation(); setVideoEpisode(latestEpisode); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 30, background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.35)', color: '#C084FC', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', fontFamily: "'Cairo', sans-serif" }}
                    >
                      🎬 مشاهدة الفيديو
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} style={{ maxWidth: 500, margin: '0 auto 48px', display: 'flex', gap: 10 }}>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="ابحث في الحلقات والضيوف..." style={{ flex: 1, padding: '13px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 40, color: '#fff', fontSize: '0.9rem', fontFamily: "'Cairo', sans-serif", outline: 'none' }} />
          <button type="submit" style={{ padding: '13px 22px', background: 'linear-gradient(135deg, #FF6B6B, #e91e63)', border: 'none', borderRadius: 40, cursor: 'pointer', color: '#fff', fontWeight: 800, fontFamily: "'Cairo', sans-serif", boxShadow: '0 4px 16px rgba(255,107,107,0.4)' }}>بحث</button>
        </form>

        {/* Episodes Grid */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            {search ? `نتائج البحث (${total})` : `جميع الحلقات${total > 0 ? ` (${total})` : ''}`}
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ height: 360, background: 'rgba(255,255,255,0.03)', borderRadius: 20, animation: 'pulse 2s infinite' }} />)}
          </div>
        ) : episodes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4b5563' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>🎙️</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>لا توجد حلقات بعد</p>
            <p style={{ fontSize: '0.9rem', marginTop: 8 }}>قريباً — أولى حلقات المجرة الحضارية</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {(otherEpisodes.length > 0 ? otherEpisodes : episodes).map(ep => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                onClick={() => { if (ep.audio_url) setPlayingEpisode(ep); else if (ep.video_url) setVideoEpisode(ep); }}
                onVideoClick={ep.video_url ? () => setVideoEpisode(ep) : undefined}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 48 }}>
            {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '10px 22px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 40, color: COLORS.coral, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>السابق</button>}
            <span style={{ padding: '10px 20px', color: '#6b7280', fontSize: '0.9rem' }}>صفحة {page} من {totalPages}</span>
            {page < totalPages && <button onClick={() => setPage(p => p + 1)} style={{ padding: '10px 22px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 40, color: COLORS.coral, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>التالي</button>}
          </div>
        )}
      </main>

      {playingEpisode && <AudioPlayer episode={playingEpisode} onClose={() => setPlayingEpisode(null)} />}
      {videoEpisode && <VideoPlayer episode={videoEpisode} onClose={() => setVideoEpisode(null)} />}

      <style>{`
        @keyframes twinkle { from { opacity: 0.1; transform: scale(1); } to { opacity: 0.6; transform: scale(1.2); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        input[type="range"] { cursor: pointer; }
        ::placeholder { color: rgba(156,163,175,0.5); }
      `}</style>
    </div>
  );
}
