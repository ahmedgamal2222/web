'use client';

import { useEffect, useState, useRef } from 'react';
import { verifyScreen, screenActivate, fetchInstitution, fetchEvents, fetchNews, fetchLectures, fetchGalaxyData, checkLectureRecording, fetchAgreements, fetchPulse, screenConnect, API_BASE } from '@/lib/api';
import type { PulseItem } from '@/lib/api';
import GalaxyCanvas from '@/components/GalaxyCanvas';
import type { GalaxyData } from '@/lib/types';
import PulseDetailPopup from '@/components/PulseDetailPopup';

// ─── Relative time in Arabic ────────────────────────────────────────────────
function timeAgoAr(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `منذ ${m} ${m === 1 ? 'دقيقة' : m < 11 ? 'دقائق' : 'دقيقة'}`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `منذ ${h} ${h === 1 ? 'ساعة' : h < 11 ? 'ساعات' : 'ساعة'}`;
  }
  const d = Math.floor(diff / 86400);
  return `منذ ${d} ${d === 1 ? 'يوم' : d < 11 ? 'أيام' : 'يوم'}`;
}

// ─── External Video URL Parser ───────────────────────────────────────────────
function parseExternalVideoUrl(url: string): { embedUrl: string; platform: 'youtube' | 'vimeo' | 'dailymotion' } | null {
  if (!url) return null;
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&enablejsapi=1&loop=1&playlist=${yt[1]}&playsinline=1`, platform: 'youtube' };
  const vm = u.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vm) return { embedUrl: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1`, platform: 'vimeo' };
  const dm = u.match(/(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dm) return { embedUrl: `https://www.dailymotion.com/embed/video/${dm[1]}?autoplay=1&mute=1`, platform: 'dailymotion' };
  // Already an embed URL — ensure YouTube controls are hidden
  if (u.includes('youtube.com/embed/')) {
    const idMatch = u.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    const ytId = idMatch?.[1] ?? '';
    const sep = u.includes('?') ? '&' : '?';
    const clean = u.replace(/[&?](controls|modestbranding|rel|iv_load_policy|disablekb|fs|cc_load_policy|enablejsapi|loop|playlist|playsinline)=[^&]*/g, '');
    return { embedUrl: `${clean}${sep}controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&enablejsapi=1&loop=1&playlist=${ytId}&playsinline=1`, platform: 'youtube' };
  }
  if (u.includes('player.vimeo.com/video/')) return { embedUrl: u, platform: 'vimeo' };
  if (u.includes('dailymotion.com/embed/video/')) return { embedUrl: u, platform: 'dailymotion' };
  return null;
}

// ─── بناء قائمة تشغيل رئيسية من جميع المحاضرات ──────────────────────────────
function buildMasterPlaylist(allLectures: any[]): { embedUrl: string; lecture: any }[] {
  const entries: { embedUrl: string; lecture: any }[] = [];
  for (const lec of allLectures) {
    if (lec.is_live) continue;
    const rawUrl = lec.stream_url || lec.video_url || '';
    // JSON playlist
    try {
      const parsed = JSON.parse(rawUrl);
      if (parsed?.playlist && Array.isArray(parsed.playlist)) {
        for (const u of parsed.playlist) entries.push({ embedUrl: u, lecture: lec });
        continue;
      }
    } catch {}
    // External embed (YouTube/Vimeo/Dailymotion)
    const ext = parseExternalVideoUrl(rawUrl);
    if (ext) { entries.push({ embedUrl: ext.embedUrl, lecture: lec }); continue; }
    // Cloudflare recorded
    if (lec.cf_video_id) { entries.push({ embedUrl: `__cf:${lec.cf_video_id}`, lecture: lec }); continue; }
    // Raw video URL
    if (rawUrl && !lec.cf_live_input_id) { entries.push({ embedUrl: rawUrl, lecture: lec }); }
  }
  return entries;
}

export default function ScreenPage() {
  const institutionId = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
    : 'default';

  // وضع TV: الدخول عبر tv.hadmaj.com بدون معرّف مؤسسة في الرابط
  const isTvMode = institutionId === 'tv';
  const [resolvedId, setResolvedId] = useState<string>(institutionId);

  const [institution, setInstitution] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [allAds, setAllAds] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [pulse, setPulse] = useState<PulseItem[]>([]);
  const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedQuadrant, setExpandedQuadrant] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPulse, setSelectedPulse] = useState<PulseItem | null>(null);
  const [adCountdown, setAdCountdown] = useState(5);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [playlistIdx, setPlaylistIdx] = useState(0);
  const playlistTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // إطلاق حدث resize بعد تغيير الربع الموسّع حتى يتحدّث Three.js بحجم الحاوية الجديد
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    return () => clearTimeout(t);
  }, [expandedQuadrant]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lectureIframeRef = useRef<HTMLIFrameElement>(null);
  const adIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFnRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // تخطي المصادقة للمستخدمين المسجلين تلقائياً (غير متاح في وضع TV)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isTvMode) return; // وضع TV يتطلب دائماً كلمة مرور الشاشة

    // ── تخطي المصادقة للمستخدمين المسجلين تلقائياً ───────────────
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      JSON.parse(userStr); // تحقق من صحة البيانات فقط
    } catch {
      return;
    }
    // المستخدم مسجل دخوله: تحميل مباشر بدون كلمة مرور
    fetchInstitution(institutionId)
      .then((inst) => {
        setInstitution(inst);
        return screenActivate(Number(institutionId), true);
      })
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(true));
  }, [institutionId, isTvMode]);

  // التحقق من كلمة المرور
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
      if (isTvMode) {
        // وضع TV: البحث عن المؤسسة بكلمة المرور فقط (بدون معرّف)
        const result = await screenConnect(password);
        if (result.valid && result.institution_id) {
          const id = String(result.institution_id);
          setResolvedId(id);
          setInstitution(result.institution);
          await screenActivate(Number(id), true);
          setAuthenticated(true);
        } else {
          setError(result.message || 'كلمة المرور غير صحيحة');
        }
        return;
      }

      const result = await verifyScreen(Number(institutionId), password);

      if (result.valid) {
        const inst = await fetchInstitution(institutionId);
        setInstitution(inst);
        // تنشيط الشاشة في قاعدة البيانات
        await screenActivate(Number(institutionId), true);
        setAuthenticated(true);
      } else {
        setError(result.message || 'كلمة المرور غير صحيحة');
      }
    } catch (err: any) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setAuthLoading(false);
    }
  };

  // إلغاء تنشيط الشاشة عند إغلاق التبويب أو المتصفح
  useEffect(() => {
    if (!authenticated) return;

    const activeId = resolvedId;
    const deactivate = () => {
      // keepalive يضمن إرسال الطلب حتى عند إغلاق الصفحة
      fetch(`${API_BASE}/api/screen/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: Number(activeId), active: false }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', deactivate);
    return () => {
      window.removeEventListener('beforeunload', deactivate);
      // إلغاء التنشيط أيضاً عند إزالة المكوّن (navigation داخلي)
      screenActivate(Number(activeId), false).catch(() => {});
    };
  }, [authenticated, resolvedId]);

  // تحميل البيانات
  useEffect(() => {
    if (!authenticated || !resolvedId || resolvedId === 'tv') return;

    const loadData = async () => {
      try {
        setDataLoading(true);
        const [eventsData, newsData, lecturesData, galaxyDataResult, agreementsResult] = await Promise.all([
          fetchEvents(resolvedId),
          fetchNews(),
          fetchLectures(),
          fetchGalaxyData(),
          (fetchAgreements({ limit: 20 }) as Promise<any>).catch(() => ({ data: [] })),
        ]);
        setEvents(eventsData);
        setNews(newsData);
        setLectures(lecturesData);
        setGalaxyData(galaxyDataResult);
        setAgreements((agreementsResult as any)?.data ?? []);

        // جلب نبضات المجرة
        fetchPulse({ limit: 50 }).then(r => setPulse(r.data)).catch(() => {});
      } catch (err) {
        console.error('Error loading screen data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
    // تحديث النبض كل 30 ثانية
    const pulseInterval = setInterval(() => {
      fetchPulse({ limit: 50 }).then(r => setPulse(r.data)).catch(() => {});
    }, 30000);
    return () => { clearInterval(pulseInterval); };
  }, [authenticated, resolvedId]);

  // متابعة حالة التسجيل عندما يكون CF يعالج الفيديو بعد انتهاء البث
  useEffect(() => {
    if (!authenticated) return;
    const pending = lectures.find(
      l => !l.is_live && l.cf_live_input_id && !l.cf_video_id && l.stream_type === 'recorded'
    );
    if (!pending) return;

    let active = true;
    const check = async () => {
      try {
        const result = await checkLectureRecording(pending.id);
        if (active && result.ready && result.cf_video_id) {
          setLectures(prev => prev.map((l: any) =>
            l.id === pending.id ? { ...l, cf_video_id: result.cf_video_id } : l
          ));
        }
      } catch (_) {}
    };

    check(); // فحص فوري
    const pollInterval = setInterval(check, 20000);
    return () => { active = false; clearInterval(pollInterval); };
  }, [lectures, authenticated]);

  // تدوير الإعلانات
  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;

    const fetchAds = async () => {
      try {
        // جلب الإعلانات النشطة — مفلترة حسب بلد/مدينة المؤسسة إن توفّرت
        const params = new URLSearchParams({ limit: '50' });
        if (institution?.country) params.set('target_country', institution.country);
        if (institution?.city)    params.set('target_city',    institution.city);

        const response = await fetch(`${API_BASE}/api/ads?${params}`);
        const json = await response.json();
        const ads: any[] = json?.data ?? [];

        setAllAds(ads);
        if (ads.length === 0) return;

        // إيقاف الدوران القديم إن وُجد
        if (adIntervalRef.current) clearInterval(adIntervalRef.current);

        // خلط عشوائي للإعلانات (Fisher-Yates shuffle)
        const shuffled = [...ads];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        let index = 0;
        setCurrentAd(shuffled[0]);

        adIntervalRef.current = setInterval(() => {
          index = (index + 1) % shuffled.length;
          // إعادة الخلط عند إكمال دورة كاملة
          if (index === 0) {
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
          }
          setCurrentAd(shuffled[index]);
        }, 5000);
      } catch (err) {
        console.error('Error fetching ads:', err);
      }
    };

    fetchAds();
    // إعادة الجلب كل 5 دقائق لالتقاط إعلانات جديدة
    const refreshInterval = setInterval(fetchAds, 300_000);

    return () => {
      if (adIntervalRef.current) clearInterval(adIntervalRef.current);
      clearInterval(refreshInterval);
    };
  }, [authenticated, institution]);

  // ─── عداد الإعلان التنازلي ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentAd) return;
    setAdCountdown(5);
    const tick = setInterval(() => {
      setAdCountdown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
  }, [currentAd]);

  // ─── صوت المجرة — يُهيَّأ عند أول تفاعل (متطلب المتصفح) ─────────────────
  useEffect(() => {
    const unlock = () => {
      if (audioRef.current) return;
      try {
        const audio = new Audio('/sound/DSGNDron_Trailer_Drones_Universe_Atmospheric_Abstract_Misterious_Deep_Ambiance_ESM_TFOR.wav');
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;
      } catch (_) {}
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      if (fadeFnRef.current) clearInterval(fadeFnRef.current);
      audioRef.current?.pause();
    };
  }, []);

  // رفع/خفض الصوت عند دخول/خروج ربع المجرة
  const fadeTo = (target: number, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeFnRef.current) clearInterval(fadeFnRef.current);
    const step = 0.02;
    const interval = 60; // ms — ~2 ثانية للوصول من 0 إلى 1
    fadeFnRef.current = setInterval(() => {
      const cur = audio.volume;
      if (Math.abs(cur - target) <= step) {
        audio.volume = target;
        clearInterval(fadeFnRef.current);
        onDone?.();
      } else {
        audio.volume = cur < target ? Math.min(cur + step, target) : Math.max(cur - step, target);
      }
    }, interval);
  };

  const startSpaceSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    fadeTo(0.6);
  };

  const stopSpaceSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeTo(0, () => audio.pause());
  };

  // ─── تبديل كتم/تشغيل صوت الفيديو ────────────────────────────────────────
  const toggleVideoMute = () => {
    const newMuted = !isVideoMuted;
    setIsVideoMuted(newMuted);
    // YouTube: لا حاجة لـ postMessage — الـ iframe يُعاد تحميله تلقائياً عبر تغيير key مع mute=0/1
    const iframe = lectureIframeRef.current;
    if (!iframe?.contentWindow) return;
    const src = iframe.src || '';
    if (src.includes('cloudflarestream.com')) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ type: newMuted ? 'mute' : 'unmute' }),
        'https://iframe.cloudflarestream.com'
      );
    } else if (src.includes('vimeo.com')) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ method: 'setMuted', value: newMuted }),
        'https://player.vimeo.com'
      );
    }
    // <video> element
    if (videoRef.current) videoRef.current.muted = newMuted;
  };

  // ─── إعادة ضبط فهرس قائمة التشغيل عند تغيير المحاضرات ──────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPlaylistIdx(0); }, [lectures.map((l: any) => l.id).join(',')]);

  // ─── تدوير قائمة التشغيل (من جميع المحاضرات) ──────────────────────────
  useEffect(() => {
    if (lectures.find((l: any) => l.is_live)) return; // لا تدوير أثناء البث المباشر

    const entries = buildMasterPlaylist(lectures);
    if (entries.length <= 1) return;

    const advance = () => setPlaylistIdx(prev => (prev + 1) % entries.length);

    // الاستماع لحدث انتهاء الفيديو من YouTube
    const handler = (e: MessageEvent) => {
      try {
        const raw = e.data;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (data?.event === 'onStateChange' && (data?.info === 0 || data?.info === -1)) advance();
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 0) advance();
      } catch {}
    };
    window.addEventListener('message', handler);

    // إعادة إرسال الاشتراك بشكل دوري لضمان استلام أحداث YouTube
    const subscribeInterval = setInterval(() => {
      const iw = lectureIframeRef.current?.contentWindow;
      if (!iw) return;
      try {
        iw.postMessage(JSON.stringify({ event: 'listening', channel: 'widget' }), '*');
        iw.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
      } catch {}
    }, 3000);

    // fallback: الانتقال تلقائياً بعد 3 دقائق إذا لم يصل الحدث
    if (playlistTimerRef.current) clearTimeout(playlistTimerRef.current);
    playlistTimerRef.current = setTimeout(advance, 3 * 60 * 1000);

    return () => {
      window.removeEventListener('message', handler);
      clearInterval(subscribeInterval);
      if (playlistTimerRef.current) clearTimeout(playlistTimerRef.current);
    };
  }, [lectures, playlistIdx]);

  // ─── شاشة تسجيل الدخول ───────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="screen-auth">
        <style jsx>{`
          .screen-auth {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: #0a0a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            direction: rtl;
          }
          .auth-box {
            background: rgba(255,255,255,0.05);
            border: 2px solid #FFD700;
            border-radius: 20px;
            padding: 40px;
            width: 400px;
            text-align: center;
          }
          .auth-box h2 { color: #FFD700; margin-bottom: 8px; }
          .auth-box p  { color: rgba(255,255,255,0.6); margin-bottom: 24px; }
          .auth-error {
            background: rgba(255,80,80,0.12);
            border: 1px solid #ff5050;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 16px;
            color: #ff5050;
            font-size: 0.9rem;
          }
          input {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,215,0,0.3);
            border-radius: 8px;
            color: white;
            font-size: 1.2rem;
            text-align: center;
            letter-spacing: 4px;
            box-sizing: border-box;
            outline: none;
          }
          input:focus { border-color: #FFD700; }
          button {
            width: 100%;
            padding: 12px;
            background: #FFD700;
            border: none;
            border-radius: 8px;
            color: #0a0a1a;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            opacity: 1;
            transition: opacity 0.2s;
          }
          button:disabled { opacity: 0.6; cursor: default; }
        `}</style>

        <div className="auth-box">
          <h2>✦ الشاشة الحضارية ✦</h2>
          <p>أدخل رمز المرور الخاص بالمؤسسة</p>

          <form onSubmit={handleAuthenticate}>
            {error && <div className="auth-error">{error}</div>}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="****"
              maxLength={6}
              autoFocus
              required
            />
            <button type="submit" disabled={authLoading}>
              {authLoading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── شاشة التحميل ────────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        background: '#0a0a1a',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        color: 'white', fontSize: '1.2rem',
      }}>
        جاري تحميل الشاشة الحضارية...
      </div>
    );
  }

  const liveLecture = lectures.find((l: any) => l.is_live);

  // ─── قائمة تشغيل رئيسية: جمع كل الفيديوهات من كل المحاضرات ──────────
  const allVideoEntries = liveLecture ? [] : buildMasterPlaylist(lectures);
  const safePlayIdx = allVideoEntries.length > 0 ? playlistIdx % allVideoEntries.length : 0;
  const currentVideoEntry = allVideoEntries[safePlayIdx] ?? null;

  const displayLecture = liveLecture || currentVideoEntry?.lecture || lectures.find((l: any) =>
    (l.stream_type === 'recorded' || l.stream_type === 'external') &&
    (l.stream_url || l.video_url || l.cf_video_id || l.cf_live_input_id)
  ) || null;

  // تحديد نوع الفيديو الحالي
  const rawEmbed = currentVideoEntry?.embedUrl || '';
  const currentCfVideoId = rawEmbed.startsWith('__cf:') ? rawEmbed.slice(5) : null;
  // دائماً نحذف loop حتى يطلق YouTube حدث الانتهاء + نتحكم بـ mute عبر الرابط
  const currentDisplayEmbed = (!rawEmbed.startsWith('__cf:') && rawEmbed)
    ? rawEmbed
        .replace(/&loop=1/g, '').replace(/\?loop=1&?/, '?')
        .replace(/&playlist=[a-zA-Z0-9_-]*/g, '')
        .replace(/mute=1/, `mute=${isVideoMuted ? '1' : '0'}`)
    : null;

  // دمج الأخبار + الفعاليات + الاتفاقيات في تدفق موحّد مرتّب زمنياً
  const combinedFeed = [
    ...news.map((n: any) => ({
      type: 'news' as const,
      id: n.id,
      date: n.published_at,
      title: n.title,
      content: n.content,
      image_url: n.image_url,
      icon: '📰',
      subtitle: null,
    })),
    ...events.map((e: any) => ({
      type: 'event' as const,
      id: e.id,
      date: e.start_datetime || e.created_at,
      title: e.title,
      content: e.description,
      image_url: e.image_url,
      icon: '📅',
      subtitle: e.start_datetime
        ? new Date(e.start_datetime).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
        : null,
    })),
    ...agreements.map((a: any) => ({
      type: 'agreement' as const,
      id: a.id,
      date: a.signed_at || a.start_date || a.created_at,
      title: a.title || 'اتفاقية',
      content: a.description,
      image_url: null,
      icon: '🤝',
      subtitle: a.status === 'active' ? 'اتفاقية نشطة' : a.status === 'signed' ? 'تم توقيع الاتفاقية' : 'اتفاقية جديدة',
    })),
  ]
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const tickerItems = combinedFeed.length > 0 ? combinedFeed : news;
  return (
    <div className="cultural-screen">
      <style jsx global>{`
        body {
          margin: 0; padding: 0;
          overflow: hidden;
          background: #000;
          font-family: 'Cairo', 'Arial', sans-serif;
        }
        .cultural-screen {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 4px;
          background: #000;
          padding: 4px;
          box-sizing: border-box;
        }
        .quadrant {
          background: #0a0a1a;
          border: 1px solid rgba(255,215,0,0.45);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
        }
        .q-header {
          position: absolute;
          top: 12px; right: 12px;
          background: rgba(255,215,0,0.92);
          color: #0a0a1a;
          padding: 6px 18px;
          border-radius: 22px;
          font-weight: 800;
          z-index: 10;
          font-size: 0.9rem;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 10px rgba(255,215,0,0.35);
        }
        /* ربع الفيديو */
        .lecture-video { width: 100%; height: 100%; object-fit: cover; }
        .lecture-info {
          position: absolute;
          bottom: 12px; left: 12px; right: 12px;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(6px);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          border: 1px solid rgba(255,255,255,0.1);
          line-height: 1.5;
        }
        /* ربع المجرة */
        .galaxy-view {
          width: 100%; height: 100%;
          background: radial-gradient(circle at center, #1a1a2a 0%, #0a0a1a 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .highlighted-star {
          width: 30px; height: 30px;
          background: #FFD700;
          border-radius: 50%;
          box-shadow: 0 0 40px #FFD700;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 40px #FFD700; }
          50%      { box-shadow: 0 0 80px #FFD700; }
        }
        .star-label {
          margin-top: 18px;
          color: white;
          background: rgba(0,0,0,0.75);
          padding: 8px 20px;
          border-radius: 22px;
          border: 1px solid rgba(255,215,0,0.6);
          white-space: nowrap;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          box-shadow: 0 0 18px rgba(255,215,0,0.18);
        }
        /* ربع الأخبار */
        .news-list {
          height: calc(100% - 50px);
          overflow-y: auto;
          padding: 52px 16px 12px 16px;
          color: white;
          direction: rtl;
        }
        .news-list::-webkit-scrollbar { width: 3px; }
        .news-list::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 4px; }
        .news-list-item {
          padding: 11px 8px;
          border-bottom: 1px solid rgba(255,215,0,0.15);
          margin-bottom: 2px;
          transition: background 0.2s;
        }
        .news-list-item:hover { background: rgba(255,215,0,0.04); border-radius: 8px; }
        .news-date { font-size: 0.83rem; color: #FFD700; opacity: 0.75; margin-bottom: 4px; }
        /* نبض المجرة */
        .pulse-list {
          height: calc(100% - 48px);
          overflow-y: auto;
          padding: 50px 14px 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 0;
          direction: rtl;
        }
        .pulse-list::-webkit-scrollbar { width: 3px; }
        .pulse-list::-webkit-scrollbar-thumb { background: rgba(79,195,247,0.35); border-radius: 4px; }
        .pulse-item {
          display: flex;
          gap: 10px;
          padding: 11px 6px;
          border-bottom: 1px solid rgba(79,195,247,0.1);
          cursor: pointer;
          transition: background 0.18s;
          position: relative;
        }
        .pulse-item:hover { background: rgba(79,195,247,0.06); border-radius: 8px; }
        .pulse-item.featured { border-bottom-color: rgba(255,215,0,0.3); }
        .pulse-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #4fc3f7;
          flex-shrink: 0;
          margin-top: 5px;
          box-shadow: 0 0 6px #4fc3f7;
        }
        .pulse-item.featured .pulse-dot {
          background: #FFD700;
          box-shadow: 0 0 8px #FFD700;
          width: 10px; height: 10px;
        }
        .pulse-body { flex: 1; min-width: 0; }
        .pulse-content {
          color: rgba(255,255,255,0.92);
          font-size: 0.93rem;
          line-height: 1.5;
          font-weight: 500;
        }
        .pulse-item.featured .pulse-content { color: #fff; font-weight: 600; }
        .pulse-time {
          font-size: 0.78rem;
          color: rgba(79,195,247,0.65);
          margin-top: 3px;
        }
        .pulse-img {
          width: 44px; height: 44px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.1);
          align-self: center;
        }
        .news-ticker {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 48px;
          background: rgba(0,0,0,0.88);
          border-top: 1px solid rgba(255,215,0,0.25);
          display: flex; align-items: center;
          overflow: hidden;
        }
        .news-items {
          display: flex;
          animation: ticker 40s linear infinite;
          white-space: nowrap;
        }
        .news-item { padding: 0 32px; color: #FFD700; font-size: 1rem; font-weight: 600; }
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        /* الشريط العلوي */
        .institution-info {
          position: fixed;
          top: 12px; right: 12px;
          background: rgba(0,0,0,0.82);
          backdrop-filter: blur(8px);
          color: white;
          padding: 9px 22px;
          border-radius: 32px;
          border: 1px solid rgba(255,215,0,0.55);
          z-index: 100;
          font-size: 0.95rem;
          direction: rtl;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .institution-name { color: #FFD700; font-weight: 800; }
        /* مؤشر الحالة */
        .screen-status {
          position: fixed;
          bottom: 12px; right: 14px;
          color: #32CD32;
          font-size: 0.88rem;
          font-weight: 600;
          z-index: 100;
          direction: rtl;
          background: rgba(0,0,0,0.65);
          padding: 5px 14px;
          border-radius: 20px;
          border: 1px solid rgba(50,205,50,0.3);
        }
        .status-dot {
          display: inline-block;
          width: 9px; height: 9px;
          background: #32CD32;
          border-radius: 50%;
          margin-left: 6px;
          animation: blink 2s infinite;
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        .empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; color: rgba(255,255,255,0.5);
          font-size: 0.95rem; gap: 8px;
        }
        /* شارة البث */
        .badge-live {
          display: inline-flex; align-items: center; gap: 6px;
          background: #ff4444; color: white;
          padding: 5px 14px; border-radius: 22px;
          font-size: 0.88rem; font-weight: 800;
          box-shadow: 0 2px 10px rgba(255,68,68,0.5);
        }
        .badge-live-dot {
          width: 8px; height: 8px; background: white;
          border-radius: 50%; animation: blink 1s infinite;
        }
        .badge-recorded {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(78,141,156,0.92); color: white;
          padding: 5px 14px; border-radius: 22px;
          font-size: 0.88rem; font-weight: 700;
          box-shadow: 0 2px 10px rgba(78,141,156,0.4);
        }
        .viewer-count {
          position: absolute; top: 46px; left: 12px;
          background: rgba(0,0,0,0.72); color: white;
          padding: 4px 12px; border-radius: 20px;
          font-size: 0.85rem; font-weight: 600; z-index: 10;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; color: rgba(255,255,255,0.5);
          font-size: 0.95rem; gap: 8px;
        }
        /* ربع الإعلانات — عرض واحد متكامل */
        .ad-full {
          position: relative;
          width: 100%; height: 100%;
          overflow: hidden;
          animation: adFadeIn 0.8s ease;
        }
        @keyframes adFadeIn {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }
        .ad-bg-image {
          position: absolute; inset: 0;
          background-size: cover;
          background-position: center;
          transform: scale(1.05);
          animation: adZoom 12s ease-in-out forwards;
        }
        @keyframes adZoom {
          from { transform: scale(1.05); }
          to   { transform: scale(1); }
        }
        .ad-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.92) 0%,
            rgba(0,0,0,0.45) 50%,
            rgba(0,0,0,0.15) 100%
          );
        }
        .ad-full-content {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 28px 24px 24px;
          direction: rtl;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ad-no-image {
          position: static;
          width: 100%; height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 24px;
          background: radial-gradient(ellipse at center, #1a1a3a 0%, #0a0a1a 100%);
          gap: 12px;
        }
        .ad-has-image { /* content over image */ }
        .ad-badge-pill {
          display: inline-flex;
          align-self: flex-start;
          background: rgba(255,215,0,0.92);
          color: #0a0a1a;
          padding: 5px 16px;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.4px;
          box-shadow: 0 2px 8px rgba(255,215,0,0.3);
        }
        .ad-no-image .ad-badge-pill { align-self: center; }
        .ad-star-deco {
          font-size: 3rem;
          color: #FFD700;
          animation: adStarPulse 3s ease-in-out infinite;
        }
        @keyframes adStarPulse {
          0%,100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .ad-full-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: white;
          line-height: 1.4;
          text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }
        .ad-no-image .ad-full-title {
          color: #FFD700;
          text-shadow: 0 0 24px rgba(255,215,0,0.45);
        }
        .ad-full-body {
          margin: 0;
          font-size: 0.93rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.6;
          text-shadow: 0 1px 5px rgba(0,0,0,0.6);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ad-no-image .ad-full-body { color: rgba(255,255,255,0.72); text-shadow: none; }
        .ad-full-source {
          font-size: 0.85rem;
          color: rgba(255,215,0,0.75);
          margin-top: 4px;
          border-top: 1px solid rgba(255,215,0,0.22);
          padding-top: 9px;
          font-weight: 600;
        }
        .ad-full-placeholder {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: radial-gradient(ellipse at center, #1a1a3a 0%, #0a0a1a 100%);
          gap: 12px;
          direction: rtl;
          color: white;
        }
        /* عداد الإعلان */
        .ad-countdown {
          position: absolute;
          bottom: 14px; left: 14px;
          width: 48px; height: 48px;
          z-index: 20;
          pointer-events: none;
        }
        .ad-countdown svg { display: block; }
        .ad-countdown-num {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          color: #FFD700;
          font-size: 0.92rem;
          font-weight: 800;
          text-shadow: 0 1px 4px rgba(0,0,0,0.7);
        }
        .ad-placeholder-star {
          font-size: 3.5rem;
          animation: adStarPulse 3s ease-in-out infinite;
        }
        /* عناصر الخبر في التدفق المدمج */
        .feed-item {
          padding: 10px 6px;
          border-bottom: 1px solid rgba(255,215,0,0.12);
          margin-bottom: 2px;
        }
        .feed-top {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 4px;
        }
        .feed-icon { font-size: 0.9rem; }
        .feed-title { font-size: 0.95rem; color: white; font-weight: 600; line-height: 1.4; }
        .feed-subtitle {
          font-size: 0.83rem;
          color: #FFD700;
          opacity: 0.82;
          margin-top: 3px;
          font-weight: 500;
        }
        .feed-event .feed-title { color: #87CEEB; }
        .feed-agreement .feed-title { color: #90EE90; }
        /* ── ربع مكبَّر ── */
        .quadrant.expanded {
          position: fixed !important;
          top: 0 !important; left: 0 !important;
          width: 100vw !important; height: 100vh !important;
          z-index: 300 !important;
          border-radius: 0 !important;
        }
        /* زر التكبير / التصغير */
        .q-expand-btn {
          position: absolute;
          top: 12px; left: 12px;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,215,0,0.35);
          border-radius: 8px;
          color: rgba(255,215,0,0.65);
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 20;
          font-size: 1.05rem;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
          padding: 0;
        }
        .q-expand-btn:hover { background: rgba(255,215,0,0.2); color: #FFD700; border-color: #FFD700; }
        /* Backdrop خلف الربع المكبَّر */
        .expand-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          z-index: 290;
          cursor: pointer;
        }
        /* ── مودال تفاصيل العنصر ── */
        .item-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.88);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; direction: rtl;
        }
        .item-modal {
          background: #0d0d22;
          border: 1px solid rgba(255,215,0,0.45);
          border-radius: 20px;
          max-width: 640px; width: 100%;
          max-height: 82vh; overflow-y: auto;
          position: relative;
          animation: modalIn 0.25s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .item-modal-img { width: 100%; height: 200px; object-fit: cover; border-radius: 20px 20px 0 0; display: block; }
        .item-modal-body { padding: 22px 26px 28px; }
        .item-modal-tag { display: inline-block; font-size: 0.78rem; color: #FFD700; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 600; }
        .item-modal-title { font-size: 1.3rem; color: #fff; font-weight: 800; margin: 0 0 8px; line-height: 1.5; }
        .item-modal-date { font-size: 0.83rem; color: rgba(255,215,0,0.65); margin-bottom: 14px; }
        .item-modal-content { font-size: 0.95rem; color: rgba(255,255,255,0.82); line-height: 1.85; white-space: pre-wrap; }
        .item-modal-close {
          position: absolute; top: 14px; left: 14px;
          background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.18);
          color: #fff; border-radius: 50%;
          width: 34px; height: 34px; font-size: 1rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          z-index: 10; transition: background 0.2s;
        }
        .item-modal-close:hover { background: rgba(210,40,40,0.55); }
        /* إصلاح إعلان بلا صورة — النص مقصوص */
        .ad-no-image { overflow-y: auto; justify-content: flex-start !important; padding-top: 44px; }
        .ad-no-image .ad-full-body {
          display: block !important;
          -webkit-line-clamp: unset !important;
          overflow: visible !important;
          color: rgba(255,255,255,0.78);
          text-shadow: none;
        }
        /* عناصر القائمة قابلة للنقر */
        .news-list-item, .feed-item { cursor: pointer; }
        .news-list-item:hover { background: rgba(255,215,0,0.09) !important; border-radius: 8px; }
        /* ── ربع 1: تخطيط عمودي بدون تداخل ── */
        .q1-layout {
          display: flex; flex-direction: column;
          width: 100%; height: 100%;
        }
        .q1-topbar {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          background: rgba(6,6,18,0.97);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,215,0,0.25);
          flex-shrink: 0;
          min-height: 48px;
          gap: 10px;
          direction: rtl;
          z-index: 10;
        }
        .q1-badge-group {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .q1-viewers-pill {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.88);
          padding: 3px 11px; border-radius: 20px;
          font-size: 0.83rem; font-weight: 600;
        }
        .q1-no-stream {
          color: rgba(255,255,255,0.48);
          font-size: 0.88rem; font-weight: 500;
        }
        .q-expand-inline {
          position: static !important;
          top: unset !important; left: unset !important;
          flex-shrink: 0;
        }
        .q1-video-wrap {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #000;
          min-height: 0;
        }
        .q1-video-wrap iframe,
        .q1-video-wrap video {
          width: 100% !important; height: 100% !important;
          display: block; border: none;
        }
        .q1-info-bar {
          background: rgba(6,6,18,0.97);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255,215,0,0.22);
          padding: 10px 16px 12px;
          flex-shrink: 0;
          direction: rtl;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .q1-title {
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.45;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .q1-time {
          font-size: 0.84rem;
          color: rgba(255,215,0,0.82);
          font-weight: 500;
        }
        /* ── زر الصوت ── */
        .volume-toggle {
          position: absolute;
          bottom: 18px; right: 16px;
          background: rgba(4,4,16,0.85);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,215,0,0.45);
          border-radius: 30px;
          color: #FFD700;
          padding: 9px 18px 9px 14px;
          cursor: pointer;
          display: flex; align-items: center; gap: 9px;
          font-size: 0.85rem; font-weight: 700;
          z-index: 30;
          transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
          font-family: 'Cairo','Arial',sans-serif;
          direction: rtl;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          outline: none; user-select: none;
          animation: volMutedBreath 3.5s ease-in-out infinite;
        }
        @keyframes volMutedBreath {
          0%,100% { box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 0 rgba(255,215,0,0); }
          50%      { box-shadow: 0 4px 28px rgba(0,0,0,0.5), 0 0 10px 3px rgba(255,215,0,0.18); }
        }
        .volume-toggle:hover {
          background: rgba(255,215,0,0.14);
          border-color: #FFD700;
          transform: scale(1.07);
          box-shadow: 0 6px 32px rgba(255,215,0,0.22);
          animation: none;
        }
        .volume-toggle:active { transform: scale(0.96); }
        .volume-toggle.vol-on {
          border-color: rgba(100,220,255,0.55);
          color: #7dd8ff;
          animation: none;
        }
        .volume-toggle.vol-on:hover {
          background: rgba(100,220,255,0.1);
          border-color: #7dd8ff;
          box-shadow: 0 6px 32px rgba(100,220,255,0.2);
        }
        .vol-icon { font-size: 1.05rem; line-height: 1; flex-shrink: 0; }
        .vol-bars {
          display: flex; align-items: flex-end; gap: 2.5px;
          height: 17px;
        }
        .vol-bar {
          width: 3px; border-radius: 3px;
          background: currentColor;
          animation: volBarPulse 1.1s ease-in-out infinite;
          transform-origin: bottom;
        }
        .vol-bar:nth-child(1) { height: 6px;  animation-delay: 0s; }
        .vol-bar:nth-child(2) { height: 11px; animation-delay: 0.18s; }
        .vol-bar:nth-child(3) { height: 16px; animation-delay: 0.36s; }
        .vol-bar:nth-child(4) { height: 11px; animation-delay: 0.54s; }
        .vol-bar:nth-child(5) { height: 6px;  animation-delay: 0.72s; }
        @keyframes volBarPulse {
          0%,100% { transform: scaleY(0.45); opacity: 0.55; }
          50%      { transform: scaleY(1.3);  opacity: 1; }
        }
        .vol-label { font-size: 0.82rem; font-weight: 700; white-space: nowrap; }

        /* ── حاوية الفيديو الخارجي — بدون قص ── */
        .yt-clip-wrap {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #000;
        }
        .yt-clip-wrap iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        /* طبقة شفافة تمنع أي تفاعل مع واجهة يوتيوب (إيقاف، شعار، اقتراحات) */
        .yt-block-overlay {
          position: absolute;
          inset: 0;
          z-index: 15;
          cursor: default;
          background: transparent;
        }

        /* ── توهّج البث المباشر على الربع ── */
        .q-live-border {
          border-color: rgba(255, 60, 60, 0.65) !important;
          animation: liveQuadrantGlow 2.8s ease-in-out infinite;
        }
        @keyframes liveQuadrantGlow {
          0%,100% { box-shadow: 0 0 0 1.5px rgba(255,60,60,0.5), 0 0 18px rgba(255,60,60,0.10); }
          50%      { box-shadow: 0 0 0 2px   rgba(255,60,60,0.8), 0 0 32px rgba(255,60,60,0.22); }
        }

        /* ── تحسينات مرئية لشريط البث ── */
        .q1-topbar {
          background: linear-gradient(135deg, rgba(8,6,24,0.98) 0%, rgba(12,10,28,0.96) 100%) !important;
          border-bottom-color: rgba(255,215,0,0.3) !important;
        }
        .q1-info-bar {
          background: linear-gradient(180deg, rgba(6,5,18,0.97) 0%, rgba(10,8,22,0.99) 100%) !important;
          border-top-color: rgba(255,215,0,0.28) !important;
        }
        .badge-live {
          box-shadow: 0 0 12px rgba(255,68,68,0.6), 0 2px 10px rgba(255,68,68,0.5);
          animation: liveTagPulse 1.8s ease-in-out infinite;
        }
        @keyframes liveTagPulse {
          0%,100% { box-shadow: 0 0 10px rgba(255,68,68,0.5); }
          50%      { box-shadow: 0 0 22px rgba(255,68,68,0.85), 0 0 40px rgba(255,68,68,0.22); }
        }


      `}</style>

      {/* شريط المؤسسة */}
      <div className="institution-info">
        <span className="institution-name">{institution?.name_ar || institution?.name}</span>
        {' — الشاشة الحضارية'}
      </div>

      <div className="screen-status">
        <span className="status-dot" />
        البث المباشر - نشط
      </div>

      {/* الربع 1: بث المحاضرات */}
      <div className={`quadrant${expandedQuadrant === 1 ? ' expanded' : ''}${liveLecture ? ' q-live-border' : ''}`}>
        <div className="q1-layout">

          {/* ─ شريط علوي: البادج + المشاهدين + زر التكبير ─ */}
          <div className="q1-topbar">
            <div className="q1-badge-group">
              {liveLecture ? (
                <span className="badge-live"><span className="badge-live-dot" />بث مباشر</span>
              ) : displayLecture ? (
                displayLecture.stream_type === 'external' || parseExternalVideoUrl(displayLecture.stream_url || '') ? (
                  <span className="badge-recorded">🎥 بث خارجي</span>
                ) : (
                  <span className="badge-recorded">🎬 محاضرة مسجّلة</span>
                )
              ) : (
                <span className="q1-no-stream">📺 لا يوجد بث حالياً</span>
              )}
              {liveLecture?.viewer_count !== undefined && liveLecture.viewer_count > 0 && (
                <span className="q1-viewers-pill">👁️ {liveLecture.viewer_count} مشاهد</span>
              )}
            </div>
            <button
              className="q-expand-btn q-expand-inline"
              onClick={() => setExpandedQuadrant(expandedQuadrant === 1 ? null : 1)}
              title={expandedQuadrant === 1 ? 'تصغير' : 'تكبير'}
            >
              {expandedQuadrant === 1 ? '⊡' : '⊞'}
            </button>
          </div>

          {/* ─ منطقة الفيديو ─ */}
          <div className="q1-video-wrap">
            {displayLecture ? (
              liveLecture && displayLecture.cf_live_input_id ? (
                <iframe
                  ref={lectureIframeRef}
                  src={`https://iframe.cloudflarestream.com/${displayLecture.cf_live_input_id}?autoplay=true&muted=true`}
                  className="lecture-video"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  style={{ border: 'none', width: '100%', height: '100%' }}
                />
              ) : currentCfVideoId ? (
                <iframe
                  ref={lectureIframeRef}
                  src={`https://iframe.cloudflarestream.com/${currentCfVideoId}?autoplay=true&muted=${isVideoMuted}&loop=${allVideoEntries.length <= 1}`}
                  className="lecture-video"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  style={{ border: 'none', width: '100%', height: '100%' }}
                />
              ) : displayLecture.cf_live_input_id && !displayLecture.cf_video_id && !liveLecture ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: 'rgba(255,255,255,0.6)', gap: 14 }}>
                  <div style={{ fontSize: '2.8rem' }}>⏳</div>
                  <div style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 24px', lineHeight: 1.6 }}>جاري معالجة التسجيل على Cloudflare Stream</div>
                  <div style={{ fontSize: '0.83rem', opacity: 0.45 }}>سيظهر الفيديو تلقائياً خلال دقائق</div>
                </div>
              ) : currentDisplayEmbed ? (
                <div className="yt-clip-wrap">
                  <iframe
                    key={`pl-${safePlayIdx}-${isVideoMuted ? 'm' : 'u'}`}
                    ref={lectureIframeRef}
                    src={currentDisplayEmbed}
                    className="lecture-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: 'none' }}
                    onLoad={() => {
                      const iw = lectureIframeRef.current?.contentWindow;
                      if (!iw) return;
                      const subscribe = () => {
                        try {
                          iw.postMessage(JSON.stringify({ event: 'listening', channel: 'widget' }), '*');
                          iw.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
                        } catch {}
                      };
                      subscribe();
                      setTimeout(subscribe, 1500);
                      setTimeout(subscribe, 4000);
                      setTimeout(subscribe, 8000);
                    }}
                  />
                  {/* طبقة شفافة تمنع التفاعل مع واجهة يوتيوب */}
                  <div className="yt-block-overlay" />
                  {/* gradient يغطي عنوان الفيديو في الأعلى */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 64,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
                    zIndex: 16, pointerEvents: 'none',
                  }} />
                  {/* gradient يغطي شريط التقدم والأزرار في الأسفل */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
                    zIndex: 16, pointerEvents: 'none',
                  }} />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="lecture-video"
                  src={displayLecture.stream_url || displayLecture.video_url}
                  autoPlay
                  muted={isVideoMuted}
                  loop={!liveLecture}
                  controls={false}
                />
              )
            ) : (
              <div className="empty-state">
                <span style={{ fontSize: '2.5rem' }}>📺</span>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>لا يوجد بث حالياً</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>سيبدأ البث قريباً</span>
              </div>
            )}
            {/* ─── زر تشغيل/كتم الصوت ─── */}
            {displayLecture && (
              <button
                className={`volume-toggle${!isVideoMuted ? ' vol-on' : ''}`}
                onClick={toggleVideoMute}
                title={isVideoMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                <span className="vol-icon">{isVideoMuted ? '🔇' : '🔊'}</span>
                {!isVideoMuted ? (
                  <span className="vol-bars" aria-hidden="true">
                    <span className="vol-bar" />
                    <span className="vol-bar" />
                    <span className="vol-bar" />
                    <span className="vol-bar" />
                    <span className="vol-bar" />
                  </span>
                ) : null}
                <span className="vol-label">{isVideoMuted ? 'تشغيل الصوت' : 'كتم الصوت'}</span>
              </button>
            )}
          </div>

          {/* ─ شريط معلومات سفلي ─ */}
          {displayLecture && (
            <div className="q1-info-bar">
              <div className="q1-title">{displayLecture.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {liveLecture ? (
                  <span style={{ background: '#e03030', color: 'white', padding: '2px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800 }}>● بث حيّ مباشر</span>
                ) : displayLecture?.stream_type === 'external' || (displayLecture?.stream_url && parseExternalVideoUrl(displayLecture.stream_url)) ? (
                  <span style={{ background: 'rgba(78,141,156,0.9)', color: 'white', padding: '2px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>🎥 خارجي</span>
                ) : displayLecture ? (
                  <span style={{ background: 'rgba(78,141,156,0.9)', color: 'white', padding: '2px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>🎬 مسجّلة</span>
                ) : null}
                {liveLecture && displayLecture.started_at && (
                  <span className="q1-time">🕐 بدأ: {new Date(displayLecture.started_at).toLocaleTimeString('ar-EG')}</span>
                )}
                {displayLecture.meeting_url && (() => {
                  const u = (displayLecture.meeting_url as string).toLowerCase();
                  const icon = u.includes('zoom.us') ? '🎥' : u.includes('meet.google') ? '🟢' : u.includes('teams.microsoft') ? '🔵' : '🔗';
                  const label = u.includes('zoom.us') ? 'انضم عبر Zoom' : u.includes('meet.google') ? 'انضم عبر Meet' : u.includes('teams.microsoft') ? 'انضم عبر Teams' : 'انضم للاجتماع';
                  return (
                    <a
                      href={displayLecture.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,215,0,0.18)', color: '#FFD700',
                        border: '1px solid rgba(255,215,0,0.5)',
                        padding: '3px 14px', borderRadius: 20,
                        fontSize: '0.82rem', fontWeight: 700,
                        textDecoration: 'none', flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(255,215,0,0.15)',
                      }}
                    >
                      {icon} {label}
                    </a>
                  );
                })()}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* الربع 2: المجرة مع إبراز المؤسسة */}
      <div
        className={`quadrant${expandedQuadrant === 2 ? ' expanded' : ''}`}
        onMouseEnter={startSpaceSound}
        onMouseLeave={stopSpaceSound}
      >
        <button className="q-expand-btn" onClick={() => setExpandedQuadrant(expandedQuadrant === 2 ? null : 2)} title={expandedQuadrant === 2 ? 'تصغير' : 'تكبير'}>
          {expandedQuadrant === 2 ? '⊡' : '⊞'}
        </button>
        <div className="q-header">✦ موقع المؤسسة في المجرة ✦</div>
        {galaxyData ? (
          <GalaxyCanvas
            data={galaxyData}
            autoRotate={true}
            backgroundStarsCount={15000}
            highlightStarId={Number(resolvedId)}
          />
        ) : (
          <div className="galaxy-view">
            <div className="highlighted-star" />
            <div className="star-label">{institution?.name_ar || institution?.name}</div>
          </div>
        )}
      </div>

      {/* الربع 3: نبض المجرة */}
      <div className={`quadrant${expandedQuadrant === 3 ? ' expanded' : ''}`}>
        <button className="q-expand-btn" onClick={() => setExpandedQuadrant(expandedQuadrant === 3 ? null : 3)} title={expandedQuadrant === 3 ? 'تصغير' : 'تكبير'}>
          {expandedQuadrant === 3 ? '⊡' : '⊞'}
        </button>
        <div className="q-header">💫 نبض المجرة</div>
        <div className="pulse-list">
          {pulse.length > 0 ? pulse.map((item) => (
            <div
              key={item.id}
              className={`pulse-item${item.is_featured ? ' featured' : ''}`}
              onClick={() => setSelectedPulse(item)}
            >
              <div className="pulse-dot" />
              <div className="pulse-body">
                <div className="pulse-content">{item.content}</div>
                <div className="pulse-time">
                  {timeAgoAr(item.pulse_date)}
                </div>
              </div>
              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt="" className="pulse-img" />
              )}
            </div>
          )) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <span style={{ fontSize: '2.5rem' }}>💗</span>
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>لا توجد نبضات حتى الآن</span>
              <span style={{ fontSize: '0.85rem', opacity: 0.45 }}>ستظهر الأنشطة تلقائياً</span>
            </div>
          )}
        </div>
      </div>

      {/* الربع 4: إعلانات — عرض إعلان واحد في كل مرة */}
      <div className={`quadrant${expandedQuadrant === 4 ? ' expanded' : ''}`}>
        <button className="q-expand-btn" onClick={() => setExpandedQuadrant(expandedQuadrant === 4 ? null : 4)} title={expandedQuadrant === 4 ? 'تصغير' : 'تكبير'}>
          {expandedQuadrant === 4 ? '⊡' : '⊞'}
        </button>
        {currentAd ? (
          <div key={currentAd.id} className="ad-full">
            {/* عداد تنازلي دائري */}
            <div className="ad-countdown">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <circle
                  cx="24" cy="24" r="19"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 19}`}
                  strokeDashoffset={`${2 * Math.PI * 19 * (1 - adCountdown / 5)}`}
                  transform="rotate(-90 24 24)"
                  style={{ transition: 'stroke-dashoffset 0.95s linear' }}
                />
              </svg>
              <div className="ad-countdown-num">{adCountdown}</div>
            </div>
            {currentAd.image_url ? (
              <>
                <div
                  className="ad-bg-image"
                  style={{ backgroundImage: `url(${currentAd.image_url})` }}
                />
                <div className="ad-bg-overlay" />
                <div className="ad-full-content ad-has-image">
                  <div className="ad-badge-pill">📢 إعلان</div>
                  <h2 className="ad-full-title">{currentAd.title}</h2>
                  {currentAd.content && (
                    <p className="ad-full-body">{currentAd.content}</p>
                  )}
                  {(currentAd.institution_name_ar || currentAd.institution_name) && (
                    <div className="ad-full-source">
                      🏛️ {currentAd.institution_name_ar || currentAd.institution_name}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="ad-full-content ad-no-image">
                <div className="ad-badge-pill">📢 إعلان</div>
                <div className="ad-star-deco">✦</div>
                <h2 className="ad-full-title">{currentAd.title}</h2>
                {currentAd.content && (
                  <p className="ad-full-body">{currentAd.content}</p>
                )}
                {(currentAd.institution_name_ar || currentAd.institution_name) && (
                  <div className="ad-full-source">
                    🏛️ {currentAd.institution_name_ar || currentAd.institution_name}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="ad-full-placeholder">
            <div className="ad-placeholder-star">✨</div>
            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#FFD700' }}>المجرة الحضارية</p>
            <p style={{ margin: '8px 0 0', fontSize: '0.9rem', opacity: 0.5 }}>"معاً نزداد توهجاً"</p>
          </div>
        )}
      </div>

      {/* Backdrop — إغلاق الربع المكبَّر بالنقر خارجه */}
      {expandedQuadrant !== null && (
        <div className="expand-backdrop" onClick={() => setExpandedQuadrant(null)} />
      )}

      {/* مودال تفاصيل العنصر */}
      {selectedItem && (
        <div className="item-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="item-modal" onClick={e => e.stopPropagation()}>
            <button className="item-modal-close" onClick={() => setSelectedItem(null)}>✕</button>
            {selectedItem.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedItem.image_url} alt={selectedItem.title} className="item-modal-img" />
            )}
            <div className="item-modal-body">
              <div className="item-modal-tag">
                {selectedItem.icon}{' '}
                {selectedItem.type === 'news' ? 'خبر' : selectedItem.type === 'event' ? 'فعالية' : 'اتفاقية'}
              </div>
              <h2 className="item-modal-title">{selectedItem.title}</h2>
              <div className="item-modal-date">
                {new Date(selectedItem.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {selectedItem.subtitle && (
                <div style={{ color: '#85C79A', marginBottom: 12, fontSize: '0.9rem' }}>{selectedItem.subtitle}</div>
              )}
              {selectedItem.content ? (
                <div className="item-modal-content">{selectedItem.content}</div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.38)', fontStyle: 'italic', fontSize: '0.9rem' }}>لا توجد تفاصيل إضافية</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* بوب-أب تفاصيل النبضة */}
      {selectedPulse && <PulseDetailPopup item={selectedPulse} onClose={() => setSelectedPulse(null)} />}
    </div>
  );
}
