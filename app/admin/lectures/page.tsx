'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchLectures, createLecture, controlLectureStream, getCfUploadUrl, checkLectureRecording, API_BASE } from '@/lib/api';
import Link from 'next/link';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  live: '#ff4444',
  recorded: '#4E8D9C',
};

interface Lecture {
  id: number;
  institution_id: number;
  title: string;
  description?: string;
  video_url?: string;
  stream_url?: string;
  stream_type?: 'live' | 'recorded' | 'external';
  stream_key?: string;
  cf_live_input_id?: string;
  cf_video_id?: string;
  is_live: boolean;
  category?: string;
  viewer_count?: number;
  started_at?: string;
  ended_at?: string;
  scheduled_datetime?: string;
  created_at: string;
}

export default function AdminLecturesPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [cfModal, setCfModal] = useState<{
    rtmps_url: string;
    rtmps_stream_key: string;
    hls_url: string;
    iframe_url: string;
    webrtc_url?: string;
    title: string;
    lecture_id: number;
  } | null>(null);

  // فورم إنشاء محاضرة
  const [form, setForm] = useState({
    institution_id: '',
    title: '',
    description: '',
    stream_type: 'live' as 'live' | 'recorded' | 'external',
    stream_url: '',
    video_url: '',
    external_url: '',
    category: '',
    scheduled_datetime: '',
    visibility: 'institution' as 'institution' | 'all',
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/lectures');
      return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [lecs, instRes] = await Promise.all([
        fetchLectures(),
        fetch(`${API_BASE}/api/institutions?limit=200`).then(r => r.json()),
      ]);
      setLectures(lecs as Lecture[]);
      setInstitutions(instRes?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamAction = async (lecture: Lecture, action: 'start' | 'stop') => {
    setActionLoading(lecture.id);
    try {
      const result = await controlLectureStream(lecture.id, action, {
        stream_url: lecture.stream_url || undefined,
      });
      if (action === 'start' && result.cf_credentials) {
        setCfModal({ ...result.cf_credentials, title: lecture.title, lecture_id: lecture.id });
      }
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStreamUrl = async (lecture: Lecture, stream_url: string) => {
    setActionLoading(lecture.id);
    try {
      await controlLectureStream(lecture.id, 'update', { stream_url });
      await loadAll();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const extParsed = form.stream_type === 'external' ? parseExternalVideoUrl(form.external_url) : null;
      await createLecture({
        institution_id: Number(form.institution_id),
        title: form.title,
        description: form.description || undefined,
        stream_type: form.stream_type === 'external' ? 'recorded' : form.stream_type,
        stream_url: form.stream_type === 'external'
          ? (extParsed?.embedUrl || form.external_url || undefined)
          : form.stream_url || undefined,
        video_url: form.video_url || undefined,
        category: form.category || undefined,
        scheduled_datetime: form.scheduled_datetime || undefined,
        is_live: false,
        visibility: form.visibility,
      });
      setShowCreate(false);
      setForm({ institution_id: '', title: '', description: '', stream_type: 'live', stream_url: '', video_url: '', external_url: '', category: '', scheduled_datetime: '', visibility: 'institution' });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const liveLectures = lectures.filter(l => l.is_live);
  const otherLectures = lectures.filter(l => !l.is_live);

  // استعلام دوري للمحاضرات التي انتهى بثها وCF لا يزال يعالج التسجيل
  useEffect(() => {
    const pending = lectures.filter(
      l => !l.is_live && l.cf_live_input_id && !l.cf_video_id && l.stream_type === 'recorded'
    );
    if (pending.length === 0) return;

    let active = true;
    const check = async () => {
      const updates = await Promise.all(
        pending.map(l => checkLectureRecording(l.id).then(r => ({ id: l.id, ...r })).catch(() => null))
      );
      if (!active) return;
      let anyReady = false;
      updates.forEach(u => {
        if (u?.ready && u.cf_video_id) {
          anyReady = true;
          setLectures(prev => prev.map(l =>
            l.id === u.id ? { ...l, cf_video_id: u.cf_video_id } : l
          ));
        }
      });
      if (anyReady) {
        // تحديث كامل لو تم حل جميع التسجيلات
        loadAll();
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => { active = false; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectures.map(l => `${l.id}:${l.cf_video_id}`).join(',')]);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, direction: 'rtl', padding: 20 }}>
      <style>{`
        .stream-url-input {
          background: rgba(0,0,0,0.04);
          border: 1px solid ${C.teal}40;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.82rem;
          width: 220px;
          color: ${C.darkNavy};
          outline: none;
        }
        .stream-url-input:focus { border-color: ${C.teal}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* هيدر */}
      <div style={{ background: C.darkNavy, borderRadius: 20, padding: '28px 32px', marginBottom: 28, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>📺 إدارة البث المباشر</h1>
          <p style={{ opacity: 0.7, margin: '6px 0 0', fontSize: '0.9rem' }}>
            تحكم كامل في المحاضرات والبث المباشر والمسجّل
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/" style={{ padding: '10px 20px', borderRadius: 30, background: 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.15)' }}>
            🌌 المجرة الحضارية
          </Link>
          <Link href="/admin" style={{ padding: '10px 20px', borderRadius: 30, background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            ← لوحة الأدمن
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: '10px 24px', borderRadius: 30, background: C.softGreen, color: C.darkNavy, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
          >
            + إضافة محاضرة
          </button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'إجمالي المحاضرات', value: lectures.length, icon: '📚', color: C.teal },
          { label: 'بث مباشر الآن', value: liveLectures.length, icon: '🔴', color: C.live },
          { label: 'مسجّلة', value: lectures.filter(l => l.stream_type === 'recorded').length, icon: '🎬', color: C.recorded },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', boxShadow: `0 4px 14px ${C.darkNavy}15`, border: `1px solid ${s.color}30` }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '0.78rem', color: C.teal }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.teal, fontSize: '1.1rem' }}>جاري التحميل...</div>
      ) : (
        <>
          {/* البث المباشر الآن */}
          {liveLectures.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ color: C.live, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, background: C.live, borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                يبث الآن
              </h2>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              <div style={{ display: 'grid', gap: 16 }}>
                {liveLectures.map(l => <LectureCard key={l.id} lecture={l} institutions={institutions} actionLoading={actionLoading} onStreamAction={handleStreamAction} onUpdateUrl={handleUpdateStreamUrl} onCfUpload={getCfUploadUrl} />)}
              </div>
            </div>
          )}

          {/* باقي المحاضرات */}
          <div>
            <h2 style={{ color: C.darkNavy, marginBottom: 14 }}>جميع المحاضرات</h2>
            {otherLectures.length === 0 && liveLectures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: C.teal, background: 'white', borderRadius: 20 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
                لا توجد محاضرات بعد — أضف أول محاضرة الآن
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {otherLectures.map(l => <LectureCard key={l.id} lecture={l} institutions={institutions} actionLoading={actionLoading} onStreamAction={handleStreamAction} onUpdateUrl={handleUpdateStreamUrl} onCfUpload={getCfUploadUrl} />)}
              </div>
            )}
          </div>
        </>
      )}

      {/* مودال إنشاء محاضرة */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              إضافة محاضرة / بث
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="المؤسسة *">
                <select value={form.institution_id} onChange={e => setForm({ ...form, institution_id: e.target.value })} required style={selectStyle}>
                  <option value="">اختر مؤسسة...</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>)}
                </select>
              </Field>
              <Field label="عنوان المحاضرة *">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="عنوان البث أو المحاضرة" style={inputStyle} />
              </Field>
              <Field label="الوصف">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="وصف مختصر..." style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
              <Field label="نوع البث">
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {(['live', 'recorded', 'external'] as const).map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: form.stream_type === t ? 700 : 400, color: form.stream_type === t ? C.teal : '#666' }}>
                      <input type="radio" value={t} checked={form.stream_type === t} onChange={() => setForm({ ...form, stream_type: t })} />
                      {t === 'live' ? '🔴 مباشر' : t === 'recorded' ? '🎬 مسجّل' : '🎥 فيديو خارجي'}
                    </label>
                  ))}
                </div>
              </Field>
              {form.stream_type === 'live' && (
                <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 10, padding: '12px 14px', fontSize: '0.88rem', color: C.teal, lineHeight: 1.6 }}>
                  ☁️ <strong>Cloudflare Stream</strong> — سيتم إنشاء رابط البث تلقائياً عند الضغط على <strong>&quot;▶ بدء البث&quot;</strong>، وستظهر بيانات OBS (Server + Stream Key) فور البدء.
                </div>
              )}
              {form.stream_type === 'recorded' && (
                <Field label="رابط الفيديو المسجّل">
                  <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." style={inputStyle} />
                </Field>
              )}
              {form.stream_type === 'external' && (
                <Field label="رابط الفيديو الخارجي (YouTube / Vimeo / Dailymotion)">
                  <input
                    value={form.external_url}
                    onChange={e => setForm({ ...form, external_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... أو رابط Vimeo/Dailymotion"
                    style={inputStyle}
                  />
                  {form.external_url && (() => {
                    const p = parseExternalVideoUrl(form.external_url);
                    const icons: Record<string, string> = { youtube: '▶ YouTube', vimeo: '● Vimeo', dailymotion: '◉ Dailymotion' };
                    return p ? (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: `${C.teal}15`, color: C.teal, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                          ✅ {icons[p.platform] || p.platform} — تم التعرف على المنصة
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>سيتم تحويل الرابط تلقائياً</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#e57373' }}>
                        ⚠️ لم يتم التعرف على المنصة — يُقبل روابط YouTube أو Vimeo أو Dailymotion
                      </div>
                    );
                  })()}
                  <div style={{ marginTop: 8, padding: '8px 12px', background: `${C.softGreen}15`, border: `1px solid ${C.softGreen}40`, borderRadius: 8, fontSize: '0.8rem', color: '#555', lineHeight: 1.6 }}>
                    📌 سيُعرض هذا الفيديو على الشاشة تلقائياً عند عدم وجود بث مباشر
                  </div>
                </Field>
              )}
              <Field label="التصنيف">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={selectStyle}>
                  <option value="">— اختر —</option>
                  <option value="lecture">محاضرة</option>
                  <option value="lesson">درس</option>
                  <option value="course">دورة</option>
                  <option value="conference">مؤتمر</option>
                </select>
              </Field>
              <Field label="موعد الجدولة (اختياري)">
                <input type="datetime-local" value={form.scheduled_datetime} onChange={e => setForm({ ...form, scheduled_datetime: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="الظهور">
                <div style={{ display: 'flex', gap: 16 }}>
                  {([
                    { value: 'institution', label: '🏛️ مؤسستي فقط' },
                    { value: 'all', label: '🌍 جميع المؤسسات' },
                  ] as const).map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: form.visibility === opt.value ? 700 : 400, color: form.visibility === opt.value ? C.teal : '#666' }}>
                      <input type="radio" value={opt.value} checked={form.visibility === opt.value} onChange={() => setForm({ ...form, visibility: opt.value })} />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {form.visibility === 'all' && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: `${C.softGreen}20`, border: `1px solid ${C.softGreen}50`, borderRadius: 8, fontSize: '0.82rem', color: C.teal }}>
                    ✦ سيظهر هذا البث لجميع المؤسسات المسجّلة في المنصة
                  </div>
                )}
              </Field>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={createLoading} style={{ flex: 1, padding: '12px 0', background: C.darkNavy, color: 'white', border: 'none', borderRadius: 30, fontWeight: 700, cursor: createLoading ? 'default' : 'pointer', opacity: createLoading ? 0.7 : 1, fontSize: '1rem' }}>
                  {createLoading ? 'جاري الإنشاء...' : '✦ إنشاء'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '12px 28px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 30, cursor: 'pointer', fontSize: '1rem' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال بيانات CF Stream */}
      {cfModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, direction: 'rtl' }}>
          <div style={{ background: C.darkNavy, borderRadius: 24, padding: 36, width: '100%', maxWidth: 540, color: 'white', boxShadow: `0 20px 60px #00000080` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, background: C.live, borderRadius: '50%', display: 'inline-block' }} />
                البث المباشر يعمل الآن
              </h2>
              <button onClick={() => setCfModal(null)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: 20 }}>
              أدخل هذه البيانات في OBS أو أي برنامج بث لبدء البث المباشر لـ &quot;{cfModal.title}&quot;
            </p>

            {[
              { label: 'عنوان RTMPS (Server)', value: cfModal.rtmps_url },
              { label: 'مفتاح البث (Stream Key)', value: cfModal.rtmps_stream_key },
              { label: 'رابط المشاهدة HLS', value: cfModal.hls_url },
              { label: 'رابط Iframe للتضمين', value: cfModal.iframe_url },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.78rem', color: C.softGreen, marginBottom: 4 }}>{label}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    readOnly
                    value={value}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: '0.82rem', outline: 'none', direction: 'ltr', textAlign: 'left' }}
                    onFocus={e => e.target.select()}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(value)}
                    style={{ padding: '8px 14px', background: `${C.teal}30`, border: `1px solid ${C.teal}`, borderRadius: 8, color: C.softGreen, cursor: 'pointer', fontSize: '0.82rem', flexShrink: 0 }}
                  >
                    نسخ
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(255,68,68,0.12)', borderRadius: 12, border: '1px solid rgba(255,68,68,0.3)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
              ⚠️ احتفظ بمفتاح البث سرياً — لا تشاركه مع أحد. يمكنك إيقاف البث من زر &quot;⏹ إيقاف البث&quot;.
            </div>

            <button
              onClick={() => setCfModal(null)}
              style={{ marginTop: 20, width: '100%', padding: '12px', background: C.softGreen, color: C.darkNavy, border: 'none', borderRadius: 30, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
            >
              ✓ فهمت — ابدأ البث الآن
            </button>

            {cfModal.webrtc_url && (
              <a
                href={`/admin/broadcast?whip=${encodeURIComponent(cfModal.webrtc_url)}&iframe=${encodeURIComponent(cfModal.iframe_url)}&title=${encodeURIComponent(cfModal.title)}&id=${cfModal.lecture_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 10, width: '100%', padding: '12px', background: `${C.teal}20`, color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 30, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                📹 بث مباشر من المتصفح (بدون OBS)
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Card Component ──────────────────────────────────────────────────────────
function LectureCard({ lecture, institutions, actionLoading, onStreamAction, onUpdateUrl, onCfUpload }: {
  lecture: Lecture;
  institutions: any[];
  actionLoading: number | null;
  onStreamAction: (l: Lecture, a: 'start' | 'stop') => void;
  onUpdateUrl: (l: Lecture, url: string) => void;
  onCfUpload: (lectureId: number) => Promise<{ uploadURL: string; videoId: string; iframeUrl: string }>;
}) {
  const [editUrl, setEditUrl] = useState(lecture.stream_url || '');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const isLoading = actionLoading === lecture.id;
  const inst = institutions.find(i => i.id === lecture.institution_id);
  const isLive = lecture.is_live;
  const isRecorded = lecture.stream_type === 'recorded';

  const handleVideoUpload = async (file: File) => {
    setUploadLoading(true);
    setUploadProgress(0);
    try {
      const { uploadURL, iframeUrl } = await onCfUpload(lecture.id);

      // Upload the file to CF Stream via multipart POST
      const formData = new FormData();
      formData.append('file', file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('loadend', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`رفع فاشل: ${xhr.status}`));
        });
        xhr.open('POST', uploadURL);
        xhr.send(formData);
      });

      // Update the lecture stream_url with the iframe embed URL
      onUpdateUrl(lecture, iframeUrl);
      setEditUrl(iframeUrl);
      setUploadProgress(null);
      alert('✅ تم رفع الفيديو بنجاح إلى Cloudflare Stream!');
    } catch (err: any) {
      alert(`فشل الرفع: ${err.message}`);
      setUploadProgress(null);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 18,
      padding: '22px 24px',
      boxShadow: isLive ? `0 0 0 2px ${C.live}, 0 8px 24px ${C.live}20` : `0 4px 18px ${C.darkNavy}12`,
      border: `1px solid ${isLive ? C.live : isRecorded ? C.teal + '40' : C.softGreen + '40'}`,
      display: 'flex',
      gap: 20,
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    }}>
      {/* أيقونة الحالة */}
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: isLive ? `${C.live}15` : isRecorded ? `${C.teal}15` : `${C.softGreen}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
      }}>
        {isLive ? '🔴' : isRecorded ? '🎬' : '📅'}
      </div>

      {/* المحتوى */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: C.darkNavy }}>{lecture.title}</span>
          <StreamBadge isLive={isLive} streamType={lecture.stream_type} />
        </div>
        <div style={{ fontSize: '0.82rem', color: C.teal, marginBottom: 6 }}>
          {inst ? (inst.name_ar || inst.name) : `مؤسسة #${lecture.institution_id}`}
          {lecture.category && ` · ${lecture.category}`}
        </div>
        {lecture.description && (
          <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: '#666', lineHeight: 1.5 }}>{lecture.description}</p>
        )}
        {isLive && lecture.started_at && (
          <div style={{ fontSize: '0.78rem', color: C.live, marginBottom: 4 }}>
            🕐 بدأ: {new Date(lecture.started_at).toLocaleString('ar-EG')}
            {lecture.viewer_count !== undefined && ` · 👁️ ${lecture.viewer_count} مشاهد`}
          </div>
        )}
        {!isLive && lecture.ended_at && (
          <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: 4 }}>
            انتهى: {new Date(lecture.ended_at).toLocaleString('ar-EG')}
          </div>
        )}

        {/* CF Stream Info */}
        {lecture.cf_live_input_id && (
          <div style={{ fontSize: '0.78rem', color: C.teal, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>☁️ CF Stream:</span>
            <code style={{ background: `${C.teal}10`, padding: '1px 6px', borderRadius: 4 }}>{lecture.cf_live_input_id.slice(0, 16)}…</code>
            {!isLive && !lecture.cf_video_id && (
              <span style={{ background: '#fff3cd', color: '#856404', padding: '1px 8px', borderRadius: 10, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                جاري معالجة التسجيل...
              </span>
            )}
            {lecture.cf_video_id && (
              <span style={{ background: '#d4edda', color: '#155724', padding: '1px 8px', borderRadius: 10, fontSize: '0.72rem' }}>
                ✅ تسجيل جاهز
              </span>
            )}
          </div>
        )}

        {/* تعديل رابط البث */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <input
            className="stream-url-input"
            value={editUrl}
            onChange={e => setEditUrl(e.target.value)}
            placeholder={isRecorded ? 'رابط CF أو YouTube/Vimeo/Dailymotion' : 'رابط البث HLS/RTMP'}
          />
          {(() => {
            const ext = parseExternalVideoUrl(editUrl);
            const labels: Record<string, string> = { youtube: 'YouTube', vimeo: 'Vimeo', dailymotion: 'Dailymotion' };
            return ext ? (
              <span style={{ fontSize: '0.72rem', color: C.teal, background: `${C.teal}10`, padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>
                ✅ {labels[ext.platform]}
              </span>
            ) : null;
          })()}
          <button
            onClick={() => {
              const ext = parseExternalVideoUrl(editUrl);
              onUpdateUrl(lecture, ext ? ext.embedUrl : editUrl);
            }}
            disabled={isLoading}
            style={{ padding: '6px 14px', borderRadius: 20, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}40`, cursor: 'pointer', fontSize: '0.82rem' }}
          >
            حفظ
          </button>
        </div>

        {/* رفع فيديو إلى CF Stream (للمسجّل فقط) */}
        {isRecorded && !isLive && (
          <div style={{ marginTop: 8 }}>
            {uploadProgress !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: `${C.teal}20`, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: C.teal, transition: 'width 0.3s', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: C.teal }}>{uploadProgress}%</span>
              </div>
            ) : (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: uploadLoading ? 'default' : 'pointer', opacity: uploadLoading ? 0.6 : 1 }}>
                <input
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  disabled={uploadLoading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); e.target.value = ''; }}
                />
                <span style={{ padding: '6px 14px', borderRadius: 20, background: `${C.softGreen}20`, color: C.softGreen, border: `1px solid ${C.softGreen}60`, fontSize: '0.82rem', userSelect: 'none' }}>
                  {uploadLoading ? 'جاري الرفع...' : '☁️ رفع إلى CF Stream'}
                </span>
              </label>
            )}
          </div>
        )}

      </div>

      {/* أزرار التحكم */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 120 }}>
        {!isLive ? (
          <button
            onClick={() => onStreamAction(lecture, 'start')}
            disabled={isLoading}
            style={{
              padding: '9px 20px', borderRadius: 30,
              background: C.live, color: 'white', border: 'none',
              fontWeight: 700, cursor: isLoading ? 'default' : 'pointer',
              opacity: isLoading ? 0.6 : 1, fontSize: '0.9rem',
              width: '100%', textAlign: 'center',
            }}
          >
            {isLoading ? '...' : '▶ بدء البث'}
          </button>
        ) : (
          <button
            onClick={() => onStreamAction(lecture, 'stop')}
            disabled={isLoading}
            style={{
              padding: '9px 20px', borderRadius: 30,
              background: '#1a1a2a', color: 'white', border: 'none',
              fontWeight: 700, cursor: isLoading ? 'default' : 'pointer',
              opacity: isLoading ? 0.6 : 1, fontSize: '0.9rem',
              width: '100%', textAlign: 'center',
            }}
          >
            {isLoading ? '...' : '⏹ إيقاف البث'}
          </button>
        )}
        <div style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'center' }}>
          #{lecture.id} · {new Date(lecture.created_at).toLocaleDateString('ar-EG')}
        </div>
      </div>
    </div>
  );
}

// ─── Stream Badge ─────────────────────────────────────────────────────────────
function StreamBadge({ isLive, streamType }: { isLive: boolean; streamType?: string }) {
  if (isLive) {
    return (
      <span style={{
        background: C.live, color: 'white', padding: '2px 10px',
        borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        animation: 'none',
      }}>
        <span style={{ width: 6, height: 6, background: 'white', borderRadius: '50%', display: 'inline-block' }} />
        LIVE
      </span>
    );
  }
  if (streamType === 'recorded') {
    return (
      <span style={{ background: `${C.teal}20`, color: C.teal, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
        🎬 مسجّل
      </span>
    );
  }
  if (streamType === 'external') {
    return (
      <span style={{ background: '#ede7f620', color: '#7b1fa2', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
        🎥 خارجي
      </span>
    );
  }
  return (
    <span style={{ background: `${C.softGreen}20`, color: C.softGreen, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
      📅 مجدول
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.85rem', color: C.teal, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

// ─── External Video URL Parser ───────────────────────────────────────────────
function parseExternalVideoUrl(url: string): { embedUrl: string; platform: 'youtube' | 'vimeo' | 'dailymotion' } | null {
  if (!url) return null;
  const u = url.trim();
  // YouTube: watch, embed, shorts, youtu.be
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1`, platform: 'youtube' };
  // Vimeo
  const vm = u.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vm) return { embedUrl: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1`, platform: 'vimeo' };
  // Dailymotion: video page or dai.ly short link
  const dm = u.match(/(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dm) return { embedUrl: `https://www.dailymotion.com/embed/video/${dm[1]}?autoplay=1&mute=1`, platform: 'dailymotion' };
  return null;
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10,
  border: `1.5px solid ${C.teal}40`, background: 'white',
  color: C.darkNavy, fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
};
