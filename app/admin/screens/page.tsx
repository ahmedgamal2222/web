'use client';

import { useEffect, useRef, useState } from 'react';
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

      {/* ══════════════════ إدارة صوت المجرة ══════════════════ */}
      <GalaxyAudioManager />
    </div>
  );
}

// ══════════════ Galaxy Audio Manager Component ══════════════
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

function GalaxyAudioManager() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH: Record<string, string> = { 'X-Session-ID': sid };

  useEffect(() => { loadTracks(); return () => { previewRef.current?.pause(); }; }, []);

  const loadTracks = async () => {
    setLoadingTracks(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/galaxy-audio`, { headers: authH });
      const d = await res.json();
      if (d.success) setTracks(d.data || []);
    } catch {}
    setLoadingTracks(false);
  };

  const handleUpload = async () => {
    if (!audioFile) { setErr('يرجى اختيار ملف صوتي'); return; }
    if (!newTitle.trim()) { setErr('يرجى كتابة عنوان للصوت'); return; }
    setUploading(true); setErr(''); setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('title', newTitle.trim());
      const res = await fetch(`${API_BASE}/api/admin/galaxy-audio/upload`, {
        method: 'POST',
        headers: { 'X-Session-ID': sid },
        body: formData,
      });
      const d = await res.json();
      if (d.success) {
        setSuccessMsg('تم رفع الصوت بنجاح!');
        setNewTitle(''); setAudioFile(null); setUploadProgress(0);
        loadTracks();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErr(d.error || 'فشل رفع الملف');
      }
    } catch (e: any) {
      setErr('حدث خطأ أثناء الرفع');
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/admin/galaxy-audio/${id}/toggle`, {
        method: 'PUT', headers: authH,
      });
      loadTracks();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصوت؟')) return;
    try {
      await fetch(`${API_BASE}/api/admin/galaxy-audio/${id}`, {
        method: 'DELETE', headers: authH,
      });
      if (playingId === id) { previewRef.current?.pause(); setPlayingId(null); }
      loadTracks();
    } catch {}
  };

  const togglePreview = (track: AudioTrack) => {
    if (playingId === track.id) {
      previewRef.current?.pause();
      setPlayingId(null);
    } else {
      if (previewRef.current) previewRef.current.pause();
      const audio = new Audio(track.file_url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingId(null);
      previewRef.current = audio;
      setPlayingId(track.id);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const inputS: React.CSSProperties = {
    padding: '10px 14px', border: `1.5px solid ${COLORS.teal}40`, borderRadius: 10,
    fontSize: '0.9rem', outline: 'none', color: COLORS.darkNavy, background: 'white',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{ marginTop: 40 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`,
        borderRadius: '22px 22px 0 0', padding: '24px 28px', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎵</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>إدارة صوت المجرة</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: `${COLORS.lightMint}90` }}>الأصوات المحيطية للشاشة الحضارية — يمكنك رفع وتفعيل أصوات متعددة</p>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 40, padding: '6px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
          {tracks.filter(t => t.is_active).length} / {tracks.length} نشط
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: '0 0 22px 22px', padding: '24px 28px',
        boxShadow: `0 5px 20px ${COLORS.darkNavy}15`,
      }}>
        {/* Messages */}
        {err && <div style={{ background: '#fee2e2', border: '1px solid #ef444430', borderRadius: 12, padding: '10px 16px', marginBottom: 16, color: '#ef4444', fontSize: '0.88rem' }}>⚠️ {err}</div>}
        {successMsg && <div style={{ background: '#dcfce7', border: '1px solid #16a34a30', borderRadius: 12, padding: '10px 16px', marginBottom: 16, color: '#16a34a', fontSize: '0.88rem' }}>✅ {successMsg}</div>}

        {/* Upload Form */}
        <div style={{
          background: `${COLORS.lightMint}25`, border: `2px dashed ${COLORS.teal}40`,
          borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: COLORS.teal, marginBottom: 6 }}>عنوان الصوت</label>
              <input
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="مثال: صوت الفضاء الهادئ..."
                style={{ ...inputS, width: '100%' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: COLORS.teal, marginBottom: 6 }}>ملف الصوت (mp3, wav, ogg)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file" accept="audio/*"
                  onChange={e => { setAudioFile(e.target.files?.[0] || null); setErr(''); }}
                  style={{ ...inputS, width: '100%', cursor: 'pointer' }}
                />
              </div>
              {audioFile && (
                <div style={{ fontSize: '0.78rem', color: COLORS.teal, marginTop: 4 }}>
                  📁 {audioFile.name} ({formatSize(audioFile.size)})
                </div>
              )}
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                padding: '11px 28px', borderRadius: 40, border: 'none', cursor: uploading ? 'default' : 'pointer',
                background: uploading ? '#ccc' : `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
                color: 'white', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {uploading ? '⏳ جاري الرفع...' : '⬆️ رفع صوت جديد'}
            </button>
          </div>
        </div>

        {/* Tracks List */}
        {loadingTracks ? (
          <div style={{ textAlign: 'center', padding: 40, color: COLORS.teal }}>⏳ جاري التحميل...</div>
        ) : tracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>🔇</div>
            <div style={{ fontSize: '0.95rem' }}>لا توجد أصوات بعد. ارفع أول صوت للمجرة!</div>
            <div style={{ fontSize: '0.8rem', color: '#bbb', marginTop: 8 }}>يُقبل: mp3, wav, ogg, webm, flac (حتى 50 ميجابايت)</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tracks.map((track, i) => (
              <div key={track.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                borderRadius: 14, border: `1.5px solid ${track.is_active ? COLORS.softGreen + '60' : COLORS.teal + '20'}`,
                background: track.is_active ? `${COLORS.softGreen}08` : 'white',
                transition: 'all 0.2s',
              }}>
                {/* Number */}
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: track.is_active ? `${COLORS.softGreen}20` : `${COLORS.teal}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.88rem',
                  color: track.is_active ? COLORS.softGreen : COLORS.teal,
                }}>
                  {i + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: COLORS.darkNavy, fontSize: '0.92rem' }}>{track.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                    {formatSize(track.file_size)} · {new Date(track.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                  background: track.is_active ? `${COLORS.softGreen}18` : '#f3f4f6',
                  color: track.is_active ? COLORS.softGreen : '#9ca3af',
                }}>
                  {track.is_active ? '🟢 مُفعّل' : '⚪ معطّل'}
                </span>

                {/* Preview */}
                <button
                  onClick={() => togglePreview(track)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: `1px solid ${COLORS.teal}30`,
                    background: playingId === track.id ? `${COLORS.teal}18` : 'white',
                    cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  title={playingId === track.id ? 'إيقاف' : 'تشغيل'}
                >
                  {playingId === track.id ? '⏸' : '▶️'}
                </button>

                {/* Toggle Active */}
                <button
                  onClick={() => handleToggle(track.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: track.is_active ? '#fee2e220' : `${COLORS.softGreen}20`,
                    color: track.is_active ? '#ef4444' : COLORS.softGreen,
                    fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                  }}
                >
                  {track.is_active ? 'تعطيل' : 'تفعيل'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(track.id)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: '1px solid #ef444430',
                    background: 'white', cursor: 'pointer', fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  title="حذف"
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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