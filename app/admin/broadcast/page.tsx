'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { controlLectureStream, getCfUploadUrl } from '@/lib/api';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  live: '#ff4444',
};

type Status = 'idle' | 'requesting' | 'ready' | 'connecting' | 'live' | 'error';

function BroadcastContent() {
  const params = useSearchParams();
  const whipUrl = params.get('whip') || '';
  const iframeUrl = params.get('iframe') || '';
  const title = decodeURIComponent(params.get('title') || 'بث مباشر');
  const lectureId = params.get('id') || '';

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [duration, setDuration] = useState(0);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Load available devices
  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vd = devices.filter(d => d.kind === 'videoinput');
      const ad = devices.filter(d => d.kind === 'audioinput');
      setVideoDevices(vd);
      setAudioDevices(ad);
      if (!selectedVideo && vd[0]) setSelectedVideo(vd[0].deviceId);
      if (!selectedAudio && ad[0]) setSelectedAudio(ad[0].deviceId);
    } catch (_) {}
  }, [selectedVideo, selectedAudio]);

  // Open camera preview
  const openCamera = useCallback(async () => {
    setStatus('requesting');
    setErrorMsg('');
    try {
      // Release previous stream
      localStreamRef.current?.getTracks().forEach(t => t.stop());

      const constraints: MediaStreamConstraints = {
        video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
        audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await loadDevices(); // refresh with labels after permission
      setStatus('ready');
    } catch (err: any) {
      setErrorMsg(err.name === 'NotAllowedError'
        ? 'تم رفض إذن الكاميرا. يرجى السماح للمتصفح بالوصول إلى الكاميرا والميكروفون.'
        : `فشل فتح الكاميرا: ${err.message}`);
      setStatus('error');
    }
  }, [selectedVideo, selectedAudio, loadDevices]);

  useEffect(() => {
    loadDevices();
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start WebRTC WHIP broadcast
  const startBroadcast = useCallback(async () => {
    if (!localStreamRef.current) return;
    if (!whipUrl) {
      setErrorMsg('لا يوجد رابط WHIP — يرجى بدء البث من صفحة إدارة المحاضرات أولاً.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMsg('');

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
        bundlePolicy: 'max-bundle',
      });
      pcRef.current = pc;

      // Add all tracks from the local stream
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete (max 4s)
      await new Promise<void>(resolve => {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        const check = () => { if (pc.iceGatheringState === 'complete') resolve(); };
        pc.addEventListener('icegatheringstatechange', check);
        setTimeout(resolve, 4000);
      });

      // WHIP: POST SDP offer to Cloudflare
      const res = await fetch(whipUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription!.sdp,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`WHIP ${res.status}: ${txt}`);
      }

      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setStatus('live');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

      // بدء التسجيل المحلي عبر MediaRecorder
      if (localStreamRef.current && typeof MediaRecorder !== 'undefined') {
        recordedChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : '';
        const mr = new MediaRecorder(localStreamRef.current, mimeType ? { mimeType } : {});
        mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
        mr.start(5000); // chunk كل 5 ثواني
        mediaRecorderRef.current = mr;
      }

      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setStatus('error');
          setErrorMsg('انقطع اتصال WebRTC. يرجى المحاولة مرة أخرى.');
          if (timerRef.current) clearInterval(timerRef.current);
        }
      });
    } catch (err: any) {
      setErrorMsg(`فشل بدء البث: ${err.message}`);
      setStatus('ready');
    }
  }, [whipUrl]);

  // Stop broadcast
  const stopBroadcast = useCallback(async () => {
    // إيقاف MediaRecorder ورفع التسجيل
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
      mr.onstop = async () => {
        if (recordedChunksRef.current.length > 0 && lectureId) {
          const blob = new Blob(recordedChunksRef.current, { type: mr.mimeType || 'video/webm' });
          recordedChunksRef.current = [];
          await uploadRecording(blob, Number(lectureId));
        }
      };
    }
    mediaRecorderRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('ready');
    setDuration(0);

    // إيقاف البث في لوحة التحكم تلقائياً
    if (lectureId) {
      try {
        await controlLectureStream(Number(lectureId), 'stop');
      } catch (_) { /* non-fatal */ }
    }
  }, [lectureId]);

  // رفع التسجيل إلى CF Stream عبر Direct Upload
  const uploadRecording = useCallback(async (blob: Blob, id: number) => {
    setUploadStatus('uploading');
    setUploadProgress(0);
    try {
      const { uploadURL } = await getCfUploadUrl(id);
      const formData = new FormData();
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('file', blob, `recording.${ext}`);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setUploadProgress(Math.round(e.loaded / e.total * 100));
        };
        xhr.onloadend = () => xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
        xhr.open('POST', uploadURL);
        xhr.send(formData);
      });
      setUploadStatus('done');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadStatus('error');
    }
  }, []);

  // Toggle mute
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    setIsMuted(m => !m);
  };

  // Toggle camera
  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = isCameraOff; });
    setIsCameraOff(c => !c);
  };

  const copyViewerLink = () => {
    const link = `${window.location.origin}/tv/${lectureId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmtDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: 'white', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.darkNavy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'live' && (
            <span style={{ background: C.live, color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: '0.83rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, background: 'white', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
              LIVE · {fmtDuration(duration)}
            </span>
          )}
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {lectureId && (
            <button
              onClick={copyViewerLink}
              style={{ padding: '7px 16px', borderRadius: 20, background: copied ? `${C.softGreen}30` : 'rgba(255,255,255,0.08)', color: copied ? C.softGreen : 'rgba(255,255,255,0.7)', border: `1px solid ${copied ? C.softGreen : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', fontSize: '0.82rem' }}
            >
              {copied ? '✓ تم النسخ' : '🔗 رابط المشاهدة'}
            </button>
          )}
          <Link href="/admin/lectures" style={{ padding: '7px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontSize: '0.82rem' }}>
            ← الإدارة
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ctrl-btn { padding: 10px 18px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.07); color: white; cursor: pointer; font-size: 0.88rem; transition: background 0.15s; }
        .ctrl-btn:hover { background: rgba(255,255,255,0.14); }
        .ctrl-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, height: 'calc(100vh - 57px)' }}>

        {/* Main video area */}
        <div style={{ position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: status === 'idle' ? 'none' : 'block' }}
          />

          {/* Idle state */}
          {status === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>📹</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>اضغط لفتح الكاميرا والبدء</p>
              <button onClick={openCamera} style={{ padding: '14px 32px', borderRadius: 30, background: C.teal, color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                📷 فتح الكاميرا
              </button>
            </div>
          )}

          {/* Requesting */}
          {status === 'requesting' && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10, display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div>
              <p>جاري طلب إذن الكاميرا...</p>
            </div>
          )}

          {/* Connecting */}
          {status === 'connecting' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>🔄</div>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>جاري الاتصال بـ Cloudflare Stream...</span>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)', borderRadius: 12, padding: '12px 20px', maxWidth: 480, textAlign: 'center', color: '#ff8888', fontSize: '0.88rem' }}>
              ⚠️ {errorMsg}
              <button onClick={openCamera} style={{ display: 'block', margin: '10px auto 0', padding: '7px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', fontSize: '0.82rem' }}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Camera-off overlay */}
          {isCameraOff && status !== 'idle' && (
            <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ fontSize: '3rem' }}>🚫</span>
              <span>الكاميرا متوقفة</span>
            </div>
          )}

          {/* Bottom controls bar */}
          {(status === 'ready' || status === 'live') && (
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: 40, padding: '10px 16px' }}>
              <button className="ctrl-btn" onClick={toggleMute} title={isMuted ? 'تشغيل الميكروفون' : 'كتم الصوت'}>
                {isMuted ? '🔇' : '🎙️'}
              </button>
              <button className="ctrl-btn" onClick={toggleCamera} title={isCameraOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}>
                {isCameraOff ? '📷' : '📸'}
              </button>

              {status === 'ready' && (
                <button
                  onClick={startBroadcast}
                  disabled={!whipUrl}
                  style={{ padding: '10px 28px', borderRadius: 30, background: C.live, color: 'white', border: 'none', fontWeight: 700, cursor: whipUrl ? 'pointer' : 'default', fontSize: '0.95rem', opacity: whipUrl ? 1 : 0.5 }}
                >
                  ▶ بدء البث المباشر
                </button>
              )}

              {status === 'live' && (
                <button
                  onClick={stopBroadcast}
                  style={{ padding: '10px 28px', borderRadius: 30, background: '#1a1a2a', color: 'white', border: `1px solid ${C.live}`, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  ⏹ إيقاف البث
                </button>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ background: '#111827', borderRight: 'none', borderLeft: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status card */}
          <div style={{ background: status === 'live' ? `${C.live}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${status === 'live' ? C.live + '40' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>الحالة</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: status === 'live' ? C.live : status === 'ready' ? C.softGreen : 'rgba(255,255,255,0.6)' }}>
              {status === 'idle' && '⚫ في انتظار الكاميرا'}
              {status === 'requesting' && '🟡 طلب الأذونات...'}
              {status === 'ready' && '🟢 جاهز للبث'}
              {status === 'connecting' && '🟡 جاري الاتصال...'}
              {status === 'live' && `🔴 بث مباشر · ${fmtDuration(duration)}`}
              {status === 'error' && '🔴 خطأ'}
            </div>
          </div>

          {/* Upload status after broadcast */}
          {uploadStatus !== 'idle' && (
            <div style={{ background: uploadStatus === 'done' ? 'rgba(133,199,154,0.1)' : uploadStatus === 'error' ? 'rgba(255,68,68,0.1)' : 'rgba(78,141,156,0.1)', border: `1px solid ${uploadStatus === 'done' ? C.softGreen + '50' : uploadStatus === 'error' ? '#ff444450' : C.teal + '50'}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>حفظ التسجيل</div>
              {uploadStatus === 'uploading' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                    <span>⬆️ جاري الرفع إلى Cloudflare...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: C.teal, transition: 'width 0.3s', borderRadius: 3 }} />
                  </div>
                </>
              )}
              {uploadStatus === 'done' && (
                <div style={{ color: C.softGreen, fontSize: '0.88rem', fontWeight: 600 }}>✅ تم رفع التسجيل إلى Cloudflare Stream بنجاح!</div>
              )}
              {uploadStatus === 'error' && (
                <div style={{ color: '#ff8888', fontSize: '0.88rem' }}>⚠️ فشل رفع التسجيل — يمكنك إعادة المحاولة من لوحة التحكم</div>
              )}
            </div>
          )}

          {/* Device selector */}
          {status !== 'idle' && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>الأجهزة</div>
              {videoDevices.length > 1 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>📹 الكاميرا</div>
                  <select
                    value={selectedVideo}
                    onChange={e => { setSelectedVideo(e.target.value); if (status === 'ready') openCamera(); }}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 10px', color: 'white', fontSize: '0.82rem', outline: 'none' }}
                  >
                    {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId} style={{ background: '#1a1a2a' }}>{d.label || `كاميرا ${d.deviceId.slice(0, 6)}`}</option>)}
                  </select>
                </div>
              )}
              {audioDevices.length > 1 && (
                <div>
                  <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>🎙️ الميكروفون</div>
                  <select
                    value={selectedAudio}
                    onChange={e => { setSelectedAudio(e.target.value); if (status === 'ready') openCamera(); }}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 10px', color: 'white', fontSize: '0.82rem', outline: 'none' }}
                  >
                    {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId} style={{ background: '#1a1a2a' }}>{d.label || `ميكروفون ${d.deviceId.slice(0, 6)}`}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Viewer preview — shown only when actually live */}
          {iframeUrl && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>معاينة المشاهدين</div>
              {status === 'live' ? (
                <>
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '16/9' }}>
                    <iframe
                      src={iframeUrl}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="autoplay; fullscreen"
                    />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', marginTop: 5, textAlign: 'center' }}>
                    هذا ما يراه المشاهدون عبر Cloudflare Stream
                  </div>
                </>
              ) : (
                <div style={{ aspectRatio: '16/9', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>📺</span>
                  ستظهر هنا المعاينة عند بدء البث
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 6 }}>💡 نصائح</div>
            <div>• WebRTC تأخير منخفض (1–3 ث)</div>
            <div>• تأكد من اتصال الإنترنت قوي</div>
            <div>• استخدم Chrome أو Edge للأفضل</div>
            <div>• للجودة العالية استخدم OBS + RTMPS</div>
          </div>

          {/* WHIP URL (debug) */}
          {!whipUrl && (
            <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 10, padding: 12, fontSize: '0.83rem', color: '#ff8888' }}>
              ⚠️ لم يتم تمرير رابط WHIP. ارجع لصفحة إدارة المحاضرات واضغط &quot;▶ بدء البث&quot; أولاً ثم اختر &quot;بث من المتصفح&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BroadcastPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        جاري التحميل...
      </div>
    }>
      <BroadcastContent />
    </Suspense>
  );
}
