'use client';

import { useEffect, useState, useRef } from 'react';
import { verifyScreen, screenActivate, fetchInstitution, fetchEvents, fetchNews, fetchLectures, fetchGalaxyData, checkLectureRecording, fetchAgreements, API_BASE } from '@/lib/api';
import GalaxyCanvas from '@/components/GalaxyCanvas';
import type { GalaxyData } from '@/lib/types';

// ─── External Video URL Parser ───────────────────────────────────────────────
function parseExternalVideoUrl(url: string): { embedUrl: string; platform: 'youtube' | 'vimeo' | 'dailymotion' } | null {
  if (!url) return null;
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1`, platform: 'youtube' };
  const vm = u.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vm) return { embedUrl: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1`, platform: 'vimeo' };
  const dm = u.match(/(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dm) return { embedUrl: `https://www.dailymotion.com/embed/video/${dm[1]}?autoplay=1&mute=1`, platform: 'dailymotion' };
  // Already an embed URL
  if (u.includes('youtube.com/embed/')) return { embedUrl: u, platform: 'youtube' };
  if (u.includes('player.vimeo.com/video/')) return { embedUrl: u, platform: 'vimeo' };
  if (u.includes('dailymotion.com/embed/video/')) return { embedUrl: u, platform: 'dailymotion' };
  return null;
}

export default function ScreenPage() {
  const institutionId = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
    : 'default';

  const [institution, setInstitution] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [allAds, setAllAds] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const adIntervalRef = useRef<NodeJS.Timeout>();

  // تخطي المصادقة للأدمن تلقائياً
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') !== 'true') return;
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const userData = JSON.parse(userStr);
      if (userData.role !== 'admin') return;
    } catch {
      return;
    }
    // الأدمن: تحميل المؤسسة وتفعيل الشاشة مباشرة
    fetchInstitution(institutionId)
      .then((inst) => {
        setInstitution(inst);
        return screenActivate(Number(institutionId), true);
      })
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(true));
  }, [institutionId]);

  // التحقق من كلمة المرور
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
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

    const deactivate = () => {
      // keepalive يضمن إرسال الطلب حتى عند إغلاق الصفحة
      fetch(`${API_BASE}/api/screen/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: Number(institutionId), active: false }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', deactivate);
    return () => {
      window.removeEventListener('beforeunload', deactivate);
      // إلغاء التنشيط أيضاً عند إزالة المكوّن (navigation داخلي)
      screenActivate(Number(institutionId), false).catch(() => {});
    };
  }, [authenticated, institutionId]);

  // تحميل البيانات
  useEffect(() => {
    if (!authenticated) return;

    const loadData = async () => {
      try {
        setDataLoading(true);
        const [eventsData, newsData, lecturesData, galaxyDataResult, agreementsResult] = await Promise.all([
          fetchEvents(institutionId),
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
      } catch (err) {
        console.error('Error loading screen data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [authenticated, institutionId]);

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
        }, 10000);
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

  const liveLecture = lectures.find(l => l.is_live);
  // أحدث محاضرة مسجّلة أو خارجية إذا لم يكن هناك بث مباشر (تشمل المحاضرات ذات cf_video_id أو cf_live_input_id)
  const recentRecorded = !liveLecture
    ? lectures.find(l => (l.stream_type === 'recorded' || l.stream_type === 'external') && (l.stream_url || l.video_url || l.cf_video_id || l.cf_live_input_id))
    : null;
  const displayLecture = liveLecture || recentRecorded;
  // كشف رابط خارجي (YouTube/Vimeo/Dailymotion) في stream_url
  const externalEmbed = displayLecture?.stream_url ? parseExternalVideoUrl(displayLecture.stream_url) : null;

  // دمج الأخبار + الفعاليات + الاتفاقيات في تدفق موحّد مرتّب زمنياً
  const combinedFeed = [
    ...news.map((n: any) => ({
      type: 'news' as const,
      date: n.published_at,
      title: n.title,
      icon: '📰',
      subtitle: null,
    })),
    ...events.map((e: any) => ({
      type: 'event' as const,
      date: e.start_datetime || e.created_at,
      title: e.title,
      icon: '📅',
      subtitle: e.start_datetime
        ? new Date(e.start_datetime).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
        : null,
    })),
    ...agreements.map((a: any) => ({
      type: 'agreement' as const,
      date: a.signed_at || a.start_date || a.created_at,
      title: a.title || 'اتفاقية',
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
          font-family: 'Arial', sans-serif;
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
          border: 1px solid #FFD700;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .q-header {
          position: absolute;
          top: 10px; right: 10px;
          background: rgba(255,215,0,0.9);
          color: #0a0a1a;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 10;
          font-size: 0.85rem;
        }
        /* ربع الفيديو */
        .lecture-video { width: 100%; height: 100%; object-fit: cover; }
        .lecture-info {
          position: absolute;
          bottom: 10px; left: 10px; right: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.9rem;
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
          margin-top: 16px;
          color: white;
          background: rgba(0,0,0,0.7);
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #FFD700;
          white-space: nowrap;
          font-size: 0.95rem;
        }
        /* ربع الأخبار */
        .news-list {
          height: calc(100% - 50px);
          overflow-y: auto;
          padding: 48px 15px 10px 15px;
          color: white;
          direction: rtl;
        }
        .news-list::-webkit-scrollbar { width: 4px; }
        .news-list::-webkit-scrollbar-thumb { background: #FFD70040; border-radius: 4px; }
        .news-list-item {
          padding: 10px;
          border-bottom: 1px solid rgba(255,215,0,0.2);
          margin-bottom: 5px;
        }
        .news-date { font-size: 0.75rem; color: #FFD700; opacity: 0.7; margin-bottom: 4px; }
        .news-ticker {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 50px;
          background: rgba(0,0,0,0.85);
          display: flex; align-items: center;
          overflow: hidden;
        }
        .news-items {
          display: flex;
          animation: ticker 40s linear infinite;
          white-space: nowrap;
        }
        .news-item { padding: 0 30px; color: #FFD700; font-size: 1rem; }
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        /* ربع الإعلانات */
        .ad-content {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          color: white; text-align: center;
          padding: 20px; box-sizing: border-box;
          direction: rtl;
        }
        .ad-image {
          max-width: 80%; max-height: 55%;
          object-fit: contain; margin-bottom: 20px;
          border-radius: 8px;
        }
        .ad-title { font-size: 1.4rem; color: #FFD700; margin-bottom: 10px; }
        /* الشريط العلوي */
        .institution-info {
          position: fixed;
          top: 10px; right: 10px;
          background: rgba(0,0,0,0.75);
          color: white;
          padding: 8px 20px;
          border-radius: 30px;
          border: 1px solid #FFD700;
          z-index: 100;
          font-size: 0.9rem;
          direction: rtl;
        }
        .institution-name { color: #FFD700; font-weight: bold; }
        /* مؤشر الحالة */
        .screen-status {
          position: fixed;
          bottom: 10px; right: 10px;
          color: #32CD32;
          font-size: 0.85rem;
          z-index: 100;
          direction: rtl;
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
          display: inline-flex; align-items: center; gap: 5px;
          background: #ff4444; color: white;
          padding: 4px 12px; border-radius: 20px;
          font-size: 0.78rem; font-weight: 700;
          animation: none;
        }
        .badge-live-dot {
          width: 7px; height: 7px; background: white;
          border-radius: 50%; animation: blink 1s infinite;
        }
        .badge-recorded {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(78,141,156,0.9); color: white;
          padding: 4px 12px; border-radius: 20px;
          font-size: 0.78rem; font-weight: 600;
        }
        .viewer-count {
          position: absolute; top: 44px; left: 10px;
          background: rgba(0,0,0,0.6); color: white;
          padding: 3px 10px; border-radius: 20px;
          font-size: 0.75rem; z-index: 10;
        }
        .empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; color: rgba(255,255,255,0.5);
          font-size: 0.95rem; gap: 8px;
        }
        /* ربع الإعلانات - قائمة */
        .ads-list {
          height: calc(100% - 50px);
          overflow-y: auto;
          padding: 48px 10px 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          direction: rtl;
        }
        .ads-list::-webkit-scrollbar { width: 4px; }
        .ads-list::-webkit-scrollbar-thumb { background: #FFD70040; border-radius: 4px; }
        .ad-list-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,215,0,0.15);
          border-radius: 10px;
          padding: 10px;
          transition: border-color 0.3s;
        }
        .ad-list-item.ad-active {
          border-color: rgba(255,215,0,0.6);
          background: rgba(255,215,0,0.06);
        }
        .ad-list-image {
          width: 70px;
          height: 55px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .ad-list-body {
          flex: 1;
          min-width: 0;
          color: white;
        }
        .ad-list-title {
          font-size: 0.88rem;
          font-weight: bold;
          color: #FFD700;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ad-list-content {
          font-size: 0.75rem;
          opacity: 0.7;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ad-list-source {
          font-size: 0.68rem;
          opacity: 0.45;
          margin-top: 4px;
        }
        /* عناصر الخبر في التدفق المدمج */
        .feed-item {
          padding: 10px;
          border-bottom: 1px solid rgba(255,215,0,0.15);
          margin-bottom: 4px;
        }
        .feed-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }
        .feed-icon { font-size: 0.85rem; }
        .feed-title { font-size: 0.9rem; color: white; }
        .feed-subtitle {
          font-size: 0.75rem;
          color: #FFD700;
          opacity: 0.8;
          margin-top: 2px;
        }
        .feed-event .feed-title { color: #87CEEB; }
        .feed-agreement .feed-title { color: #90EE90; }
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
      <div className="quadrant">
        <div className="q-header">
          {liveLecture ? (
            <span className="badge-live"><span className="badge-live-dot" />LIVE</span>
          ) : recentRecorded ? (
            recentRecorded.stream_type === 'external' || parseExternalVideoUrl(recentRecorded.stream_url || '') ? (
              <span className="badge-recorded">🎥 خارجي</span>
            ) : (
              <span className="badge-recorded">🎬 مسجّل</span>
            )
          ) : (
            '✦ بث مباشر ✦'
          )}
        </div>

        {displayLecture ? (
          <>
            {liveLecture && displayLecture.cf_live_input_id ? (
              /* بث مباشر عبر CF Live Input */
              <iframe
                src={`https://iframe.cloudflarestream.com/${displayLecture.cf_live_input_id}?autoplay=true&muted=true`}
                className="lecture-video"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                style={{ border: 'none', width: '100%', height: '100%' }}
              />
            ) : displayLecture.cf_video_id ? (
              /* فيديو مسجّل محفوظ على CF Stream */
              <iframe
                src={`https://iframe.cloudflarestream.com/${displayLecture.cf_video_id}?autoplay=true&muted=false&loop=true`}
                className="lecture-video"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                style={{ border: 'none', width: '100%', height: '100%' }}
              />
            ) : displayLecture.cf_live_input_id && !displayLecture.cf_video_id && !liveLecture ? (
              /* التسجيل قيد المعالجة على Cloudflare */
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: 'rgba(255,255,255,0.6)', gap: 12 }}>
                <div style={{ fontSize: '2.5rem' }}>⏳</div>
                <div style={{ fontSize: '0.95rem', textAlign: 'center', padding: '0 20px' }}>جاري معالجة التسجيل على Cloudflare Stream</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.5 }}>سيظهر الفيديو تلقائياً خلال دقائق</div>
              </div>
            ) : externalEmbed ? (
              /* فيديو خارجي (YouTube / Vimeo / Dailymotion) */
              <iframe
                src={externalEmbed.embedUrl}
                className="lecture-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none', width: '100%', height: '100%' }}
              />
            ) : (
              /* Fallback: native video element for direct HLS/MP4 URLs */
              <video
                ref={videoRef}
                className="lecture-video"
                src={displayLecture.stream_url || displayLecture.video_url}
                autoPlay
                muted={!!liveLecture}
                loop={!liveLecture}
                controls={!liveLecture}
              />
            )}
            {liveLecture?.viewer_count !== undefined && liveLecture.viewer_count > 0 && (
              <div className="viewer-count">👁️ {liveLecture.viewer_count} مشاهد</div>
            )}
            <div className="lecture-info">
              <strong>{displayLecture.title}</strong>
              {liveLecture && displayLecture.started_at && (
                <span style={{ fontSize: '0.78rem', opacity: 0.7, marginRight: 8 }}>
                  بدأ: {new Date(displayLecture.started_at).toLocaleTimeString('ar-EG')}
                </span>
              )}
              {recentRecorded && (
                <span style={{ fontSize: '0.78rem', opacity: 0.6, marginRight: 8 }}>محاضرة مسجّلة</span>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ paddingTop: 40 }}>
            <span className="empty-icon">📺</span>
            <span>لا يوجد بث حالياً</span>
            <span style={{ fontSize: '0.8rem' }}>سيبدأ البث قريباً</span>
          </div>
        )}
      </div>

      {/* الربع 2: المجرة مع إبراز المؤسسة */}
      <div className="quadrant">
        <div className="q-header">✦ موقع المؤسسة في المجرة ✦</div>
        {galaxyData ? (
          <GalaxyCanvas
            data={galaxyData}
            autoRotate={true}
            backgroundStarsCount={15000}
            highlightStarId={Number(institutionId)}
          />
        ) : (
          <div className="galaxy-view">
            <div className="highlighted-star" />
            <div className="star-label">{institution?.name_ar || institution?.name}</div>
          </div>
        )}
      </div>

      {/* الربع 3: الأخبار + الفعاليات + الاتفاقيات */}
      <div className="quadrant">
        <div className="q-header">✦ أخبار المجرة ✦</div>
        <div className="news-list">
          {combinedFeed.length > 0 ? combinedFeed.map((item, i) => (
            <div key={i} className={`news-list-item feed-item feed-${item.type}`}>
              <div className="feed-top">
                <span className="feed-icon">{item.icon}</span>
                <span className="news-date">
                  {new Date(item.date).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <div className="feed-title">{item.title}</div>
              {item.subtitle && (
                <div className="feed-subtitle">{item.subtitle}</div>
              )}
            </div>
          )) : (
            <div className="empty-state">
              <span className="empty-icon">📰</span>
              <span>لا توجد أخبار حالياً</span>
            </div>
          )}
        </div>
        {tickerItems.length > 0 && (
          <div className="news-ticker">
            <div className="news-items">
              {tickerItems.map((item: any, i: number) => (
                <span key={i} className="news-item">
                  {(item as any).icon ?? '✦'} {item.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* الربع 4: إعلانات (جميع الإعلانات) */}
      <div className="quadrant">
        <div className="q-header">✦ إعلانات ✦</div>
        <div className="ads-list">
          {allAds.length > 0 ? allAds.map((ad: any, i: number) => (
            <div key={i} className={`ad-list-item${currentAd?.id === ad.id ? ' ad-active' : ''}`}>
              {ad.image_url && (
                <img src={ad.image_url} alt={ad.title} className="ad-list-image" />
              )}
              <div className="ad-list-body">
                <div className="ad-list-title">{ad.title}</div>
                {ad.content && (
                  <div className="ad-list-content">{ad.content}</div>
                )}
                {ad.institution_name_ar || ad.institution_name ? (
                  <div className="ad-list-source">
                    {ad.institution_name_ar || ad.institution_name}
                  </div>
                ) : null}
              </div>
            </div>
          )) : (
            <div className="ad-content">
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>✨</div>
              <p style={{ margin: 0, fontSize: '1.2rem' }}>المجرة الحضارية</p>
              <p style={{ margin: '8px 0 0', fontSize: '0.9rem', opacity: 0.6 }}>"معاً نزداد توهجاً"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
