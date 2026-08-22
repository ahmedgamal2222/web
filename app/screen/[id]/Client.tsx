'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { verifyScreen, screenActivate, fetchInstitution, fetchEvents, fetchNews, fetchLectures, fetchGalaxyData, checkLectureRecording, fetchAgreements, fetchPulse, updatePulse, deletePulse, screenConnect, API_BASE } from '@/lib/api';
import type { PulseItem } from '@/lib/api';
import GalaxyCanvas from '@/components/GalaxyCanvas';
import type { GalaxyData } from '@/lib/types';
import PulseDetailPopup from '@/components/PulseDetailPopup';
import { AdCreateModal } from '@/app/institutions/[id]/Client';

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

// ─── استخراج معرف فيديو YouTube من رابط embed ───────────────────────────
function extractYtVideoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
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
  const [user, setUser] = useState<any>(null);
  const [editingPulseId, setEditingPulseId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [selectedPulseId, setSelectedPulseId] = useState<number | null>(null);
  const [hoveredPulseId, setHoveredPulseId] = useState<number | null>(null);
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
  const [showScreenPlusMenu, setShowScreenPlusMenu] = useState(false);
  const [socialBarVisible, setSocialBarVisible] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [playlistIdx, setPlaylistIdx] = useState(0);
  const playlistTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytCoverRef = useRef<HTMLDivElement>(null);
  const ytCoverTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isVideoMutedRef = useRef(true);
  const ytDestroyedRef = useRef(false);
  const [ytApiReady, setYtApiReady] = useState(false);
  const [focusStarId, setFocusStarId] = useState<number | undefined>(undefined);
  const [balance, setBalance] = useState<number | null>(null);

  // مزامنة ref مع state
  useEffect(() => { isVideoMutedRef.current = isVideoMuted; }, [isVideoMuted]);

  // تحميل YouTube IFrame Player API مرة واحدة
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).YT?.Player) { setYtApiReady(true); return; }
    (window as any).onYouTubeIframeAPIReady = () => setYtApiReady(true);
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }, []);

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

    // تحميل بيانات المستخدم
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    } catch {}

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
      loadPulse();
    }, 30000);

  // نبض الشاشة كل 5 دقائق لتسجيل النشاط ومكافآت الإعلانات
  const heartbeatInterval = setInterval(() => {
    fetch(`${API_BASE}/api/screen/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_id: Number(resolvedId) }),
    }).catch(() => {});
  }, 5 * 60 * 1000);
  // Send initial heartbeat immediately
  if (Number.isFinite(Number(resolvedId))) {
    fetch(`${API_BASE}/api/screen/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_id: Number(resolvedId) }),
    }).catch(() => {});
  }

    return () => { clearInterval(pulseInterval); clearInterval(heartbeatInterval); };
  }, [authenticated, resolvedId]);

  const loadPulse = useCallback(() => {
    fetchPulse({ limit: 50 }).then(r => setPulse(r.data)).catch(() => {});
  }, []);

  // Fetch balance for institution owner
  useEffect(() => {
    if (!authenticated || !resolvedId || resolvedId === 'tv' || resolvedId === 'default') return;
    const sid = localStorage.getItem('sessionId') || '';
    fetch(`${API_BASE}/api/ads/credits/balance`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d?.success) setBalance(d.balance); })
      .catch(() => {});
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

  // ─── شريط سوشيال ميديا شفاف: يظهر/يختفي بتحريك الماوس ─────────────────
  useEffect(() => {
    let hideTimer: any;
    const show = () => { setSocialBarVisible(true); clearTimeout(hideTimer); };
    const hide = () => { hideTimer = setTimeout(() => setSocialBarVisible(false), 2000); };
    window.addEventListener('mousemove', show);
    window.addEventListener('mouseleave', hide);
    return () => {
      window.removeEventListener('mousemove', show);
      window.removeEventListener('mouseleave', hide);
      clearTimeout(hideTimer);
    };
  }, []);

  // ─── إغلاق القائمة المنسدلة عند النقر خارجها ─────────────────
  useEffect(() => {
    if (!showScreenPlusMenu) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.screen-plus-menu')) setShowScreenPlusMenu(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showScreenPlusMenu]);

  // ─── صوت المجرة — يُهيَّأ ويعمل فوراً عند أول تفاعل ─────────────────
  useEffect(() => {
  let audioUrl = '/sound/galaxy-ambient.mp3';
  let cancelled = false;

  // تحميل من API
  fetch(`${API_BASE}/api/galaxy-audio/active`)
    .then(r => r.json())
    .then(d => {
      if (!cancelled && d.success && d.data?.length > 0) {
        audioUrl = d.data[0].file_url;
      }
    })
    .catch(() => {})
    .finally(() => {
      if (cancelled) return;

      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = 0;
      audio.muted = true; // 👈 مهم جداً
      audio.preload = 'auto';

      audioRef.current = audio;

      // تشغيل صامت (يسمح به المتصفح)
      audio.play().catch(() => {});
    });

  return () => {
    cancelled = true;
    audioRef.current?.pause();
  };
}, []);
const startSpaceSound = () => {
  const audio = audioRef.current;
  if (!audio) return;

  try {
    audio.muted = false;

    // fade in ناعم 🔥
    let vol = 0;
    audio.volume = 0;

    const fade = setInterval(() => {
      vol += 0.1;
      if (vol >= 1) {
        audio.volume = 1;
        clearInterval(fade);
      } else {
        audio.volume = vol;
      }
    }, 50);

    audio.play().catch(() => {});
  } catch {}
};
const stopSpaceSound = () => {
  const audio = audioRef.current;
  if (!audio) return;

  try {
    // fade out
    let vol = audio.volume;

    const fade = setInterval(() => {
      vol -= 0.1;
      if (vol <= 0) {
        audio.volume = 0;
        audio.pause();
        clearInterval(fade);
      } else {
        audio.volume = vol;
      }
    }, 50);
  } catch {}
};
  // ─── تبديل كتم/تشغيل صوت الفيديو ────────────────────────────────────────
  const toggleVideoMute = () => {
    const newMuted = !isVideoMuted;
    setIsVideoMuted(newMuted);
    // YouTube: استخدام YT.Player API الرسمي
    if (ytPlayerRef.current) {
      try {
        if (newMuted) { ytPlayerRef.current.mute(); }
        else { ytPlayerRef.current.unMute(); ytPlayerRef.current.setVolume(100); }
      } catch {}
    }
    // Cloudflare / Vimeo: postMessage
    const iframe = lectureIframeRef.current;
    if (iframe?.contentWindow) {
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
    }
    if (videoRef.current) videoRef.current.muted = newMuted;
  };

  // ─── انتقال للفيديو التالي ────────────────────────────────────────────
  const advancePlaylist = () => {
    const entries = buildMasterPlaylist(lectures);
    if (entries.length > 1) setPlaylistIdx(prev => (prev + 1) % entries.length);
    else if (entries.length === 1) {
      // فيديو واحد: إعادة تشغيله
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.seekTo(0); ytPlayerRef.current.playVideo(); } catch {}
      }
    }
  };

  // ─── إنشاء مشغل YouTube عبر IFrame Player API الرسمي ───────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lectureIds = lectures.map((l: any) => l.id).join(',');

  useEffect(() => {
    if (!ytApiReady) return;
    if (lectures.find((l: any) => l.is_live)) return;

    const entries = buildMasterPlaylist(lectures);
    if (entries.length === 0) return;

    const idx = playlistIdx % entries.length;
    const entry = entries[idx];
    const ytId = extractYtVideoId(entry.embedUrl);
    if (!ytId) return;

    const container = ytContainerRef.current;
    if (!container) return;

    // إعادة تعيين حالة التدمير
    ytDestroyedRef.current = false;
    let advanced = false;

    // تدمير المشغل السابق
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch {}
      ytPlayerRef.current = null;
    }

    container.innerHTML = '';
    const inner = document.createElement('div');
    container.appendChild(inner);

    // إظهار غطاء يخفي مقدمة YouTube (العنوان + شعار القناة + زر التشغيل)
    // حتى البدء الفعلي للتشغيل، ثم يُخفى في onStateChange (PLAYING)
    const cover = ytCoverRef.current;
    if (cover) {
      cover.style.opacity = '1';
      cover.style.pointerEvents = 'none';
    }
    // إلغاء أي مؤقّت اخفاء سابق عند إنشاء مشغل جديد
    if (ytCoverTimerRef.current) { clearTimeout(ytCoverTimerRef.current); ytCoverTimerRef.current = undefined; }

    const advance = () => {
      // حماية من الاستدعاء المزدوج أو أثناء التدمير
      if (ytDestroyedRef.current || advanced) return;
      advanced = true;
      if (entries.length <= 1) {
        // فيديو واحد: إعادة تشغيله
        advanced = false;
        try { ytPlayerRef.current?.seekTo(0); ytPlayerRef.current?.playVideo(); } catch {}
      } else {
        setPlaylistIdx(prev => (prev + 1) % entries.length);
      }
    };

    ytPlayerRef.current = new (window as any).YT.Player(inner, {
      videoId: ytId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        showinfo: 0,
        rel: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        cc_load_policy: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (e: any) => {
          if (ytDestroyedRef.current) return;
          e.target.playVideo();
          // استعادة حالة الصوت إذا كان المستخدم فعّل الصوت سابقاً
          if (!isVideoMutedRef.current) {
            try { e.target.unMute(); e.target.setVolume(100); } catch {}
          }
        },
        onStateChange: (e: any) => {
          if (e.data === 1) {
            // بدأ التشغيل — لكن بطاقة العنوان وشعار القناة تظهر لمدة عدة ثوانٍ بعدها،
            // لذا نُبقي الغطاء معتماً لفترة ثم نخفيه بسلاسة
            if (ytCoverTimerRef.current) clearTimeout(ytCoverTimerRef.current);
            ytCoverTimerRef.current = setTimeout(() => {
              const c = ytCoverRef.current;
              if (c) c.style.opacity = '0';
              ytCoverTimerRef.current = undefined;
            }, 6500);
          } else if (e.data === 0) {
            advance(); // 0 = YT.PlayerState.ENDED
          }
        },
        onError: () => {
          // تخطي الفيديو المعطوب والانتقال للتالي
          advance();
        },
      },
    });

    return () => {
      ytDestroyedRef.current = true;
      if (ytCoverTimerRef.current) { clearTimeout(ytCoverTimerRef.current); ytCoverTimerRef.current = undefined; }
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytApiReady, playlistIdx, lectureIds]);

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
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            direction: rtl;
          }
          .auth-navbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 64px;
            background: rgba(10,10,26,0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,215,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
          }
          .auth-navbar h1 {
            color: #FFD700;
            font-size: 1.6rem;
            font-weight: 900;
            margin: 0;
            letter-spacing: 1px;
            text-shadow: 0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.2);
            animation: authGlow 3s ease-in-out infinite;
          }
          @keyframes authGlow {
            0%,100% { text-shadow: 0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.2); }
            50%      { text-shadow: 0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.35); }
          }
          .auth-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding: 20px;
            margin-top: 64px;
          }
          .auth-box {
            background: rgba(255,255,255,0.05);
            border: 2px solid #FFD700;
            border-radius: 20px;
            padding: 40px;
            width: 380px;
            text-align: center;
            box-shadow: 0 0 40px rgba(255,215,0,0.15);
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

        <div className="auth-navbar">
          <h1>✦ الشاشة الحضارية ✦</h1>
        </div>
        <div className="auth-container">
          <div className="auth-box">
            <h2>تسجيل الدخول</h2>
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
    (l.stream_type === 'recorded' || l.stream_type === 'external' || l.stream_type === 'live') &&
    (l.stream_url || l.video_url || l.cf_video_id || l.cf_live_input_id)
  ) || null;

  // تحديد نوع الفيديو الحالي
  const rawEmbed = currentVideoEntry?.embedUrl || '';
  const currentCfVideoId = rawEmbed.startsWith('__cf:') ? rawEmbed.slice(5) : null;
  // دائماً نحذف loop حتى يطلق YouTube حدث الانتهاء — الصوت يبدأ muted دائماً للتشغيل التلقائي
  const currentDisplayEmbed = (!rawEmbed.startsWith('__cf:') && rawEmbed)
    ? rawEmbed
        .replace(/&loop=1/g, '').replace(/\?loop=1&?/, '?')
        .replace(/&playlist=[a-zA-Z0-9_-]*/g, '')
    : null;

  // YouTube يُشغّل عبر YT.Player API — باقي المنصات عبر iframe
  const currentYtVideoId = currentDisplayEmbed ? extractYtVideoId(currentDisplayEmbed) : null;

  // دمج الأخبار + الفعاليات + الاتفاقيات + النبضات في تدفق موحّد مرتّب زمنياً
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
    ...pulse.map((p: any) => ({
      type: 'pulse' as const,
      id: p.id,
      date: p.pulse_date,
      title: p.content,
      content: p.content,
      image_url: p.image_url,
      icon: '💫',
      subtitle: null,
      is_featured: p.is_featured,
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
          color: white;
          padding: 12px 16px;
          font-size: 0.95rem;
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

        /* ─── شريط سوشيال ميديا شفاف ─── */
        .screen-social-bar {
          position: fixed;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 120;
          max-width: 85%;
          width: fit-content;
          background: rgba(8,5,32,0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(79,195,247,0.18);
          border-radius: 50px;
          padding: 10px 22px;
          display: flex;
          align-items: center;
          gap: 18px;
          opacity: 0;
          transition: opacity 0.5s ease, transform 0.5s ease;
          transform: translateX(-50%) translateY(20px);
          pointer-events: none;
        }
        .screen-social-bar.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }
        .screen-social-bar a {
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          font-size: 1.1rem;
          padding: 6px 10px;
          border-radius: 50%;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .screen-social-bar a:hover {
          background: rgba(255,255,255,0.12);
          transform: translateY(-2px);
        }

        /* ─── زر القائمة (+) ─── */
        .screen-plus-menu {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 120;
        }
        .screen-plus-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.6);
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(12px);
          color: #FFD700;
          font-size: 1.4rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .screen-plus-btn:hover {
          border-color: #FFD700;
          box-shadow: 0 6px 28px rgba(255,215,0,0.3);
          transform: scale(1.08);
        }
        .screen-plus-dropdown {
          position: absolute;
          top: 52px;
          left: 0;
          background: rgba(10,15,30,0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,215,0,0.3);
          border-radius: 16px;
          padding: 8px;
          min-width: 220px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .screen-plus-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #e8f4fd;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: "'Tajawal', sans-serif";
          text-align: right;
        }
        .screen-plus-dropdown button:hover {
          background: rgba(255,215,0,0.1);
          color: #FFD700;
        }

        /* ─── بث مباشر أحمر فوق الفيديو ─── */
        .q1-live-overlay {
          position: absolute;
          top: 28px;
           left: 363px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .q1-live-badge {
          background: #e03030;
          color: white;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 800;
          box-shadow: 0 2px 10px rgba(255,68,68,0.5);
          animation: livePulse 1.8s ease-in-out infinite;
        }
        .q1-live-dot {
          background: white;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        .q1-institution-name-overlay {
          
          color: #FFD700;
          padding: 5px 14px;
          font-size: 0.82rem;
          font-weight: 700;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ─── أيقونة اللوكيشن في الربع 2 ─── */
        .q2-location-btn {
          position: absolute;
          top: 12px;
           left: 56px;
          z-index: 20;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.5);
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(12px);
          color: #FFD700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .q2-location-btn:hover {
          border-color: #FFD700;
          box-shadow: 0 6px 24px rgba(255,215,0,0.35);
          transform: scale(1.1);
        }

        /* ─── علامات الإضافة (+) فوق الأرباع ─── */
        .quad-plus-btn {
          position: absolute;
          top: 12px;
          left: 56px;
          z-index: 20;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.6);
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #FFD700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .quad-plus-btn:hover {
          border-color: #FFD700;
          box-shadow: 0 4px 20px rgba(255,215,0,0.35), 0 0 30px rgba(255,215,0,0.15);
          transform: scale(1.15) rotate(90deg);
          background: rgba(255,215,0,0.15);
        }

        /* ─── شريط نبض المجرة (مثل الجزيرة) ─── */
        .pulse-ticker-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 28px;
          background: #c0392b;
          display: flex;
          align-items: center;
          z-index: 90;
          overflow: hidden;
          box-shadow: 0 -1px 8px rgba(0,0,0,0.4);
        }
        .pulse-ticker-label {
          flex-shrink: 0;
          background: #922b21;
          color: #fff;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 0 12px;
          height: 100%;
          display: flex;
          align-items: center;
          border-left: 2px solid rgba(255,255,255,0.2);
          white-space: nowrap;
          letter-spacing: 0.5px;
        }
        .pulse-ticker-track {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .pulse-ticker-scroll {
          display: flex;
          white-space: nowrap;
          animation: pulse-scroll 45s linear infinite;
        }
        .pulse-ticker-item {
          color: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0 20px;
          direction: rtl;
        }
        .pulse-ticker-sep {
          color: rgba(255,255,255,0.35);
          margin: 0 6px;
          font-size: 0.5rem;
          vertical-align: middle;
        }
        @keyframes pulse-scroll {
          0%   { transform: translateX(100%); }
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
        @keyframes livePulseRing {
          0% { box-shadow: 0 0 0 0 rgba(224, 48, 48, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(224, 48, 48, 0); }
          100% { box-shadow: 0 0 0 0 rgba(224, 48, 48, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── شريط سوشيال ميديا شفاف ─── */
        .screen-social-bar {
          position: fixed;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 120;
          max-width: 85%;
          width: fit-content;
          background: rgba(8,5,32,0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(79,195,247,0.18);
          border-radius: 50px;
          padding: 10px 22px;
          display: flex;
          align-items: center;
          gap: 18;
          opacity: 0;
          transition: opacity 0.5s ease, transform 0.5s ease;
          transform: translateX(-50%) translateY(20px);
          pointer-events: none;
        }
        .screen-social-bar.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }
        .screen-social-bar a {
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          font-size: 1.1rem;
          padding: 6px 10px;
          border-radius: 50%;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .screen-social-bar a:hover {
          background: rgba(255,255,255,0.12);
          transform: translateY(-2px);
        }

        /* ─── زر القائمة (+) ─── */
        .screen-plus-menu {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 120;
        }
        .screen-plus-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.6);
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(12px);
          color: #FFD700;
          font-size: 1.4rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .screen-plus-btn:hover {
          border-color: #FFD700;
          box-shadow: 0 6px 28px rgba(255,215,0,0.3);
          transform: scale(1.08);
        }
        .screen-plus-dropdown {
          position: absolute;
          top: 52px;
          left: 0;
          background: rgba(10,15,30,0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,215,0,0.3);
          border-radius: 16px;
          padding: 8px;
          min-width: 220px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .screen-plus-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #e8f4fd;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: "'Tajawal', sans-serif";
          text-align: right;
        }
        .screen-plus-dropdown button:hover {
          background: rgba(255,215,0,0.1);
          color: #FFD700;
        }

        /* ─── بث مباشر أحمر فوق الفيديو ─── */
        .q1-live-overlay {
          position: absolute;
          top: 12px;
           left: 56px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .q1-live-badge {
          background: #e03030;
          color: white;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 800;
          box-shadow: 0 2px 10px rgba(255,68,68,0.5);
          animation: livePulse 1.8s ease-in-out infinite;
        }
        .q1-live-dot {
          background: white;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        .q1-institution-name-overlay {
          background: rgba(0,0,0,0.75);
          color: #FFD700;
          padding: 5px 14px;
          font-size: 0.82rem;
          font-weight: 700;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @keyframes livePulse {
          0%,100% { box-shadow: 0 0 10px rgba(255,68,68,0.5); }
          50%      { box-shadow: 0 0 22px rgba(255,68,68,0.85), 0 0 40px rgba(255,68,68,0.22); }
        }

        /* ─── أيقونة اللوكيشن في الربع 2 ─── */
        .q2-location-btn {
          position: absolute;
          top: 12px;
           left: 56px;
          z-index: 20;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.5);
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(12px);
          color: #FFD700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .q2-location-btn:hover {
          border-color: #FFD700;
          box-shadow: 0 6px 24px rgba(255,215,0,0.35);
          transform: scale(1.1);
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
        .badge-live-dot-only {
          display: inline-flex; align-items: center; justify-content: center;
         border-radius: 50%;
          background: radial-gradient(circle, #ff3b3b 0%, #c62828 100%);
          box-shadow: 0 0 0 0 rgba(224, 48, 48, 0.8), 0 0 20px rgba(224, 48, 48, 0.4), 0 0 40px rgba(224, 48, 48, 0.2);
          animation: livePulseRing 2s infinite;
          pointer-events: none;
        }
        .badge-live-dot-only .badge-live-dot {
          animation: blink 1s infinite;
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
        .feed-pulse .feed-title { color: #FFD700; }
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
        .q-action-group {
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20;
          flex-shrink: 0;
        }
        .q-action-group .q-expand-btn {
          position: static !important;
          top: unset !important; left: unset !important;
        }
        .q-action-group .quad-plus-btn {
          position: static !important;
          top: unset !important; left: unset !important;
        }
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
          position: relative;
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
          gap: 12px;
          direction: rtl;
          z-index: 10;
        }
        .q1-center-group {
          display: flex; align-items: center; gap: 10px;
          flex: 1; justify-content: center;
          overflow: hidden;
        }
        .q1-title-row {
          display: flex; align-items: center; gap: 10px;
          max-width: 100%;
        }
        .q1-title-text {
          color: rgba(255,255,255,0.9);
          font-size: 0.88rem; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
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
        .q1-action-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .q1-inline-plus {
          position: static !important;
          top: unset !important; left: unset !important;
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.6);
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(12px);
          color: #FFD700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .q1-inline-plus:hover {
          border-color: #FFD700;
          box-shadow: 0 4px 20px rgba(255,215,0,0.35), 0 0 30px rgba(255,215,0,0.15);
          transform: scale(1.15) rotate(90deg);
          background: rgba(255,215,0,0.15);
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

        /* ── زر اللوكيشن عند التفعيل (التركيز على نجم المؤسسة) ── */
        .q2-location-btn.active {
          border-color: #4fc3f7;
          color: #4fc3f7;
          background: rgba(79,195,247,0.16);
          box-shadow: 0 0 0 3px rgba(79,195,247,0.22), 0 6px 24px rgba(79,195,247,0.4);
        }


      `}</style>

      {/* شريط المؤسسة */}
      {(institution?.name_ar || institution?.name || (balance !== null && Number(balance) > 0)) && (
        <div className="institution-info" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {institution?.name_ar || institution?.name ? (
            <>
              <span className="institution-name">{institution?.name_ar || institution?.name}</span>
<span style={{ fontSize: '0.85rem' }}>— الشاشة الحضارية</span>            </>
          ) : null}
          {balance !== null && Number(balance) > 0 && (
            <span style={{
              
              color: '#FFD700',
              padding: '3px 12px',
              fontSize: '0.78rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}>
              ${Number(balance).toFixed(0)}
            </span>
          )}
        </div>
      )}

      {/* الربع 1: بث المحاضرات */}
      <div className={`quadrant${expandedQuadrant === 1 ? ' expanded' : ''}${liveLecture ? ' q-live-border' : ''}`}>
        <div className="q1-layout">

          {/* ─ شريط علوي: أزرار + بادج بث دائماً عند وجود فيديو ─ */}
          <div className="q1-topbar">
            <div className="q1-action-group">
              <button
                onClick={() => setShowVideoModal(true)}
                title="مقترحات الفيديو"
                className="quad-plus-btn"
              >+</button>
              <button
                className="q-expand-btn"
                onClick={() => setExpandedQuadrant(expandedQuadrant === 1 ? null : 1)}
                title={expandedQuadrant === 1 ? 'تصغير' : 'تكبير'}
              >
                {expandedQuadrant === 1 ? '⊡' : '⊞'}
              </button>
            </div>
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
              ) : currentYtVideoId ? (
                <div className="yt-clip-wrap">
                  <div ref={ytContainerRef} style={{ width: '100%', height: '100%' }} />
                  {/* طبقة تمنع التفاعل مع واجهة يوتيوب */}
                  <div className="yt-block-overlay" />
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 64,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
                    zIndex: 16, pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
                    zIndex: 16, pointerEvents: 'none',
                  }} />
                  {/* غطاء يخفي مقدمة YouTube (عنوان الفيديو + شعار القناة + زر التشغيل)
                      ويُخفى بسلاسة فور بدء التشغيل عبر onStateChange */}
                  <div
                    ref={ytCoverRef}
                    style={{
                      position: 'absolute', inset: 0,
                      zIndex: 18,
                      background: 'radial-gradient(ellipse at center, #1a1a3a 0%, #05050f 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none',
                      transition: 'opacity 0.5s ease',
                      opacity: 1,
                    }}
                  >
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
                      <div style={{ fontSize: '2.2rem', marginBottom: 12, animation: 'adStarPulse 1.6s ease-in-out infinite' }}>✦</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, letterSpacing: '0.5px' }}>جاري التشغيل...</div>
                    </div>
                  </div>
                  {/* حجب دائم لطبقة العنوان في الأسفل-يسار (تظهر عند بداية التشغيل وأي توقّف/تكرار) */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    width: '45%', height: '82px',
                    background: 'linear-gradient(to top, rgba(5,5,15,0.93) 0%, rgba(5,5,15,0.55) 45%, transparent 100%)',
                    zIndex: 19, pointerEvents: 'none',
                  }} />
                  {/* إخفاء شعار القناة الدائم (العلامة المائية) في الزاوية السفلية اليمنى */}
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 150, height: 150,
                    background: 'radial-gradient(circle, rgba(5,5,15,0.94) 45%, rgba(5,5,15,0.4) 72%, transparent 100%)',
                    zIndex: 19, pointerEvents: 'none',
                  }} />
                </div>
              ) : currentDisplayEmbed ? (
                <div className="yt-clip-wrap">
                  <iframe
                    key={`pl-${safePlayIdx}`}
                    ref={lectureIframeRef}
                    src={currentDisplayEmbed}
                    className="lecture-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: 'none' }}
                  />
                </div>
              ) : (() => {
                const vSrc = displayLecture.stream_url || displayLecture.video_url || '';
                const isJson = vSrc.startsWith('{') || vSrc.startsWith('[');
                return isJson ? (
                  <div className="empty-state" style={{ height: '100%' }}>
                    <span style={{ fontSize: '2.5rem' }}>📺</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>جاري تحميل الفيديو...</span>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className="lecture-video"
                    src={vSrc}
                    autoPlay
                    muted={isVideoMuted}
                    loop={false}
                    controls={false}
                    onEnded={advancePlaylist}
                  />
                );
              })()
            ) : (
              <div className="empty-state">
                <span style={{ fontSize: '2.5rem' }}>📺</span>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>لا يوجد بث حالياً</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>سيبدأ البث قريباً</span>
              </div>
            )}
            {/* ─── مؤشر البث المباشر + زر تشغيل/كتم الصوت ─── */}
            {displayLecture && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 18,
                  right: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  zIndex: 30,
                }}
              >
                <span className="badge-live-dot-only" title="بث مباشر">
                  <span className="badge-live-dot" />
                </span>
                <button
                  className={`volume-toggle${!isVideoMuted ? ' vol-on' : ''}`}
                  onClick={toggleVideoMute}
                  title={isVideoMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                  style={{ position: 'static' }}
                >
                  <span className="vol-icon">{isVideoMuted ? '🔇' : '🔊'}</span>
                  {!isVideoMuted ? (
                    <span className="vol-bars" aria-hidden="true">
                      <span className="vol-bar" />
                      <span className="vol-bar" />
                      <span className="vol-bar" />
                      <span className="vol-bar" />
                    </span>
                  ) : null}
                </button>
              </div>
            )}
          </div>

          {/* ─ شريط معلومات سفلي ─ */}
          {displayLecture && (
            <div className="q1-info-bar">
              <div className="q1-title">{displayLecture.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
        <button
          className={`q2-location-btn${focusStarId !== undefined ? ' active' : ''}`}
          onClick={() => {
            const id = Number(resolvedId);
            setFocusStarId(prev => prev === id ? undefined : id);
          }}
          title={focusStarId !== undefined ? 'استعادة الوضع الأصلي' : 'الذهاب إلى موقع المؤسسة في المجرة'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>
        <div className="q-header">✦ موقع المؤسسة في المجرة ✦</div>
        {/* <style jsx global>{`
          @keyframes galaxyBtnPulse {
            0%,100% { box-shadow: 0 6px 32px 0 rgba(255,215,0,0.25), 0 1.5px 0 0 #fff inset; transform: scale(1); }
            50%      { box-shadow: 0 0 60px 10px rgba(255,215,0,0.45), 0 1.5px 0 0 #fff inset; transform: scale(1.07); }
          }
          .galaxy-sound-btn:hover {
            background: linear-gradient(90deg, #FFB300 0%, #FFD700 100%);
            color: #0a0a1a;
            transform: scale(1.08);
            box-shadow: 0 8px 40px 0 rgba(255,215,0,0.35), 0 1.5px 0 0 #fff inset;
          }
          .galaxy-sound-btn:active {
            transform: scale(0.97);
          }
        `}</style> */}
        <div className="galaxy-view" style={{position: 'relative', width: '100%', height: '100%'}}>
          {/* <button
            className="galaxy-sound-btn"
            onClick={startSpaceSound}
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              zIndex: 50,
              background: 'linear-gradient(90deg, #FFD700 0%, #FFB300 100%)',
              color: '#0a0a1a',
              border: 'none',
              borderRadius: 40,
              padding: '16px 38px',
              fontSize: '1.25rem',
              fontWeight: 900,
              boxShadow: '0 6px 32px 0 rgba(255,215,0,0.25), 0 1.5px 0 0 #fff inset',
              cursor: 'pointer',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              transition: 'transform 0.18s, box-shadow 0.18s',
              outline: 'none',
              animation: 'galaxyBtnPulse 2.5s infinite',
            }}
            title="تشغيل صوت المجرة"
          >
            <span style={{ fontSize: '1.5em', marginRight: 10 }}>🔊</span>
            تشغيل صوت المجرة
          </button> */}
          {galaxyData ? (
            <GalaxyCanvas
              data={galaxyData}
              autoRotate={true}
              backgroundStarsCount={15000}
              highlightStarId={Number(resolvedId)}
              focusStarId={focusStarId}
            />
          ) : (
            <>
              <div className="highlighted-star" />
              <div className="star-label">{institution?.name_ar || institution?.name}</div>
            </>
          )}
        </div>
      </div>

      {/* الربع 3: نبض المجرة — التدفق المدمج */}
      <div className={`quadrant${expandedQuadrant === 3 ? ' expanded' : ''}`}>
        <button className="q-expand-btn" onClick={() => setExpandedQuadrant(expandedQuadrant === 3 ? null : 3)} title={expandedQuadrant === 3 ? 'تصغير' : 'تكبير'}>
          {expandedQuadrant === 3 ? '⊡' : '⊞'}
        </button>
        <button
          onClick={() => setShowTweetModal(true)}
          title="إضافة تغريدة"
          className="quad-plus-btn"
        >+</button>
        <div className="q-header">💫 نبض المجرة</div>
        <div className="pulse-list">
          {combinedFeed.length > 0 ? combinedFeed.map((item) => {
            const isPulse = item.type === 'pulse';
            const isAdminUser = user?.role === 'admin';
            const canEdit = isPulse && (isAdminUser || item.application_user_id === user?.id);
            const isEditing = editingPulseId === item.id;
            const showActions = canEdit && (selectedPulseId === item.id || hoveredPulseId === item.id);

            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`feed-item feed-${item.type}`}
                style={{ cursor: canEdit ? 'pointer' : 'default', position: 'relative' }}
                onClick={() => canEdit && setSelectedPulseId(prev => prev === item.id ? null : item.id)}
                onMouseEnter={() => canEdit && setHoveredPulseId(item.id)}
                onMouseLeave={() => setHoveredPulseId(null)}
              >
                {isEditing ? (
                  <div style={{ padding: '8px 6px', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
                    <textarea
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button onClick={async (e) => { e.stopPropagation(); try { await updatePulse(item.id, { content: editingText }); setEditingPulseId(null); setSelectedPulseId(null); loadPulse(); } catch (err) { console.error('Failed to update pulse:', err); } }} style={{ padding: '4px 14px', borderRadius: 6, border: 'none', background: '#4E8D9C', color: 'white', fontSize: '0.78rem', cursor: 'pointer' }}>💾 حفظ</button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingPulseId(null); }} style={{ padding: '4px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#aaa', fontSize: '0.78rem', cursor: 'pointer' }}>إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="feed-top">
                      <span className="feed-icon">{item.icon}</span>
                      <span className="feed-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{item.title}</span>
                      {item.subtitle && <span className="feed-subtitle" style={{ fontSize: '0.78rem', color: '#FFD700', opacity: 0.8 }}>{item.subtitle}</span>}
                      {Number(item.is_featured) === 1 && <span style={{ fontSize: '0.7rem', color: '#FFD700' }}>⭐</span>}
                    </div>
                    {showActions && (
                      <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', gap: 4, zIndex: 5, animation: 'fadeIn 0.2s ease' }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingPulseId(item.id); setEditingText(item.content); }} style={{ background: 'rgba(78,141,156,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(78,141,156,0.4)', borderRadius: 8, color: '#4E8D9C', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>✏️</button>
                        <button onClick={async (e) => { e.stopPropagation(); if (!confirm('حذف هذا العنصر؟')) return; try { const ok = await deletePulse(item.id); if (ok) { setPulse(pulse.filter(p => p.id !== item.id)); setSelectedPulseId(null); } } catch (err) { console.error('Failed to delete pulse:', err); } }} style={{ background: 'rgba(239,68,68,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>🗑️</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <span style={{ fontSize: '2.5rem' }}>💗</span>
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>لا توجد أنشطة حتى الآن</span>
              <span style={{ fontSize: '0.85rem', opacity: 0.45 }}>ستظهر الأخبار والفعاليات والنبضات هنا</span>
            </div>
          )}
        </div>
      </div>

      {/* الربع 4: إعلانات — عرض إعلان واحد في كل مرة */}
      <div className={`quadrant${expandedQuadrant === 4 ? ' expanded' : ''}`}>
        <button className="q-expand-btn" onClick={() => setExpandedQuadrant(expandedQuadrant === 4 ? null : 4)} title={expandedQuadrant === 4 ? 'تصغير' : 'تكبير'}>
          {expandedQuadrant === 4 ? '⊡' : '⊞'}
        </button>
        <button
          onClick={() => setShowAdModal(true)}
          title="إنشاء إعلان"
          className="quad-plus-btn"
        >+</button>
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

      {/* شريط نبض المجرة — مثل شريط الأخبار */}
      {pulse.length > 0 && (
        <div className="pulse-ticker-bar">
          <div className="pulse-ticker-label">⚡ نبض المجرة</div>
          <div className="pulse-ticker-track">
            <div className="pulse-ticker-scroll">
              {pulse.map((item, i) => (
                <span key={item.id} className="pulse-ticker-item">
                  {item.content}
                  <span className="pulse-ticker-sep">◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* مودال مقترح فيديو */}
      {showVideoModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowVideoModal(false)}>
          <div style={{ background: '#0f1626', borderRadius: 20, padding: 28, maxWidth: 520, width: '100%', border: '1px solid rgba(255,215,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 18px', color: '#FFD700', fontSize: '1.1rem', fontWeight: 800 }}>🎥 مقترح فيديو جديد</h3>
            <VideoProposalForm institutionId={resolvedId} onClose={() => setShowVideoModal(false)} onSuccess={() => { setShowVideoModal(false); alert('تم إرسال المقترح بنجاح وسيتم مراجعته'); }} />
          </div>
        </div>
      )}

      {/* مودال تغريدة */}
      {showTweetModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowTweetModal(false)}>
          <div style={{ background: '#0f1626', borderRadius: 20, padding: 28, maxWidth: 520, width: '100%', border: '1px solid rgba(255,215,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 18px', color: '#FFD700', fontSize: '1.1rem', fontWeight: 800 }}>🐦 تغريدة جديدة</h3>
            <TweetForm institutionId={resolvedId} onClose={() => setShowTweetModal(false)} onSuccess={() => { setShowTweetModal(false); alert('تم نشر التغريدة بنجاح'); }} />
          </div>
        </div>
      )}

      {/* مودال إنشاء إعلان */}
      {showAdModal && (
        <AdCreateModal institutionId={resolvedId} onClose={() => setShowAdModal(false)} onSuccess={() => { setShowAdModal(false); }} />
      )}
    </div>
  );
}

// ── نموذج مقترح فيديو ─────────────────────────────────────────
function VideoProposalForm({ institutionId, onClose, onSuccess }: { institutionId: string; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
      const res = await fetch(`${API_BASE}/api/video-proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify({ institution_id: Number(institutionId), title, description, video_url: videoUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'فشل إرسال المقترح');
      onSuccess();
    } catch (ex: any) {
      alert(ex.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الفيديو" required style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.04)', color: '#e8f4fd', fontSize: '0.9rem', outline: 'none' }} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف الفيديو" rows={3} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.04)', color: '#e8f4fd', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
      <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="رابط الفيديو (YouTube/Vimeo/Cloudflare)" required style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.04)', color: '#e8f4fd', fontSize: '0.9rem', outline: 'none' }} />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,215,0,0.3)', background: 'transparent', color: '#8aa4bc', cursor: 'pointer', fontSize: '0.85rem' }}>إلغاء</button>
        <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#0a0a1a', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>{submitting ? 'جاري الإرسال...' : 'إرسال المقترح'}</button>
      </div>
    </form>
  );
}

// ── نموذج تغريدة ─────────────────────────────────────────────
function TweetForm({ institutionId, onClose, onSuccess }: { institutionId: string; onClose: () => void; onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length > 500) { alert('الحد الأقصى 500 حرف'); return; }
    setSubmitting(true);
    try {
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
      const res = await fetch(`${API_BASE}/api/pulse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify({ content, category: 'tweet', institution_id: Number(institutionId) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'فشل نشر التغريدة');
      onSuccess();
    } catch (ex: any) {
      alert(ex.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="ماذا يحدث في مؤسستكم؟" rows={4} required maxLength={500} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.04)', color: '#e8f4fd', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#8aa4bc' }}>{content.length}/500</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,215,0,0.3)', background: 'transparent', color: '#8aa4bc', cursor: 'pointer', fontSize: '0.85rem' }}>إلغاء</button>
          <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#0a0a1a', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>{submitting ? 'جاري النشر...' : 'نشر'}</button>
        </div>
      </div>
    </form>
  );
}
