'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchMyInstitutionRequests, MyInstitutionRequest, resendVerification } from '@/lib/api';

// ── طلبات اعتماد المؤسسة للمستخدم ───────────────────────────────────────────

const COLORS = {
  bg: '#0a0618',
  card: '#13103a',
  border: 'rgba(78,141,156,0.20)',
  teal: '#4E8D9C',
  mint: '#EDF7BD',
  navy: '#281C59',
  gold: '#f5c842',
};

const STATUS_CONFIG = {
  pending:  { label: 'قيد المراجعة', color: '#f5c842', bg: 'rgba(245,200,66,0.12)', icon: '⏳' },
  approved: { label: 'مُعتمد',       color: '#85C79A', bg: 'rgba(133,199,154,0.12)', icon: '✅' },
  rejected: { label: 'مرفوض',        color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '❌' },
} as const;

function StatusBadge({ status }: { status: MyInstitutionRequest['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}55`,
      borderRadius: 20,
      padding: '4px 14px',
      fontSize: '0.82rem',
      fontWeight: 700,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function RequestCard({ req }: { req: MyInstitutionRequest }) {
  const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${req.status === 'approved' ? '#85C79A33' : COLORS.border}`,
      borderRadius: 16,
      padding: '24px 26px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* الاسم + الشارة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e0ff', fontSize: '1.05rem' }}>
            {req.name_ar || req.name}
          </h3>
          {req.name_ar && req.name !== req.name_ar && (
            <p style={{ margin: '2px 0 0', color: '#6e6a99', fontSize: '0.82rem' }}>{req.name}</p>
          )}
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* التفاصيل */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span style={{ color: '#8888aa', fontSize: '0.84rem' }}>🏷 {req.type}</span>
        <span style={{ color: '#8888aa', fontSize: '0.84rem' }}>🌍 {req.country} — {req.city}</span>
        <span style={{ color: '#8888aa', fontSize: '0.84rem' }}>
          📅 {new Date(req.created_at).toLocaleDateString('ar-SA')}
        </span>
        {req.reviewed_at && (
          <span style={{ color: '#8888aa', fontSize: '0.84rem' }}>
            🔍 رُوجع {new Date(req.reviewed_at).toLocaleDateString('ar-SA')}
          </span>
        )}
      </div>

      {/* ملاحظات الأدمن */}
      {req.admin_notes && (
        <div style={{
          background: req.status === 'rejected' ? 'rgba(248,113,113,0.08)' : 'rgba(78,141,156,0.08)',
          border: `1px solid ${req.status === 'rejected' ? '#f8717133' : COLORS.border}`,
          borderRadius: 10,
          padding: '10px 14px',
          color: '#aaa9cc',
          fontSize: '0.84rem',
        }}>
          💬 {req.admin_notes}
        </div>
      )}

      {/* رسالة خاصة بكل الحالات */}
      {req.status === 'pending' && (
        <div style={{
          color: '#f5c84299', fontSize: '0.82rem',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>⏳</span>
          طلبك قيد المراجعة — ستصلك رسالة بريدية عند البت فيه
        </div>
      )}

      {req.status === 'approved' && (
        <div style={{
          background: 'rgba(133,199,154,0.08)',
          border: '1px solid rgba(133,199,154,0.2)',
          borderRadius: 10,
          padding: '10px 14px',
          color: '#85C79A',
          fontSize: '0.84rem',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span>🎉</span>
          <span>تم اعتماد مؤسستك! تحقق من بريدك للحصول على كلمة مرور الشاشة.</span>
          <Link href="/institutions" style={{
            marginRight: 'auto', color: COLORS.teal,
            background: 'rgba(78,141,156,0.15)',
            padding: '4px 14px', borderRadius: 20,
            textDecoration: 'none', fontSize: '0.8rem',
            fontWeight: 700,
          }}>
            عرض مؤسستك →
          </Link>
        </div>
      )}

      {req.status === 'rejected' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/institution-request" style={{
            color: COLORS.teal,
            background: 'rgba(78,141,156,0.1)',
            border: `1px solid ${COLORS.border}`,
            padding: '6px 18px', borderRadius: 20,
            textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
          }}>
            إعادة التقديم →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── السايدبار ────────────────────────────────────────────────────────────────
function Sidebar({ requests }: { requests: MyInstitutionRequest[] }) {
  const pending  = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  return (
    <aside style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: '24px 20px',
      display: 'flex', flexDirection: 'column', gap: 20,
      height: 'fit-content',
      position: 'sticky', top: 20,
    }}>
      <h3 style={{ margin: 0, color: COLORS.mint, fontSize: '1rem' }}>ملخص الطلبات</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'قيد المراجعة', count: pending,  color: '#f5c842' },
          { label: 'مُعتمد',       count: approved, color: '#85C79A' },
          { label: 'مرفوض',        count: rejected, color: '#f87171' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px',
            background: `${item.color}0d`,
            border: `1px solid ${item.color}33`,
            borderRadius: 10,
          }}>
            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{item.label}</span>
            <span style={{
              color: item.color, fontWeight: 800,
              fontSize: '1.1rem',
            }}>{item.count}</span>
          </div>
        ))}
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}` }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link href="/institution-request" style={{
          background: `linear-gradient(135deg,${COLORS.teal},${COLORS.navy})`,
          color: '#fff', textDecoration: 'none',
          textAlign: 'center', padding: '10px',
          borderRadius: 12, fontSize: '0.88rem', fontWeight: 700,
        }}>
          ＋ تقديم طلب اعتماد جديد
        </Link>
        <Link href="/profile" style={{
          color: '#6e6a99', textDecoration: 'none',
          textAlign: 'center', fontSize: '0.8rem',
        }}>
          ← العودة للملف الشخصي
        </Link>
      </div>
    </aside>
  );
}

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function MyInstitutionRequestClient() {
  const [requests, setRequests] = useState<MyInstitutionRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    try {
      const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const u = JSON.parse(userStr);
        setEmailVerified(!!u.email_verified);
      }
    } catch (_) {}

    fetchMyInstitutionRequests()
      .then(data => { setRequests(data); setLoading(false); })
      .catch(() => { setError('تعذّر تحميل الطلبات'); setLoading(false); });
  }, []);

  const handleResend = async () => {
    setResendState('sending');
    await resendVerification();
    setResendState('sent');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      direction: 'rtl',
      fontFamily: 'Tajawal, sans-serif',
    }}>
      {/* هيدر */}
      <div style={{
        background: `linear-gradient(180deg, ${COLORS.navy}cc 0%, transparent 100%)`,
        padding: '32px 24px 24px',
        borderBottom: `1px solid ${COLORS.border}`,
        marginBottom: 36,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, color: '#666', fontSize: '0.82rem' }}>
            <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>الرئيسية</Link>
            <span>/</span>
            <Link href="/profile" style={{ color: '#666', textDecoration: 'none' }}>الملف الشخصي</Link>
            <span>/</span>
            <span style={{ color: COLORS.teal }}>طلبات الاعتماد</span>
          </nav>
          <h1 style={{
            margin: 0,
            background: `linear-gradient(135deg, ${COLORS.mint}, ${COLORS.teal})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            fontWeight: 900,
          }}>
            🏛️ طلبات اعتماد المؤسسة
          </h1>
          <p style={{ color: '#6e6a99', margin: '8px 0 0', fontSize: '0.9rem' }}>
            تابع حالة طلباتك لاعتماد مؤسستك في المجرة الحضارية
          </p>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 240px',
        gap: 28,
      }}>
        {/* قائمة الطلبات */}
        <div>
          {/* بانر تأكيد البريد */}
          {emailVerified === false && (
            <div style={{
              background: 'rgba(245,200,66,0.08)',
              border: '1px solid rgba(245,200,66,0.35)',
              borderRadius: 14,
              padding: '18px 22px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '1.5rem' }}>📧</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: 0, color: '#f5c842', fontWeight: 700, fontSize: '0.95rem' }}>
                  يجب تأكيد بريدك الإلكتروني أولاً
                </p>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
                  لا يمكن تقديم طلب اعتماد مؤسسة حتى يتم تأكيد بريدك الإلكتروني
                </p>
              </div>
              <button
                onClick={handleResend}
                disabled={resendState !== 'idle'}
                style={{
                  background: resendState === 'sent' ? 'rgba(133,199,154,0.2)' : 'rgba(245,200,66,0.15)',
                  border: '1px solid rgba(245,200,66,0.4)',
                  color: resendState === 'sent' ? '#85C79A' : '#f5c842',
                  padding: '8px 18px',
                  borderRadius: 20,
                  cursor: resendState === 'idle' ? 'pointer' : 'default',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {resendState === 'idle' && 'إعادة إرسال رابط التأكيد'}
                {resendState === 'sending' && '⏳ جاري الإرسال...'}
                {resendState === 'sent' && '✅ تم الإرسال — تحقق من بريدك'}
              </button>
            </div>
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#556' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <p>جارٍ التحميل…</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#f87171' }}>
              <p>{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 16, padding: '48px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏛️</div>
              <h3 style={{ color: '#aaa', fontWeight: 500, marginBottom: 8 }}>
                لا توجد طلبات بعد
              </h3>
              <p style={{ color: '#556', fontSize: '0.9rem', marginBottom: 24 }}>
                قدّم طلب اعتماد لمؤسستك في المجرة الحضارية
              </p>
              <Link href="/institution-request" style={{
                background: `linear-gradient(135deg,${COLORS.teal},${COLORS.navy})`,
                color: '#fff', textDecoration: 'none',
                padding: '12px 30px', borderRadius: 30,
                fontWeight: 700, fontSize: '0.95rem',
              }}>
                تقديم طلب اعتماد
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {requests.map(req => (
                <RequestCard key={req.id} req={req} />
              ))}
            </div>
          )}
        </div>

        {/* السايدبار */}
        <Sidebar requests={requests} />
      </div>

      {/* ستايل موبايل */}
      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          aside[style*="sticky"] {
            position: static !important;
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}
