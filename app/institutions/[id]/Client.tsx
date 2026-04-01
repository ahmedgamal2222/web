'use client';

import { useEffect, useState } from 'react';
import { Institution, Agreement } from '@/lib/types';
import { fetchInstitution, fetchEvents, fetchNews, API_BASE, uploadImage } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import AgreementDetails from '@/components/AgreementDetails';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

const getTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    educational: 'تعليمية',
    research: 'بحثية',
    cultural: 'ثقافية',
    charitable: 'خيرية',
    media: 'إعلامية',
    developmental: 'تنموية',
  };
  return types[type] || type || 'عامة';
};

const getStatusColor = (status: string): string => {
  switch(status) {
    case 'active': return COLORS.softGreen;
    case 'pending': return '#FFC107';
    case 'completed': return COLORS.teal;
    default: return '#9E9E9E';
  }
};

const getScreenStatus = (institution: Institution): { text: string; color: string; icon: string } => {
  if (institution.screen_active) {
    return { text: 'الشاشة نشطة', color: COLORS.softGreen, icon: '✨' };
  }
  return { text: 'الشاشة غير نشطة', color: '#9E9E9E', icon: '⚪' };
};

const getInstitutionStatus = (institution: Institution): { text: string; color: string; icon: string } => {
  switch(institution.status) {
    case 'active':   return { text: 'نشطة',            color: COLORS.softGreen, icon: '🟢' };
    case 'inactive': return { text: 'غير نشطة',        color: '#9E9E9E',        icon: '⚪' };
    case 'pending':  return { text: 'قيد الانتظار',    color: '#FFC107',        icon: '⏳' };
    default:         return { text: 'غير معروف',        color: '#9E9E9E',        icon: '❓' };
  }
};

const getStatusText = (status: string): string => {
  switch(status) {
    case 'active':   return 'نشط';
    case 'inactive': return 'غير نشط';
    case 'pending':  return 'قيد الانتظار';
    case 'completed':return 'مكتمل';
    default:         return 'غير معروف';
  }
};

const getInitial = (institution: Institution): string => {
  if (institution.name_ar?.length)  return institution.name_ar.charAt(0);
  if (institution.name?.length)     return institution.name.charAt(0);
  if (institution.name_en?.length)  return institution.name_en.charAt(0);
  return 'م';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ── Hero ────────────────────────────────────────────────────
function HeroSection({ institution }: { institution: Institution }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal} 100%)`, padding: '60px 40px 80px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.1, background: `radial-gradient(circle at 20% 30%, ${COLORS.lightMint} 0%, transparent 30%), radial-gradient(circle at 80% 70%, ${COLORS.softGreen} 0%, transparent 40%), repeating-linear-gradient(45deg, transparent 0px, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px)` }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30, flexWrap: 'wrap' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.darkNavy, textDecoration: 'none', padding: '10px 20px', background: COLORS.lightMint, borderRadius: 40, fontSize: '0.9rem', backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.lightMint}`, fontWeight: 700, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = COLORS.softGreen; e.currentTarget.style.borderColor = COLORS.softGreen; }} onMouseLeave={e => { e.currentTarget.style.background = COLORS.lightMint; e.currentTarget.style.borderColor = COLORS.lightMint; }}>
            <span>✦</span>المجرة الحضارية
          </Link>
          <span style={{ color: `${COLORS.lightMint}80`, fontSize: '1rem' }}></span>
          <Link href="/institutions" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.lightMint, textDecoration: 'none', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: 40, fontSize: '0.9rem', backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.lightMint}`, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = COLORS.lightMint; e.currentTarget.style.color = COLORS.darkNavy; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = COLORS.lightMint; }}>
            <span>←</span>الذهاب إلى قائمة المؤسسات
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ width: 150, height: 150, borderRadius: 40, background: `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', fontWeight: 'bold', color: COLORS.darkNavy, boxShadow: `0 20px 40px ${COLORS.darkNavy}60`, border: `4px solid ${COLORS.lightMint}` }}>
            {institution.logo_url ? (
              <Image src={institution.logo_url} alt={institution.name_ar || institution.name || 'مؤسسة'} width={100} height={100} style={{ borderRadius: 30, objectFit: 'cover' }} />
            ) : getInitial(institution)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, color: COLORS.lightMint, marginBottom: 10, textShadow: `3px 3px 0 ${COLORS.darkNavy}` }}>
              {institution.name_ar || institution.name || institution.name_en || 'مؤسسة غير مسماة'}
            </h1>
            <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginBottom: 15 }}>
              <span style={{ background: COLORS.lightMint, color: COLORS.darkNavy, padding: '8px 20px', borderRadius: 40, fontSize: '0.9rem', fontWeight: 600 }}>{getTypeLabel(institution.type)}</span>
              {institution.is_verified && (
                <span style={{ background: COLORS.softGreen, color: COLORS.darkNavy, padding: '8px 20px', borderRadius: 40, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><span>✓</span>مؤسسة موثقة</span>
              )}
              {(() => { const s = getScreenStatus(institution); return <span style={{ background: s.color + '20', color: s.color, padding: '8px 20px', borderRadius: 40, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${s.color}` }}><span>{s.icon}</span>{s.text}</span>; })()}
              {(() => { const s = getInstitutionStatus(institution); return <span style={{ background: s.color + '20', color: s.color, padding: '8px 20px', borderRadius: 40, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${s.color}` }}><span>{s.icon}</span>{s.text}</span>; })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontSize: '1.1rem', marginBottom: 10 }}><span>📍</span><span>{institution.city || 'غير محدد'}، {institution.country || 'غير محدد'}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.lightMint, fontSize: '0.9rem', opacity: 0.8 }}><span>📅</span><span>تاريخ التسجيل: {formatDate(institution.created_at)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Info Card ────────────────────────────────────────────────
function InfoCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: `0 5px 20px ${COLORS.darkNavy}20`, border: `1px solid ${COLORS.softGreen}40`, transition: 'transform 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${COLORS.darkNavy}30`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 5px 20px ${COLORS.darkNavy}20`; }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: '0.8rem', color: COLORS.teal, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: COLORS.darkNavy }}>{value}</div>
    </div>
  );
}

// ── Compute effective weight from institution metrics ─────────
function computeEffectiveWeight(institution: Institution, agreementsCount: number): number {
  const raw =
    (institution.employees_count    || 0) * 0.5  +
    (institution.projects_count     || 0) * 5    +
    (institution.beneficiaries_count|| 0) * 0.1  +
    agreementsCount                               * 15;
  return Math.min(1, raw / 500);
}

// ── Stats Grid ───────────────────────────────────────────────
function StatsGrid({ institution, agreementsCount }: { institution: Institution; agreementsCount: number }) {
  const effectiveWeight = institution.weight > 0
    ? institution.weight
    : computeEffectiveWeight(institution, agreementsCount);
  return (
    <div style={{ maxWidth: 1200, margin: '-40px auto 40px', padding: '0 20px', position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
      <InfoCard icon="👥" label="عدد الموظفين"  value={institution.employees_count?.toLocaleString()    || 'غير محدد'} />
      <InfoCard icon="📊" label="المشاريع"       value={institution.projects_count?.toLocaleString()     || 'غير محدد'} />
      <InfoCard icon="🎯" label="المستفيدين"     value={institution.beneficiaries_count?.toLocaleString() || 'غير محدد'} />
      <InfoCard icon="⭐" label="وزن التأثير"    value={effectiveWeight.toFixed(2)} />
      <InfoCard icon="📅" label="تأسست عام"      value={institution.founded_year                         || 'غير محدد'} />
    </div>
  );
}

// ── Quick Actions ────────────────────────────────────────────
function QuickActions({ institution }: { institution: Institution }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '0 20px', display: 'flex', gap: 15, flexWrap: 'wrap', justifyContent: 'center' }}>
      {institution.website && (
        <a href={institution.website} target="_blank" rel="noopener noreferrer" style={{ background: COLORS.teal, color: 'white', padding: '12px 30px', borderRadius: 40, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = COLORS.darkNavy; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = COLORS.teal; e.currentTarget.style.transform = 'translateY(0)'; }}><span>🌐</span>الموقع الإلكتروني</a>
      )}
      {institution.email && (
        <a href={`mailto:${institution.email}`} style={{ background: COLORS.softGreen, color: COLORS.darkNavy, padding: '12px 30px', borderRadius: 40, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = COLORS.lightMint; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = COLORS.softGreen; e.currentTarget.style.transform = 'translateY(0)'; }}><span>📧</span>{institution.email}</a>
      )}
      {institution.phone && (
        <a href={`tel:${institution.phone}`} style={{ background: COLORS.lightMint, color: COLORS.darkNavy, padding: '12px 30px', borderRadius: 40, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = COLORS.softGreen; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = COLORS.lightMint; e.currentTarget.style.transform = 'translateY(0)'; }}><span>📞</span>{institution.phone}</a>
      )}
    </div>
  );
}

// ── About ────────────────────────────────────────────────────
function AboutSection({ institution }: { institution: Institution }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '40px', background: 'white', borderRadius: 30, boxShadow: `0 10px 40px ${COLORS.darkNavy}20`, border: `1px solid ${COLORS.softGreen}40` }}>
      <h2 style={{ fontSize: '1.8rem', color: COLORS.darkNavy, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><span>📋</span>عن المؤسسة</h2>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#444', marginBottom: 30 }}>
        {institution.description || `تأسست مؤسسة ${institution.name_ar || institution.name || institution.name_en || 'غير معروفة'} عام ${institution.founded_year || 'غير محدد'}، وهي مؤسسة ${getTypeLabel(institution.type)} تعمل في مجال تعزيز العمل الحضاري والتنمية المستدامة.`}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginTop: 30 }}>
        {institution.address && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.teal }}><span>📍</span><span>{institution.address}</span></div>}
        {institution.registration_number && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.teal }}><span>📋</span><span>رقم التسجيل: {institution.registration_number}</span></div>}
        {institution.social_media && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.teal }}><span>📱</span><a href={institution.social_media} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.teal, textDecoration: 'none' }}>منصات التواصل</a></div>}
        {institution.sub_type && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.teal }}><span>🏷️</span><span>نوع فرعي: {institution.sub_type}</span></div>}
      </div>
    </div>
  );
}

// ── Owner Actions ─────────────────────────────────────────────
function OwnerActions({ institutionId }: { institutionId: string }) {
  return (
    <div style={{
      maxWidth: 1200, margin: '0 auto 28px',
      background: `linear-gradient(135deg, ${COLORS.darkNavy}06, ${COLORS.teal}08)`,
      borderRadius: 20, padding: '20px 28px',
      border: `1px dashed ${COLORS.teal}50`,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '0.85rem', color: COLORS.teal, fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        🛠️ أدوات صاحب المؤسسة
      </span>
      <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link
          href={`/news/create?institution_id=${institutionId}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 20px', borderRadius: 30,
            background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
            color: '#EDF7BD', textDecoration: 'none',
            fontSize: '0.88rem', fontWeight: 700,
            boxShadow: `0 3px 12px ${COLORS.teal}30`,
          }}
        >
          <span>+</span> إضافة خبر
        </Link>
        <Link
          href={`/events/create?institution_id=${institutionId}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 20px', borderRadius: 30,
            background: `linear-gradient(135deg, ${COLORS.softGreen}, ${COLORS.teal})`,
            color: COLORS.darkNavy, textDecoration: 'none',
            fontSize: '0.88rem', fontWeight: 700,
            boxShadow: `0 3px 12px ${COLORS.softGreen}30`,
          }}
        >
          <span>+</span> إضافة فعالية
        </Link>
      </div>
    </div>
  );
}

// ── Ad Create Modal ───────────────────────────────────────────
const AD_COST = 20;
function AdCreateModal({
  institutionId, coins, onClose, onSuccess,
}: {
  institutionId: string; coins: number;
  onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '', content: '', image_url: '',
    start_date: '', end_date: '',
    target_type: 'all' as 'all' | 'country' | 'city',
    target_value: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const canAfford = coins >= AD_COST;

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!canAfford) return;
    if (!form.title || !form.start_date || !form.end_date) { setErr('يرجى ملء الحقول المطلوبة'); return; }
    setSubmitting(true); setErr('');
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        setUploadProgress(1);
        const uploaded = await uploadImage(imageFile, (p: number) => setUploadProgress(p));
        imageUrl = (uploaded as any).url;
        setUploadProgress(100);
      }
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify({ ...form, image_url: imageUrl, institution_id: Number(institutionId) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل إنشاء الإعلان');
      // خصم الكوين من localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        u.coins = (u.coins ?? 500) - AD_COST;
        localStorage.setItem('user', JSON.stringify(u));
      }
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const iSt: React.CSSProperties = {
    width: '100%', padding: '11px 15px', background: 'white',
    border: `1.5px solid ${COLORS.teal}40`, borderRadius: 10,
    color: COLORS.darkNavy, fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20, direction: 'rtl',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white', borderRadius: 24, padding: 28,
        width: '100%', maxWidth: 520,
        boxShadow: `0 20px 60px ${COLORS.darkNavy}30`,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: COLORS.darkNavy }}>📢 إنشاء إعلان جديد</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: '1rem', cursor: 'pointer', color: '#555' }}>✕</button>
        </div>

        {/* Coins */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `${COLORS.teal}10`, borderRadius: 12, padding: '10px 14px', marginBottom: 18,
        }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>رصيدك الحالي</span>
          <span style={{ color: canAfford ? COLORS.teal : '#e53935', fontWeight: 800, fontSize: '1rem' }}>
            🪙 {coins} كوين
          </span>
        </div>

        {!canAfford ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#e53935', marginBottom: 20 }}>رصيدك غير كافٍ ({coins} / {AD_COST} كوين مطلوب)</p>
            <a href="https://paypal.me/hadmaj?amount=30" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-block', background: '#0070ba', color: 'white',
                padding: '12px 28px', borderRadius: 30, textDecoration: 'none',
                fontWeight: 700, fontSize: '1rem',
              }}
            >
              💳 تجديد الاشتراك – 30$ عبر PayPal
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {err && <div style={{ background: '#fdecea', border: '1px solid #e53935', borderRadius: 10, padding: '10px 14px', color: '#c62828', fontSize: '0.9rem' }}>{err}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.88rem', color: COLORS.teal, fontWeight: 700 }}>عنوان الإعلان *</label>
              <input type="text" value={form.title} onChange={set('title')} required placeholder="اكتب عنوان الإعلان" style={iSt} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.88rem', color: COLORS.teal, fontWeight: 700 }}>نص الإعلان</label>
              <textarea value={form.content} onChange={set('content')} placeholder="تفاصيل الإعلان..." rows={3} style={{ ...iSt, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.88rem', color: COLORS.teal, fontWeight: 700 }}>صورة الإعلان</label>
              {imagePreview && <div style={{ height: 130, background: `url(${imagePreview}) center/cover`, borderRadius: 10, marginBottom: 4 }} />}
              <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: '0.9rem' }} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ background: '#e0e0e0', borderRadius: 10, height: 5, overflow: 'hidden' }}>
                  <div style={{ background: COLORS.teal, height: '100%', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                </div>
              )}
              {!imageFile && (
                <input type="url" value={form.image_url} onChange={set('image_url')} placeholder="أو رابط الصورة مباشرة https://..." style={{ ...iSt, marginTop: 4 }} />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.88rem', color: COLORS.teal, fontWeight: 700 }}>تاريخ البداية *</label>
                <input type="date" value={form.start_date} onChange={set('start_date')} required style={iSt} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.88rem', color: COLORS.teal, fontWeight: 700 }}>تاريخ النهاية *</label>
                <input type="date" value={form.end_date} onChange={set('end_date')} required style={iSt} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.88rem', color: COLORS.teal, fontWeight: 700 }}>نطاق الاستهداف</label>
              <select value={form.target_type} onChange={e => setForm(p => ({ ...p, target_type: e.target.value as any, target_value: '' }))} style={iSt}>
                <option value="all">🌍 الجميع</option>
                <option value="country">🏳️ دولة محددة</option>
                <option value="city">🏙️ مدينة محددة</option>
              </select>
            </div>

            {form.target_type !== 'all' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.88rem', color: COLORS.teal, fontWeight: 700 }}>
                  {form.target_type === 'country' ? 'كود الدولة (ISO)' : 'اسم المدينة'}
                </label>
                <input
                  type="text" value={form.target_value} onChange={set('target_value')}
                  placeholder={form.target_type === 'country' ? 'مثال: SA أو EG' : 'مثال: Riyadh أو Cairo'}
                  style={iSt}
                />
              </div>
            )}

            {/* ملخص التكلفة */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fffde7', borderRadius: 10, padding: '10px 14px',
              border: '1px solid #ffe082',
            }}>
              <span style={{ fontSize: '0.88rem', color: '#555' }}>تكلفة الإعلان</span>
              <span style={{ color: '#f9a825', fontWeight: 800, fontSize: '0.9rem' }}>
                {AD_COST} كوين ← يتبقى {coins - AD_COST} كوين
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '13px', background: submitting ? COLORS.teal + '80' : COLORS.teal,
                color: 'white', border: 'none', borderRadius: 40,
                fontSize: '1rem', fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                boxShadow: `0 6px 20px ${COLORS.teal}40`,
              }}
            >
              {submitting ? 'جاري النشر...' : `✦ نشر الإعلان (${AD_COST} كوين)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Announcements (events + news unified feed) ─────────────────
type AnnouncementTab = 'all' | 'events' | 'news';
function AnnouncementsSection({
  events, news, institutionId, isOwner, isAdmin,
}: {
  events: any[]; news: any[];
  institutionId?: string; isOwner?: boolean; isAdmin?: boolean;
}) {
  const [tab, setTab] = useState<AnnouncementTab>('all');
  const [coins, setCoins] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adDone, setAdDone] = useState(false);
  const canCreate = isOwner || isAdmin;

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (stored) setCoins(JSON.parse(stored).coins ?? 500);
  }, []);

  const allItems = [
    ...events.map(e => ({ ...e, _type: 'event' as const })),
    ...news.map(n => ({ ...n, _type: 'news' as const })),
  ].sort((a, b) =>
    new Date(b.published_at || b.start_datetime || b.created_at || 0).getTime() -
    new Date(a.published_at || a.start_datetime || a.created_at || 0).getTime()
  );

  const shown = tab === 'all'
    ? allItems
    : allItems.filter(i => i._type === (tab === 'events' ? 'event' : 'news'));

  const TabBtn = ({ id, label, count }: { id: AnnouncementTab; label: string; count: number }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 18px', borderRadius: 30, border: 'none', cursor: 'pointer',
        fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
        background: tab === id ? COLORS.teal : 'transparent',
        color: tab === id ? 'white' : COLORS.teal,
        boxShadow: tab === id ? `0 3px 12px ${COLORS.teal}30` : 'none',
      }}
    >
      {label}{count > 0 && <span style={{ opacity: 0.8 }}> ({count})</span>}
    </button>
  );

  // أزرار الإنشاء حسب التاب النشط
  const showNewsBtn   = canCreate && (tab === 'all' || tab === 'news');
  const showEventsBtn = canCreate && (tab === 'all' || tab === 'events');

  return (
    <div style={{
      maxWidth: 1200, margin: '0 auto 40px',
      background: 'white', borderRadius: 30,
      boxShadow: `0 10px 40px ${COLORS.darkNavy}18`,
      border: `1px solid ${COLORS.softGreen}40`,
      overflow: 'hidden',
    }}>
      {/* ─ رأس القسم ─ */}
      <div style={{
        padding: '20px 28px 0',
        background: `linear-gradient(135deg, ${COLORS.darkNavy}06, white)`,
        borderBottom: `1px solid ${COLORS.softGreen}25`,
      }}>
        {/* صف العنوان + الكوين + الإنشاء */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          {/* عنوان */}
          <h2 style={{ fontSize: '1.5rem', color: COLORS.darkNavy, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📢</span> إعلانات المؤسسة
          </h2>

          {/* كوين + أزرار الإنشاء */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* شارة الكوين */}
            {canCreate && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 30,
                background: coins > 0 ? `${COLORS.softGreen}18` : '#ff525218',
                border: `1px solid ${coins > 0 ? COLORS.softGreen : '#ff5252'}40`,
              }}>
                <span style={{ fontSize: '1rem' }}>🪙</span>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: coins > 0 ? COLORS.softGreen : '#e53935' }}>
                  {coins}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#888' }}>كوين متاح</span>
              </div>
            )}

            {showNewsBtn && (
              <Link
                href={`/news/create${institutionId ? `?institution_id=${institutionId}` : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 30,
                  background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`,
                  color: COLORS.lightMint, textDecoration: 'none',
                  fontSize: '0.83rem', fontWeight: 700,
                  boxShadow: `0 3px 10px ${COLORS.teal}30`,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <span style={{ fontSize: '0.95rem' }}>+</span> إنشاء خبر
              </Link>
            )}

            {showEventsBtn && (
              <Link
                href={`/events/create${institutionId ? `?institution_id=${institutionId}` : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 30,
                  background: `linear-gradient(135deg, ${COLORS.softGreen}, ${COLORS.teal})`,
                  color: 'white', textDecoration: 'none',
                  fontSize: '0.83rem', fontWeight: 700,
                  boxShadow: `0 3px 10px ${COLORS.softGreen}30`,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <span style={{ fontSize: '0.95rem' }}>+</span> إنشاء فعالية
              </Link>
            )}

            {/* زر إضافة إعلان */}
            {canCreate && (
              <button
                onClick={() => setShowAdModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 30, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, #f9a825, #ff6f00)`,
                  color: 'white', fontSize: '0.83rem', fontWeight: 700,
                  boxShadow: '0 3px 10px #f9a82530',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <span>📢</span> إضافة إعلان
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({AD_COST} كوين)</span>
              </button>
            )}
          </div>
        </div>

        {/* تابات */}
        <div style={{ display: 'flex', gap: 4, background: `${COLORS.teal}10`, borderRadius: 40, padding: '4px', width: 'fit-content', marginBottom: 16 }}>
          <TabBtn id="all"    label="الكل"       count={allItems.length} />
          <TabBtn id="events" label="📅 فعاليات" count={events.length} />
          <TabBtn id="news"   label="📰 أخبار"   count={news.length} />
        </div>
      </div>

      {/* ─ المحتوى ─ */}
      <div style={{ padding: '24px 28px' }}>
        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#aaa' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>
              {tab === 'events' ? '📅' : tab === 'news' ? '📰' : '📢'}
            </span>
            <p style={{ margin: '0 0 20px', fontSize: '1rem' }}>
              {tab === 'events' ? 'لا توجد فعاليات حتى الآن'
               : tab === 'news' ? 'لا توجد أخبار حتى الآن'
               : 'لا توجد إعلانات حتى الآن'}
            </p>
            {/* زر إنشاء في حالة الفراغ */}
            {tab === 'news' && canCreate && (
              <Link
                href={`/news/create${institutionId ? `?institution_id=${institutionId}` : ''}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', borderRadius: 30,
                  background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`,
                  color: COLORS.lightMint, textDecoration: 'none',
                  fontSize: '0.9rem', fontWeight: 700,
                }}
              >
                <span>+</span> أضف أول خبر
              </Link>
            )}
            {tab === 'events' && canCreate && (
              <Link
                href={`/events/create${institutionId ? `?institution_id=${institutionId}` : ''}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', borderRadius: 30,
                  background: `linear-gradient(135deg, ${COLORS.softGreen}, ${COLORS.teal})`,
                  color: 'white', textDecoration: 'none',
                  fontSize: '0.9rem', fontWeight: 700,
                }}
              >
                <span>+</span> أضف أول فعالية
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {shown.map(item => (
              <AnnouncementCard key={`${item._type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* نجاح الإعلان */}
      {adDone && (
        <div style={{
          margin: '0 28px 16px', padding: '12px 18px', borderRadius: 12,
          background: `${COLORS.softGreen}18`, border: `1px solid ${COLORS.softGreen}50`,
          color: COLORS.softGreen, fontWeight: 700, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>✅</span> تم نشر الإعلان بنجاح وسيظهر للمستخدمين قريباً!
        </div>
      )}

      {/* Modal الإعلان */}
      {showAdModal && institutionId && (
        <AdCreateModal
          institutionId={institutionId}
          coins={coins}
          onClose={() => setShowAdModal(false)}
          onSuccess={() => {
            setShowAdModal(false);
            setAdDone(true);
            setCoins(c => c - AD_COST);
            setTimeout(() => setAdDone(false), 6000);
          }}
        />
      )}
    </div>
  );
}

function AnnouncementCard({ item }: { item: any & { _type: 'event' | 'news' } }) {
  const isEvent = item._type === 'event';
  const accent  = isEvent ? COLORS.teal : COLORS.softGreen;
  const date    = isEvent
    ? (item.start_datetime ? new Date(item.start_datetime).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '')
    : (item.published_at  ? new Date(item.published_at).toLocaleDateString('ar-EG',  { year: 'numeric', month: 'long', day: 'numeric' }) : '');

  return (
    <div
      style={{
        borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${accent}30`,
        boxShadow: `0 3px 16px ${COLORS.darkNavy}0c`,
        background: 'white', transition: 'transform 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${accent}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 3px 16px ${COLORS.darkNavy}0c`; }}
    >
      {(item.image_url || item.cover_image) && (
        <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
          <img
            src={item.image_url || item.cover_image}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', top: 10, right: 12,
            background: accent, color: 'white',
            borderRadius: 30, padding: '3px 12px',
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            {isEvent ? '📅 فعالية' : '📰 خبر'}
          </div>
        </div>
      )}

      <div style={{ padding: '18px 20px' }}>
        {!(item.image_url || item.cover_image) && (
          <span style={{
            display: 'inline-block', marginBottom: 10,
            background: `${accent}15`, color: accent,
            borderRadius: 30, padding: '3px 12px',
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            {isEvent ? '📅 فعالية' : '📰 خبر'}
          </span>
        )}
        <h3 style={{ fontSize: '1rem', color: COLORS.darkNavy, marginBottom: 8, lineHeight: 1.4, fontWeight: 700 }}>
          {item.title}
        </h3>
        {(item.description || item.content) && (
          <p style={{
            fontSize: '0.85rem', color: '#666', lineHeight: 1.6, margin: '0 0 12px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}>
            {item.description || item.content}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.78rem', color: '#888' }}>
          {date && <span>📅 {date}</span>}
          {isEvent && item.location && <span>📍 {item.location}</span>}
          {isEvent && item.is_online && <span style={{ color: COLORS.teal }}>💻 عبر الإنترنت</span>}
        </div>
        <Link
          href={isEvent ? `/events/${item.id}` : `/news/${item.id}`}
          style={{
            display: 'inline-block', marginTop: 14,
            padding: '7px 18px', borderRadius: 30,
            border: `1px solid ${accent}50`, color: accent,
            textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = accent; }}
        >
          اقرأ المزيد ←
        </Link>
      </div>
    </div>
  );
}

// ── Agreements ───────────────────────────────────────────────
function AgreementsSection({ agreements, onViewAgreement }: { agreements?: Agreement[]; onViewAgreement: (id: string) => void }) {
  if (!agreements?.length) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '60px', background: 'white', borderRadius: 30, boxShadow: `0 10px 40px ${COLORS.darkNavy}20`, border: `1px solid ${COLORS.softGreen}40`, textAlign: 'center' }}>
        <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>🔗</span>
        <h3 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>لا توجد اتفاقيات حالياً</h3>
        <p style={{ color: COLORS.teal }}>هذه المؤسسة ليس لديها اتفاقيات نشطة في الوقت الحالي</p>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '40px', background: 'white', borderRadius: 30, boxShadow: `0 10px 40px ${COLORS.darkNavy}20`, border: `1px solid ${COLORS.softGreen}40` }}>
      <h2 style={{ fontSize: '1.8rem', color: COLORS.darkNavy, marginBottom: 30, display: 'flex', alignItems: 'center', gap: 10 }}><span>🔗</span>الاتفاقيات ({agreements.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {agreements.map(agreement => (
          <button key={agreement.id} onClick={() => onViewAgreement(agreement.id.toString())} style={{ background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`, border: `1px solid ${getStatusColor(agreement.status)}`, borderRadius: 20, padding: '20px', cursor: 'pointer', textAlign: 'right', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${COLORS.darkNavy}30`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px', background: getStatusColor(agreement.status) }} />
            <div style={{ marginRight: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: getStatusColor(agreement.status) }} />
                <span style={{ color: getStatusColor(agreement.status), fontSize: '0.8rem', fontWeight: 600 }}>{getStatusText(agreement.status)}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', color: COLORS.darkNavy, marginBottom: 10 }}>{agreement.title || `اتفاقية ${agreement.type || 'عامة'}`}</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 15, lineHeight: 1.6 }}>{agreement.description || 'اتفاقية تعاون بين المؤسستين في المجال الثقافي والتعليمي.'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: COLORS.teal }}>
                <span>{agreement.from_name_ar || agreement.from_name} ← {agreement.to_name_ar || agreement.to_name}</span>
                {agreement.signed_date && <span>{formatDate(agreement.signed_date)}</span>}
              </div>
              {agreement.strength && (
                <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                  {[1, 2, 3].map(i => <span key={i} style={{ color: i <= agreement.strength! ? '#FFD700' : '#ddd', fontSize: '1.2rem' }}>★</span>)}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Screen Password ──────────────────────────────────────────
function ScreenPasswordSection({ institution, currentUser }: { institution: Institution; currentUser: any }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!institution.screen_password) return null;
  const isOwner = currentUser?.institution_id === institution.id;
  const isAdmin = currentUser?.role === 'admin';
  if (!isOwner && !isAdmin) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(institution.screen_password!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '40px', background: `linear-gradient(135deg, ${COLORS.darkNavy}08, white)`, borderRadius: 30, boxShadow: `0 10px 40px ${COLORS.darkNavy}20`, border: `2px solid ${COLORS.teal}40` }}>
      <h2 style={{ fontSize: '1.8rem', color: COLORS.darkNavy, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><span>📺</span>الشاشة الحضارية</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '24px', border: `1px solid ${COLORS.teal}40`, boxShadow: `0 4px 15px ${COLORS.darkNavy}10` }}>
          <div style={{ fontSize: '0.8rem', color: COLORS.teal, marginBottom: 8, fontWeight: 600 }}>🔑 كلمة مرور الشاشة</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{ flex: 1, background: `${COLORS.darkNavy}08`, padding: '10px 16px', borderRadius: 12, fontSize: '1.1rem', fontFamily: 'monospace', color: COLORS.darkNavy, letterSpacing: show ? '0.1em' : '0.3em', userSelect: show ? 'text' : 'none' }}>
              {show ? institution.screen_password : '••••••••'}
            </code>
            <button onClick={() => setShow(!show)} title={show ? 'إخفاء' : 'إظهار'} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${COLORS.teal}40`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{show ? '🙈' : '👁️'}</button>
            <button onClick={handleCopy} title="نسخ" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${COLORS.softGreen}40`, background: copied ? `${COLORS.softGreen}20` : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, transition: 'all 0.2s' }}>{copied ? '✅' : '📋'}</button>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 20, padding: '24px', border: `1px solid ${COLORS.softGreen}40`, boxShadow: `0 4px 15px ${COLORS.darkNavy}10` }}>
          <div style={{ fontSize: '0.8rem', color: COLORS.teal, marginBottom: 8, fontWeight: 600 }}>📊 حالة الشاشة</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: institution.screen_active ? COLORS.softGreen : '#9E9E9E', boxShadow: institution.screen_active ? `0 0 8px ${COLORS.softGreen}` : 'none' }} />
            <span style={{ fontWeight: 600, color: institution.screen_active ? COLORS.softGreen : '#9E9E9E' }}>{institution.screen_active ? 'الشاشة نشطة الآن' : 'الشاشة غير نشطة'}</span>
          </div>
          {institution.screen_last_active && <div style={{ fontSize: '0.85rem', color: '#666' }}>آخر نشاط: {new Date(institution.screen_last_active).toLocaleString('ar-EG')}</div>}
        </div>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`, borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: '0.85rem', color: COLORS.lightMint, fontWeight: 600 }}>🔗 فتح الشاشة</div>
          <a href={`/screen/${institution.id}`} target="_blank" rel="noopener noreferrer" style={{ background: COLORS.lightMint, color: COLORS.darkNavy, padding: '10px 20px', borderRadius: 30, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = COLORS.softGreen; }} onMouseLeave={e => { e.currentTarget.style.background = COLORS.lightMint; }}>📺 عرض الشاشة</a>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Nav ──────────────────────────────────────────────
function SidebarNav({ institutionId, isOwner, isAdmin }: { institutionId: string; isOwner: boolean; isAdmin: boolean }) {
  const navItems = [
    { href: '#about',         icon: '🏛️', label: 'عن المؤسسة' },
    { href: '#announcements', icon: '📢', label: 'إعلانات' },
    { href: '#agreements',    icon: '🔗', label: 'الاتفاقيات' },
    ...(isOwner || isAdmin ? [{ href: '#screen', icon: '📺', label: 'الشاشة الحضارية' }] : []),
  ];
  return (
    <div style={{ background: 'white', borderRadius: 22, padding: '20px 14px', boxShadow: `0 5px 24px ${COLORS.darkNavy}18`, border: `1px solid ${COLORS.softGreen}40` }}>
      <div style={{ fontSize: '0.82rem', color: COLORS.teal, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14, padding: '0 6px', textTransform: 'uppercase' }}>القائمة</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', color: COLORS.darkNavy, fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s', border: '1px solid transparent' }} onMouseEnter={e => { e.currentTarget.style.background = `${COLORS.teal}12`; e.currentTarget.style.borderColor = `${COLORS.teal}30`; e.currentTarget.style.color = COLORS.teal; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = COLORS.darkNavy; }}>
            <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      {(isOwner || isAdmin) && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${COLORS.softGreen}60`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href={`/institutions/${institutionId}/agreements`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, textDecoration: 'none', background: `linear-gradient(135deg, ${COLORS.darkNavy}, ${COLORS.teal})`, color: 'white', fontSize: '0.88rem', fontWeight: 700, transition: 'opacity 0.2s' }} onMouseEnter={e => { e.currentTarget.style.opacity = '0.87'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            <span style={{ fontSize: '1rem' }}>⚙️</span><span>إدارة الاتفاقيات</span>
          </Link>
          <Link href={`/institutions/${institutionId}/employees`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, textDecoration: 'none', background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})`, color: 'white', fontSize: '0.88rem', fontWeight: 700, transition: 'opacity 0.2s' }} onMouseEnter={e => { e.currentTarget.style.opacity = '0.87'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            <span style={{ fontSize: '1rem' }}>👥</span><span>إدارة الموظفين</span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main Client Component ────────────────────────────────────
export default function InstitutionClient() {
  const id = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
    : 'default';

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [institutionNews, setInstitutionNews] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const instData = await fetchInstitution(id);
        setInstitution(instData);
        setAgreements((instData as any).agreements || []);
        // تحميل الفعاليات والأخبار بالتوازي
        const [evs, allNews] = await Promise.all([
          fetchEvents(id),
          fetchNews(),
        ]);
        setEvents(evs);
        setInstitutionNews(allNews.filter((n: any) => Number(n.institution_id) === Number(id)));
      } catch (err: any) {
        console.error('Error loading institution:', err);
        setError(err.message || 'حدث خطأ في تحميل بيانات المؤسسة');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.lightMint} 0%, white 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, border: `5px solid ${COLORS.teal}`, borderTopColor: COLORS.softGreen, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h2 style={{ color: COLORS.darkNavy }}>جاري تحميل بيانات المؤسسة...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.lightMint} 0%, white 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: 30, boxShadow: `0 20px 40px ${COLORS.darkNavy}30` }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>⚠️</span>
          <h2 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>خطأ في التحميل</h2>
          <p style={{ color: COLORS.teal, marginBottom: 30 }}>{error}</p>
          <Link href="/institutions" style={{ background: COLORS.teal, color: 'white', padding: '12px 30px', borderRadius: 40, textDecoration: 'none', display: 'inline-block', fontWeight: 600 }}>العودة إلى القائمة</Link>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.lightMint} 0%, white 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: 30, boxShadow: `0 20px 40px ${COLORS.darkNavy}30` }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>🔍</span>
          <h2 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>المؤسسة غير موجودة</h2>
          <p style={{ color: COLORS.teal, marginBottom: 30 }}>لم نتمكن من العثور على المؤسسة المطلوبة</p>
          <Link href="/institutions" style={{ background: COLORS.teal, color: 'white', padding: '12px 30px', borderRadius: 40, textDecoration: 'none', display: 'inline-block', fontWeight: 600 }}>العودة إلى القائمة</Link>
        </div>
      </div>
    );
  }

  const isOwner = Number(currentUser?.institution_id) === institution.id;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.lightMint}20 0%, white 100%)`, direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <HeroSection institution={institution} />
      <StatsGrid institution={institution} agreementsCount={agreements.length} />
      <div style={{ maxWidth: 1260, margin: '0 auto', padding: '0 20px 40px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 24, height: 'fit-content' }}>
          <SidebarNav institutionId={id} isOwner={isOwner} isAdmin={isAdmin} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <QuickActions institution={institution} />
          <div id="about"><AboutSection institution={institution} /></div>
          <div id="announcements">
            <AnnouncementsSection
              events={events}
              news={institutionNews}
              institutionId={id}
              isOwner={isOwner}
              isAdmin={isAdmin}
            />
          </div>
          <div id="screen"><ScreenPasswordSection institution={institution} currentUser={currentUser} /></div>
          <div id="agreements"><AgreementsSection agreements={agreements} onViewAgreement={setSelectedAgreementId} /></div>
        </div>
      </div>
      {selectedAgreementId && <AgreementDetails agreementId={selectedAgreementId} onClose={() => setSelectedAgreementId(null)} />}
      <footer style={{ background: COLORS.darkNavy, color: 'white', padding: '30px', textAlign: 'center' }}>
        <p style={{ opacity: 0.8 }}>© 2026 المجرة الحضارية - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
