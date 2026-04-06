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

interface Screen {
  id: number;
  institution_id: number;
  institution_name: string;
  institution_name_ar: string;
  screen_active: boolean;
  screen_last_active: string;
  screen_password?: string;
  screen_email?: string;
  city: string;
  country: string;
  type: string;
}

export default function ScreensManagementPage() {
  const router = useRouter();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });

  useEffect(() => {
    // التحقق من صلاحيات الأدمن
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/admin/screens');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchScreens();
  }, [filters]);

  const fetchScreens = async () => {
    try {
      setLoading(true);
      
      // جلب جميع المؤسسات مع معلومات الشاشات
      const response = await fetch(`${API_BASE}/api/institutions?limit=1000`);
      const data = await response.json();
      
      const institutions = data.data || [];
      
      // تحويل البيانات إلى صيغة الشاشات
      const screensData: Screen[] = institutions.map((inst: any) => ({
        id: inst.id,
        institution_id: inst.id,
        institution_name: inst.name,
        institution_name_ar: inst.name_ar,
        screen_active: inst.screen_active || false,
        screen_last_active: inst.screen_last_active || 'غير معروف',
        screen_password: inst.screen_password || undefined,
        screen_email: inst.screen_email,
        city: inst.city,
        country: inst.country,
        type: inst.type,
      }));

      // تطبيق الفلاتر
      let filtered = screensData;
      if (filters.status === 'active') {
        filtered = filtered.filter(s => s.screen_active);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(s => !s.screen_active);
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(s => 
          (s.institution_name_ar || s.institution_name).toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q)
        );
      }

      setScreens(filtered);
      setStats({
        total: screensData.length,
        active: screensData.filter(s => s.screen_active).length,
        inactive: screensData.filter(s => !s.screen_active).length,
      });

    } catch (error) {
      console.error('Error fetching screens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (institutionId: number) => {
    if (!confirm('هل أنت متأكد من إعادة تعيين كلمة مرور الشاشة؟')) return;

    try {
      const response = await fetch(`${API_BASE}/api/institutions/${institutionId}/reset-screen-password`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('تم إعادة تعيين كلمة المرور بنجاح');
        fetchScreens();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleToggleScreen = async (institutionId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/api/screen/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: institutionId, active: !currentStatus }),
      });
      
      if (response.ok) {
        fetchScreens();
      }
    } catch (error) {
      console.error('Error toggling screen:', error);
    }
  };

  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>
      {/* الهيدر */}
      <div className="page-hero">
        <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>
          ✦ إدارة الشاشات
        </h1>
        <p>مراقبة وإدارة شاشات العرض للمؤسسات</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
        marginBottom: 30,
      }}>
        <StatBadge
          label="إجمالي الشاشات"
          value={stats.total}
          icon="📺"
          color={COLORS.teal}
        />
        <StatBadge
          label="شاشات نشطة"
          value={stats.active}
          icon="✨"
          color={COLORS.softGreen}
        />
        <StatBadge
          label="شاشات غير نشطة"
          value={stats.inactive}
          icon="⚪"
          color="#9E9E9E"
        />
      </div>

      {/* فلاتر البحث */}
      <div className="filter-bar">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: '10px 16px',
              borderRadius: 30,
              border: `2px solid ${COLORS.teal}40`,
              background: 'white',
              color: COLORS.darkNavy,
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">📺 جميع الشاشات</option>
            <option value="active">✨ النشطة</option>
            <option value="inactive">⚪ غير النشطة</option>
          </select>

          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minWidth: 220,
          }}>
            <span style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1rem',
              color: COLORS.teal,
              pointerEvents: 'none',
              lineHeight: 1,
            }}>🔍</span>
            <input
              type="text"
              placeholder="بحث باسم المؤسسة أو المدينة..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 42px 10px 16px',
                borderRadius: 30,
                border: `2px solid ${COLORS.teal}40`,
                background: `${COLORS.lightMint}30`,
                color: COLORS.darkNavy,
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = COLORS.teal; e.currentTarget.style.background = 'white'; }}
              onBlur={e => { e.currentTarget.style.borderColor = `${COLORS.teal}40`; e.currentTarget.style.background = `${COLORS.lightMint}30`; }}
            />
          </div>
      </div>

      {/* جدول الشاشات */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>جاري التحميل...</div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr style={{
                background: COLORS.teal,
                color: 'white',
              }}>
                <th style={{ padding: '15px', textAlign: 'right' }}>المؤسسة</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>الموقع</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>حالة الشاشة</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>كلمة المرور</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>آخر نشاط</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {screens.map((screen, index) => (
                <tr key={screen.id} style={{
                  borderBottom: index < screens.length - 1 ? `1px solid ${COLORS.teal}20` : 'none',
                }}>
                  <td style={{ padding: '15px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                        {screen.institution_name_ar || screen.institution_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: COLORS.teal }}>
                        {screen.type}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div>
                      <div>{screen.city}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{screen.country}</div>
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: screen.screen_active ? `${COLORS.softGreen}20` : '#9E9E9E20',
                      color: screen.screen_active ? COLORS.softGreen : '#9E9E9E',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      {screen.screen_active ? (
                        <>✨ نشطة</>
                      ) : (
                        <>⚪ غير نشطة</>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    {screen.screen_password ? (
                      <PasswordCell password={screen.screen_password} />
                    ) : (
                      <span style={{ color: '#999', fontSize: '0.8rem' }}>غير مُعيَّنة</span>
                    )}
                  </td>
                  <td style={{ padding: '15px', color: '#666' }}>
                    {screen.screen_last_active && screen.screen_last_active !== 'غير معروف'
                      ? new Date(screen.screen_last_active).toLocaleString('ar-EG')
                      : 'لم يُفعَّل'}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleToggleScreen(screen.institution_id, screen.screen_active)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          border: 'none',
                          background: screen.screen_active ? '#ff505020' : `${COLORS.softGreen}20`,
                          color: screen.screen_active ? '#ff5050' : COLORS.softGreen,
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        {screen.screen_active ? 'إيقاف' : 'تشغيل'}
                      </button>
                      
                      <button
                        onClick={() => handleResetPassword(screen.institution_id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          border: 'none',
                          background: `${COLORS.teal}20`,
                          color: COLORS.teal,
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        إعادة كلمة المرور
                      </button>

                      <Link
                        href={`/screen/${screen.institution_id}?admin=true`}
                        target="_blank"
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          background: COLORS.lightMint,
                          color: COLORS.darkNavy,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                        }}
                      >
                        📺 فتح
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {screens.length === 0 && (
            <div style={{ textAlign: 'center', padding: 50 }}>
              لا توجد شاشات مطابقة للبحث
            </div>
          )}
        </div>
      )}


    </div>
  );
}

function PasswordCell({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <code style={{
        background: `${COLORS.darkNavy}08`,
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        color: COLORS.darkNavy,
        letterSpacing: show ? '0.05em' : '0.2em',
      }}>
        {show ? password : '••••••'}
      </code>
      <button
        onClick={() => setShow(s => !s)}
        title={show ? 'إخفاء' : 'إظهار'}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: `1px solid ${COLORS.teal}40`,
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.8rem',
          padding: 0,
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
      <button
        onClick={handleCopy}
        title="نسخ"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: `1px solid ${COLORS.softGreen}40`,
          background: copied ? `${COLORS.softGreen}20` : 'white',
          cursor: 'pointer',
          fontSize: '0.8rem',
          padding: 0,
          transition: 'background 0.2s',
        }}
      >
        {copied ? '✅' : '📋'}
      </button>
    </div>
  );
}

function StatBadge({ label, value, icon, color }: any) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 15,
      padding: '20px',
      boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
      border: `1px solid ${color}40`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{
          width: 50,
          height: 50,
          background: `${color}20`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>{label}</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
        </div>
      </div>
    </div>
  );
}