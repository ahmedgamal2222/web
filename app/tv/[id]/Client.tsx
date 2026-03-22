'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchInstitution, fetchEvents, fetchNews, fetchLectures, API_BASE } from '@/lib/api';

export default function CulturalScreenPage() {
  const institutionId = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
    : 'default';
  
  const [institution, setInstitution] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const adIntervalRef = useRef<NodeJS.Timeout>();

  // التحقق من كلمة المرور
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/api/institutions/${institutionId}/verify-screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        setAuthenticated(true);
        // تفعيل الشاشة
        await fetch(`${API_BASE}/api/institutions/${institutionId}/screen-active`, {
          method: 'POST'
        });
      } else {
        alert('كلمة المرور غير صحيحة');
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  // تحميل البيانات
  useEffect(() => {
    if (!authenticated) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // تحميل بيانات المؤسسة
        const instData = await fetchInstitution(institutionId);
        setInstitution(instData);
        
        // تحميل الفعاليات
        const eventsData = await fetchEvents(institutionId);
        setEvents(eventsData);
        
        // تحميل الأخبار
        const newsData = await fetchNews();
        setNews(newsData);
        
        // تحميل المحاضرات
        const lecturesData = await fetchLectures();
        setLectures(lecturesData);
        
      } catch (error) {
        console.error('Error loading screen data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // تحديث البيانات كل دقيقة
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [authenticated, institutionId]);

  // تدوير الإعلانات
  useEffect(() => {
    if (!authenticated) return;

    const fetchAds = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/ads`);
        const ads = await response.json();
        
        if (ads.length > 0) {
          let index = 0;
          setCurrentAd(ads[0]);
          
          adIntervalRef.current = setInterval(() => {
            index = (index + 1) % ads.length;
            setCurrentAd(ads[index]);
          }, 10000); // تغيير الإعلان كل 10 ثوان
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };

    fetchAds();

    return () => {
      if (adIntervalRef.current) {
        clearInterval(adIntervalRef.current);
      }
    };
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="screen-auth">
        <style jsx>{`
          .screen-auth {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #0a0a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
          }
          
          .auth-box {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid #FFD700;
            border-radius: 20px;
            padding: 40px;
            width: 400px;
            text-align: center;
          }
          
          h2 {
            color: #FFD700;
            margin-bottom: 20px;
          }
          
          input {
            width: 100%;
            padding: 12px;
            margin: 20px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 8px;
            color: white;
            font-size: 1.2rem;
            text-align: center;
            letter-spacing: 4px;
          }
          
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
          }
        `}</style>
        
        <div className="auth-box">
          <h2>✦ الشاشة الحضارية ✦</h2>
          <p>أدخل رمز المرور الخاص بالمؤسسة</p>
          
          <form onSubmit={handleAuthenticate}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="****"
              maxLength={6}
              autoFocus
            />
            <button type="submit">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen-loading">
        <style jsx>{`
          .screen-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #0a0a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
          }
        `}</style>
        <div>جاري تحميل الشاشة الحضارية...</div>
      </div>
    );
  }

  return (
    <div className="cultural-screen">
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #000;
          font-family: 'Arial', sans-serif;
        }
        
        .cultural-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 4px;
          background: #000;
          padding: 4px;
          box-sizing: border-box;
        }
        
        /* الربع الأول: بث المحاضرات */
        .lecture-quadrant {
          background: #0a0a1a;
          border: 1px solid #FFD700;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        
        .lecture-header {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 215, 0, 0.9);
          color: #0a0a1a;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 10;
        }
        
        .lecture-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .lecture-info {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px;
          border-radius: 8px;
        }
        
        /* الربع الثاني: عرض المجرة مع إبراز المؤسسة */
        .galaxy-quadrant {
          background: #0a0a1a;
          border: 1px solid #FFD700;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        
        .galaxy-view {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, #1a1a2a 0%, #0a0a1a 100%);
          position: relative;
        }
        
        .highlighted-star {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 30px;
          height: 30px;
          background: #FFD700;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 40px #FFD700;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 40px #FFD700; }
          50% { box-shadow: 0 0 80px #FFD700; }
          100% { box-shadow: 0 0 40px #FFD700; }
        }
        
        .star-label {
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          background: rgba(0,0,0,0.7);
          padding: 5px 10px;
          border-radius: 20px;
          white-space: nowrap;
          border: 1px solid #FFD700;
        }
        
        /* الربع الثالث: حائط الأخبار */
        .news-quadrant {
          background: #0a0a1a;
          border: 1px solid #FFD700;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        
        .news-header {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 215, 0, 0.9);
          color: #0a0a1a;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 10;
        }
        
        .news-ticker {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        
        .news-items {
          display: flex;
          animation: ticker 30s linear infinite;
          white-space: nowrap;
        }
        
        .news-item {
          padding: 0 30px;
          color: #FFD700;
          font-size: 1.2rem;
        }
        
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .news-list {
          height: calc(100% - 50px);
          overflow-y: auto;
          padding: 50px 15px 15px 15px;
          color: white;
        }
        
        .news-list-item {
          padding: 10px;
          border-bottom: 1px solid rgba(255, 215, 0, 0.2);
          margin-bottom: 5px;
        }
        
        .news-date {
          font-size: 0.8rem;
          color: #FFD700;
          opacity: 0.7;
        }
        
        /* الربع الرابع: إعلانات */
        .ads-quadrant {
          background: #0a0a1a;
          border: 1px solid #FFD700;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        
        .ads-header {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 215, 0, 0.9);
          color: #0a0a1a;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          z-index: 10;
        }
        
        .ad-content {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          text-align: center;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .ad-image {
          max-width: 80%;
          max-height: 60%;
          object-fit: contain;
          margin-bottom: 20px;
          border-radius: 8px;
        }
        
        .ad-title {
          font-size: 1.5rem;
          color: #FFD700;
          margin-bottom: 10px;
        }
        
        /* معلومات المؤسسة */
        .institution-info {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 10px 20px;
          border-radius: 30px;
          border: 1px solid #FFD700;
          z-index: 100;
        }
        
        .institution-name {
          color: #FFD700;
          font-weight: bold;
        }
        
        /* الحالة */
        .screen-status {
          position: fixed;
          bottom: 10px;
          right: 10px;
          color: #32CD32;
          font-size: 0.9rem;
          z-index: 100;
        }
        
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          background: #32CD32;
          border-radius: 50%;
          margin-right: 5px;
          animation: blink 2s infinite;
        }
        
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* معلومات المؤسسة */}
      <div className="institution-info">
        <span className="institution-name">{institution?.name}</span> - الشاشة الحضارية
      </div>

      <div className="screen-status">
        <span className="status-dot" /> البث المباشر - نشط
      </div>

      {/* الربع الأول: بث المحاضرات */}
      <div className="lecture-quadrant">
        <div className="lecture-header">✦ بث مباشر ✦</div>
        {lectures.filter(l => l.is_live).length > 0 ? (
          <>
            <video
              ref={videoRef}
              className="lecture-video"
              src={lectures.find(l => l.is_live)?.video_url}
              autoPlay
              muted
              loop
            />
            <div className="lecture-info">
              <strong>{lectures.find(l => l.is_live)?.title}</strong>
            </div>
          </>
        ) : (
          <div className="ad-content">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📺</div>
            <p>لا يوجد بث مباشر حالياً</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>سيبدأ البث قريباً</p>
          </div>
        )}
      </div>

      {/* الربع الثاني: عرض المجرة مع إبراز المؤسسة */}
      <div className="galaxy-quadrant">
        <div className="galaxy-view">
          <div className="highlighted-star" />
          <div className="star-label">
            {institution?.name}
          </div>
        </div>
      </div>

      {/* الربع الثالث: حائط الأخبار */}
      <div className="news-quadrant">
        <div className="news-header">✦ أخبار المجرة ✦</div>
        
        <div className="news-list">
          {news.slice(0, 5).map((item, index) => (
            <div key={index} className="news-list-item">
              <div className="news-date">{new Date(item.published_at).toLocaleDateString('ar-EG')}</div>
              <div>{item.title}</div>
            </div>
          ))}
        </div>
        
        <div className="news-ticker">
          <div className="news-items">
            {news.map((item, index) => (
              <div key={index} className="news-item">
                {item.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* الربع الرابع: إعلانات */}
      <div className="ads-quadrant">
        <div className="ads-header">✦ إعلان ✦</div>
        
        {currentAd ? (
          <div className="ad-content">
            {currentAd.image_url && (
              <img src={currentAd.image_url} alt={currentAd.title} className="ad-image" />
            )}
            <div className="ad-title">{currentAd.title}</div>
            <p>{currentAd.content}</p>
          </div>
        ) : (
          <div className="ad-content">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✨</div>
            <p>المجرة الحضارية</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>"معاً نزداد توهجاً"</p>
          </div>
        )}
      </div>
    </div>
  );
}
