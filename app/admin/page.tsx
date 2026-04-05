'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

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
  total_campaigns: number;
  total_marketplace: number;
  total_saas_apps: number;
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
    total_campaigns: 0,
    total_marketplace: 0,
    total_saas_apps: 0,
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
             campaignsRes, marketplaceRes, saasRes,
             recentReqRes, recentUsersRes, recentSvcRes] = await Promise.all([
        fetch(`${API_BASE}/api/institutions?limit=1`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/institution-requests?status=pending&limit=1`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/users?limit=1`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/screens/stats`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/agreements?limit=1`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/services?limit=1`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/campaigns?limit=1`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/marketplace?limit=1`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/saas?limit=1`, { headers: authHeaders }),
        // بيانات حقيقية للبطاقات
        fetch(`${API_BASE}/api/institution-requests?status=pending&limit=3`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/users?limit=3`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/services?limit=3`, { headers: authHeaders }),
      ]);

      const institutions = await institutionsRes.json();
      const requests     = await requestsRes.json();
      const users        = await usersRes.json();
      const screens      = await screensRes.json();
      const agreements   = await agreementsRes.json();
      const services     = await servicesRes.json();
      const campaigns    = await campaignsRes.json();
      const marketplace  = await marketplaceRes.json();
      const saas         = await saasRes.json();
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
        total_campaigns:    campaigns.total   || 0,
        total_marketplace:  marketplace.total || 0,
        total_saas_apps:    saas.total        || 0,
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
      <div className="loading-page">
        <div className="spinner" />
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* الهيدر */}
      <div className="admin-header">
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
      <div className="stat-grid">
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
        <StatCard
          title="الإعلانات"
          value="📢"
          icon="📢"
          color="#FF9800"
          link="/admin/ads"
        />
        <StatCard
          title="المكتبة"
          value="📚"
          icon="📚"
          color="#4E8D9C"
          link="/admin/library"
        />
        <StatCard
          title="المنتدى"
          value="💬"
          icon="💬"
          color="#C084FC"
          link="/admin/forum"
        />
        <StatCard
          title="البودكاست"
          value="🎙️"
          icon="🎙️"
          color="#FF6B6B"
          link="/admin/podcast"
        />
        <StatCard
          title="الأخبار والفعاليات"
          value="📰"
          icon="📰"
          color="#38BDF8"
          link="/admin/news"
        />
        <StatCard
          title="الحملات المشتركة"
          value={stats.total_campaigns}
          icon="🚀"
          color="#8b5cf6"
          link="/admin/campaigns"
        />
        <StatCard
          title="السوق الرقمي"
          value={stats.total_marketplace}
          icon="🛒"
          color="#f59e0b"
          link="/admin/marketplace"
        />
        <StatCard
          title="تطبيقات SAAS"
          value={stats.total_saas_apps}
          icon="☁️"
          color="#0ea5e9"
          link="/admin/saas"
        />
        <StatCard
          title="القائمة البريدية"
          value="📧"
          icon="📧"
          color="#10B981"
          link="/admin/mailing"
        />
      </div>

      {/* أقسام سريعة */}
      <div className="sections-grid">
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

        {/* الحملات والسوق والسحابة */}
        <NewSectionsRow
          campaigns={stats.total_campaigns}
          marketplace={stats.total_marketplace}
          saas={stats.total_saas_apps}
        />

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
    fetch(`${API_BASE}/api/lectures?limit=10`)
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
      boxShadow: `0 4px 14px ${COLORS.darkNavy}12`,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 280,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14, paddingBottom: 12,
        borderBottom: '2px solid #ff444418',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: '1.35rem' }}>📺</span>
          <h3 style={{ color: COLORS.darkNavy, margin: 0, fontSize: '0.97rem', fontWeight: 700 }}>إدارة البث المباشر</h3>
        </div>
        <span style={{
          background: liveLectures.length > 0 ? '#ff444418' : '#f2f2f2',
          color: liveLectures.length > 0 ? '#ff4444' : '#aaa',
          padding: '3px 12px', borderRadius: 20,
          fontSize: '0.83rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {liveLectures.length > 0 && (
            <span style={{ width: 7, height: 7, background: '#ff4444', borderRadius: '50%', display: 'inline-block', animation: 'blink 1s infinite' }} />
          )}
          {liveLectures.length > 0 ? `${liveLectures.length} بث مباشر` : 'لا يوجد بث'}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', minHeight: 120, gap: 10,
            color: '#aaa', fontSize: '0.9rem',
          }}>
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            جاري التحميل...
          </div>
        ) : lectures.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', minHeight: 120,
            border: '2px dashed #ff444428', borderRadius: 14,
            gap: 8, color: '#c0c0c0', fontSize: '0.88rem',
          }}>
            <span style={{ fontSize: '1.8rem', opacity: 0.35 }}>📺</span>
            لا توجد محاضرات بعد
          </div>
        ) : (
          <div>
            {lectures.slice(0, 3).map((l, i) => (
              <div key={l.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', gap: 8,
                borderBottom: i < Math.min(lectures.length, 3) - 1 ? `1px solid ${COLORS.teal}15` : 'none',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontWeight: 600, color: COLORS.darkNavy, fontSize: '0.9rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{l.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 2 }}>
                    {l.stream_type === 'recorded' ? '🎬 مسجّل' : '📅 مجدول'}
                  </div>
                </div>
                <span style={{
                  background: l.is_live ? '#ff444415' : `${COLORS.teal}15`,
                  color: l.is_live ? '#ff4444' : COLORS.teal,
                  padding: '3px 10px', borderRadius: 20,
                  fontSize: '0.82rem', fontWeight: l.is_live ? 700 : 400,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {l.is_live ? '🔴 LIVE' : 'غير نشط'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Link href="/admin/lectures" style={{
        display: 'block', textAlign: 'center',
        padding: '10px', marginTop: 14,
        background: '#ff4444', color: 'white',
        textDecoration: 'none', borderRadius: 40,
        fontSize: '0.9rem', fontWeight: 600,
        transition: 'all 0.25s',
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
              <div style={{ fontSize: '0.82rem', color: COLORS.teal }}>{c.label}</div>
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
        <div style={{ opacity: 0.75, fontSize: '0.85rem' }}>فريق الدعم متاح على مدار الساعة</div>
      </div>
    </div>
  );
}

function NewSectionsRow({ campaigns, marketplace, saas }: any) {
  const sections = [
    { icon: '🚀', label: 'الحملات المشتركة', count: campaigns, link: '/admin/campaigns', color: '#8b5cf6', desc: 'إدارة حملات التعاون بين المؤسسات' },
    { icon: '🛒', label: 'السوق الرقمي',     count: marketplace, link: '/admin/marketplace', color: '#f59e0b', desc: 'إدارة المنتجات والخدمات الرقمية' },
    { icon: '☁️', label: 'الخدمات السحابية', count: saas,       link: '/admin/saas',        color: '#0ea5e9', desc: 'إدارة تطبيقات SAAS والاشتراكات' },
  ];

  return (
    <div style={{
      background: 'white', borderRadius: 20, padding: '20px',
      boxShadow: `0 4px 14px ${COLORS.darkNavy}12`,
      gridColumn: '1 / -1',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: '1.4rem' }}>🌌</span>
        <h3 style={{ color: COLORS.darkNavy, margin: 0, fontSize: '1rem', fontWeight: 700 }}>
          منظومة التوسعات الجديدة
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {sections.map(s => (
          <Link key={s.link} href={s.link} style={{ textDecoration: 'none' }}>
            <div style={{
              border: `1.5px solid ${s.color}30`,
              borderRadius: 16, padding: '16px',
              background: `${s.color}08`,
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${s.color}15`;
              e.currentTarget.style.borderColor = s.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${s.color}08`;
              e.currentTarget.style.borderColor = `${s.color}30`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
                <span style={{
                  background: `${s.color}20`, color: s.color,
                  padding: '2px 10px', borderRadius: 20,
                  fontSize: '0.9rem', fontWeight: 800,
                }}>{s.count}</span>
              </div>
              <div style={{ fontWeight: 700, color: COLORS.darkNavy, fontSize: '0.92rem', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, link }: any) {
  return (
    <Link href={link} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: '18px 20px',
        boxShadow: `0 4px 14px ${COLORS.darkNavy}12`,
        border: `1px solid ${color}25`,
        borderTop: `3px solid ${color}`,
        transition: 'all 0.25s',
        minHeight: 110,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 10,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 10px 28px ${color}45`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 4px 14px ${COLORS.darkNavy}12`;
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '0.85rem', color: '#777', fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
          <div style={{
            width: 42, height: 42, flexShrink: 0,
            background: `${color}18`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.35rem',
          }}>
            {icon}
          </div>
        </div>
        <div style={{ fontSize: '2.1rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      </div>
    </Link>
  );
}

function QuickSection({ title, icon, count, items, link }: any) {
  const hasItems = items.length > 0;
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '20px',
      boxShadow: `0 4px 14px ${COLORS.darkNavy}12`,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 280,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14, paddingBottom: 12,
        borderBottom: `2px solid ${COLORS.teal}18`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: '1.35rem' }}>{icon}</span>
          <h3 style={{ color: COLORS.darkNavy, margin: 0, fontSize: '0.97rem', fontWeight: 700 }}>{title}</h3>
        </div>
        <span style={{
          background: count > 0 ? `${COLORS.teal}18` : '#f2f2f2',
          color: count > 0 ? COLORS.teal : '#aaa',
          padding: '3px 12px', borderRadius: 20,
          fontSize: '0.83rem', fontWeight: 700,
        }}>
          {count}
        </span>
      </div>

      {/* Items — flex:1 fills available space */}
      <div style={{ flex: 1 }}>
        {!hasItems ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', minHeight: 120,
            border: `2px dashed ${COLORS.teal}28`,
            borderRadius: 14, gap: 8,
            color: '#c0c0c0', fontSize: '0.88rem',
          }}>
            <span style={{ fontSize: '1.8rem', opacity: 0.35 }}>📭</span>
            لا توجد بيانات حالياً
          </div>
        ) : items.map((item: any, index: number) => (
          <div key={index} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 0', gap: 8,
            borderBottom: index < items.length - 1 ? `1px solid ${COLORS.teal}15` : 'none',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontWeight: 600, color: COLORS.darkNavy, fontSize: '0.9rem',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{item.label}</div>
              <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 2 }}>{item.time}</div>
            </div>
            <span style={{
              background: item.status === 'pending' ? '#FFC10718' : `${COLORS.softGreen}18`,
              color: item.status === 'pending' ? '#d4920a' : COLORS.softGreen,
              padding: '3px 10px', borderRadius: 20,
              fontSize: '0.82rem', fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {item.status === 'pending' ? 'قيد المراجعة' : 'نشط'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer button pinned to bottom */}
      <Link href={link} style={{
        display: 'block', textAlign: 'center',
        padding: '10px', marginTop: 14,
        background: COLORS.teal, color: 'white',
        textDecoration: 'none', borderRadius: 40,
        fontSize: '0.9rem', fontWeight: 600,
        transition: 'all 0.25s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.darkNavy}
      onMouseLeave={e => e.currentTarget.style.background = COLORS.teal}
      >
        عرض الكل ←
      </Link>
    </div>
  );
}