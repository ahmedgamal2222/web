'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface DashboardStats {
  total_institutions: number;
  pending_requests: number;
  total_users: number;
  active_screens: number;
  total_agreements: number;
  total_services: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_institutions: 0,
    pending_requests: 0,
    total_users: 0,
    active_screens: 0,
    total_agreements: 0,
    total_services: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentUsers, setRecentUsers]       = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);

  useEffect(() => {
    // التحقق من تسجيل الدخول وصلاحيات الأدمن
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/admin');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(userData);
    fetchDashboardData();
  }, [router]);

  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authHeaders = { 'X-Session-ID': sessionId };

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'منذ لحظات';
    if (m < 60) return `منذ ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} ساعة`;
    return `منذ ${Math.floor(h / 24)} يوم`;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [institutionsRes, requestsRes, usersRes, screensRes, agreementsRes, servicesRes,
             recentReqRes, recentUsersRes, recentSvcRes] = await Promise.all([
        fetch('/api/institutions?limit=1', { headers: authHeaders }),
        fetch('/api/institution-requests?status=pending&limit=1', { headers: authHeaders }),
        fetch('/api/users?limit=1', { headers: authHeaders }),
        fetch('/api/screens/stats', { headers: authHeaders }),
        fetch('/api/agreements?limit=1', { headers: authHeaders }),
        fetch('/api/services?limit=1', { headers: authHeaders }),
        // بيانات حقيقية للبطاقات
        fetch('/api/institution-requests?status=pending&limit=3', { headers: authHeaders }),
        fetch('/api/users?limit=3', { headers: authHeaders }),
        fetch('/api/services?limit=3', { headers: authHeaders }),
      ]);

      const institutions = await institutionsRes.json();
      const requests     = await requestsRes.json();
      const users        = await usersRes.json();
      const screens      = await screensRes.json();
      const agreements   = await agreementsRes.json();
      const services     = await servicesRes.json();
      const recentReq    = await recentReqRes.json();
      const recentUsr    = await recentUsersRes.json();
      const recentSvc    = await recentSvcRes.json();

      setStats({
        total_institutions: institutions.total || 0,
        pending_requests:   requests.total    || 0,
        total_users:        users.total       || 0,
        active_screens:     screens.active    || 0,
        total_agreements:   agreements.total  || 0,
        total_services:     services.total    || 0,
      });

      setRecentRequests(
        (recentReq.data || []).map((r: any) => ({
          label: r.name_ar || r.name,
          time: relativeTime(r.created_at),
          status: 'pending',
        }))
      );

      setRecentUsers(
        (recentUsr.data || []).map((u: any) => ({
          label: u.name_ar || u.name || u.email,
          time: relativeTime(u.created_at),
          status: 'active',
        }))
      );

      setRecentServices(
        (recentSvc.data || []).map((s: any) => ({
          label: s.title || s.name,
          time: relativeTime(s.created_at),
          status: s.status || 'pending',
        }))
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
      direction: 'rtl',
      padding: '20px',
    }}>
      {/* الهيدر */}
      <div style={{
        background: COLORS.darkNavy,
        borderRadius: 20,
        padding: '30px',
        marginBottom: 30,
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>
            ✦ لوحة تحكم الأدمن
          </h1>
          <p>مرحباً {user?.name_ar || user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 40,
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            🌌 المجرة الحضارية
          </Link>
          <div style={{
            background: COLORS.teal,
            padding: '10px 20px',
            borderRadius: 40,
          }}>
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
        marginBottom: 30,
      }}>
        <StatCard
          title="المؤسسات"
          value={stats.total_institutions}
          icon="🏛️"
          color={COLORS.teal}
          link="/admin/institutions"
        />
        <StatCard
          title="طلبات pending"
          value={stats.pending_requests}
          icon="⏳"
          color="#FFC107"
          link="/admin/requests"
        />
        <StatCard
          title="المستخدمين"
          value={stats.total_users}
          icon="👥"
          color={COLORS.softGreen}
          link="/admin/users"
        />
        <StatCard
          title="شاشات نشطة"
          value={stats.active_screens}
          icon="✨"
          color="#FFD700"
          link="/admin/screens"
        />
        <StatCard
          title="إدارة البث"
          value="▶"
          icon="📺"
          color="#ff4444"
          link="/admin/lectures"
        />
        <StatCard
          title="اتفاقيات"
          value={stats.total_agreements}
          icon="🔗"
          color={COLORS.lightMint}
          link="/admin/agreements"
        />
        <StatCard
          title="خدمات"
          value={stats.total_services}
          icon="🛠️"
          color="#E6B89C"
          link="/admin/services"
        />
      </div>

      {/* أقسام سريعة */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: 20,
      }}>
        {/* طلبات المؤسسات */}
        <QuickSection
          title="طلبات إنشاء مؤسسات"
          icon="📝"
          count={stats.pending_requests}
          items={recentRequests}
          link="/admin/requests"
        />

        {/* آخر المستخدمين */}
        <QuickSection
          title="آخر المستخدمين"
          icon="👤"
          count={stats.total_users}
          items={recentUsers}
          link="/admin/users"
        />

        {/* الخدمات */}
        <QuickSection
          title="آخر الخدمات"
          icon="⏳"
          count={stats.total_services}
          items={recentServices}
          link="/admin/services"
        />

        {/* إدارة البث المباشر */}
        <LiveStreamSection />

        {/* التواصل */}
        <ContactSection />
      </div>
    </div>
  );
}

// ============================================================
// المكونات المساعدة
// ============================================================

function LiveStreamSection() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lectures?limit=10')
      .then(r => r.json())
      .then(d => { setLectures(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const liveLectures = lectures.filter(l => l.is_live);

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '20px',
      boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>📺</span>
          <h3 style={{ color: COLORS.darkNavy, margin: 0 }}>إدارة البث المباشر</h3>
        </div>
        {liveLectures.length > 0 && (
          <span style={{
            background: '#ff444420', color: '#ff4444',
            padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 7, height: 7, background: '#ff4444', borderRadius: '50%', display: 'inline-block', animation: 'blink 1s infinite' }} />
            {liveLectures.length} بث مباشر
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#aaa', fontSize: '0.9rem', padding: '10px 0' }}>جاري التحميل...</div>
      ) : lectures.length === 0 ? (
        <div style={{ color: '#bbb', fontSize: '0.9rem', padding: '10px 0' }}>لا توجد محاضرات بعد</div>
      ) : (
        <div style={{ marginBottom: 15 }}>
          {lectures.slice(0, 3).map((l, i) => (
            <div key={l.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0',
              borderBottom: i < Math.min(lectures.length, 3) - 1 ? `1px solid ${COLORS.teal}20` : 'none',
            }}>
              <div>
                <div style={{ fontWeight: 600, color: COLORS.darkNavy, fontSize: '0.9rem' }}>{l.title}</div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>
                  {l.stream_type === 'recorded' ? '🎬 مسجّل' : '📅 مجدول'}
                </div>
              </div>
              {l.is_live ? (
                <span style={{ background: '#ff444415', color: '#ff4444', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  🔴 LIVE
                </span>
              ) : (
                <span style={{ background: `${COLORS.teal}15`, color: COLORS.teal, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem' }}>
                  غير نشط
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Link href="/admin/lectures" style={{
        display: 'block', textAlign: 'center', padding: '10px',
        background: '#ff4444', color: 'white', textDecoration: 'none',
        borderRadius: 40, fontSize: '0.9rem', fontWeight: 600,
        transition: 'all 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#cc0000'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#ff4444'; }}
      >
        ▶ إدارة البث الكاملة
      </Link>
    </div>
  );
}

function ContactSection() {
  const contacts = [
    { icon: '✉️', label: 'البريد الإلكتروني', value: 'admin@hadmaj.com', href: 'mailto:admin@hadmaj.com' },
    { icon: '📞', label: 'الدعم الفني', value: '+966 50 000 0000', href: 'tel:+966500000000' },
    { icon: '💬', label: 'واتساب', value: 'تواصل عبر واتساب', href: 'https://wa.me/966500000000' },
    { icon: '🌐', label: 'الموقع الرسمي', value: 'hadmaj.com', href: 'https://hadmaj.com' },
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '20px',
      boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
        <span style={{ fontSize: '1.5rem' }}>📡</span>
        <h3 style={{ color: COLORS.darkNavy, margin: 0 }}>التواصل والدعم</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}>
        {contacts.map((c, i) => (
          <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 12,
            background: `${COLORS.lightMint}60`,
            border: `1px solid ${COLORS.softGreen}40`,
            textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${COLORS.softGreen}30`; e.currentTarget.style.borderColor = COLORS.softGreen; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${COLORS.lightMint}60`; e.currentTarget.style.borderColor = `${COLORS.softGreen}40`; }}
          >
            <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: COLORS.teal }}>{c.label}</div>
              <div style={{ fontSize: '0.88rem', color: COLORS.darkNavy, fontWeight: 600 }}>{c.value}</div>
            </div>
          </a>
        ))}
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`,
        borderRadius: 14, padding: '14px 16px', color: 'white', fontSize: '0.85rem', textAlign: 'center',
      }}>
        <div style={{ marginBottom: 4, fontSize: '1rem' }}>✦ المجرة الحضارية</div>
        <div style={{ opacity: 0.75, fontSize: '0.78rem' }}>فريق الدعم متاح على مدار الساعة</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, link }: any) {
  return (
    <Link href={link} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '20px',
        boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
        border: `1px solid ${color}40`,
        transition: 'all 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 10px 25px ${color}60`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 5px 15px ${COLORS.darkNavy}20`;
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{
            width: 50,
            height: 50,
            background: `${color}20`,
            borderRadius: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>{title}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickSection({ title, icon, count, items, link }: any) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '20px',
      boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <h3 style={{ color: COLORS.darkNavy }}>{title}</h3>
        </div>
        <span style={{
          background: COLORS.teal,
          color: 'white',
          padding: '2px 10px',
          borderRadius: 20,
          fontSize: '0.8rem',
        }}>
          {count} جديد
        </span>
      </div>

      <div style={{ marginBottom: 15 }}>
        {items.length === 0 ? (
          <div style={{ color: '#bbb', fontSize: '0.88rem', padding: '10px 0', textAlign: 'center' }}>لا توجد بيانات</div>
        ) : items.map((item: any, index: number) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: index < items.length - 1 ? `1px solid ${COLORS.teal}20` : 'none',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: COLORS.darkNavy }}>{item.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#666' }}>{item.time}</div>
            </div>
            <span style={{
              background: item.status === 'pending' ? '#FFC10720' : `${COLORS.softGreen}20`,
              color: item.status === 'pending' ? '#FFC107' : COLORS.softGreen,
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: '0.6rem',
            }}>
              {item.status === 'pending' ? 'قيد المراجعة' : 'نشط'}
            </span>
          </div>
        ))}
      </div>

      <Link href={link} style={{
        display: 'block',
        textAlign: 'center',
        padding: '10px',
        background: COLORS.teal,
        color: 'white',
        textDecoration: 'none',
        borderRadius: 40,
        fontSize: '0.9rem',
        transition: 'all 0.3s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.darkNavy}
      onMouseLeave={e => e.currentTarget.style.background = COLORS.teal}
      >
        عرض الكل
      </Link>
    </div>
  );
}