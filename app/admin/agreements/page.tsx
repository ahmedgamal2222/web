'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAgreements,
  fetchInstitutions,
  createAgreement,
  respondToAgreement,
  updateAgreementTerms,
  signAgreement,
  fetchAgreementDetails,
} from '@/lib/api';

// ─── Colour palette ────────────────────────────────────────────
const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  live: '#ff4444',
  warning: '#f59e0b',
  success: '#22c55e',
};

// ─── Types ─────────────────────────────────────────────────────
interface Term { id: string; text: string }
interface Agreement {
  id: number;
  from_id: number;
  to_id: number;
  from_name?: string; from_name_ar?: string; from_logo?: string;
  to_name?: string;   to_name_ar?: string;   to_logo?: string;
  type: string;
  title?: string;
  description?: string;
  start_date?: string; end_date?: string; is_permanent?: boolean;
  status: string;
  terms?: string;      // JSON string
  signature_from?: string;
  signature_to?: string;
  signed_at_from?: string;
  signed_at_to?: string;
  is_public?: boolean;
  created_at: string;
}

// ─── Status helpers ────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:       { label: 'مسودة',         color: '#94a3b8' },
  pending:     { label: 'قيد الانتظار',   color: C.warning },
  negotiating: { label: 'قيد التفاوض',   color: C.teal },
  signed:      { label: 'موقَّعة ✓',     color: C.success },
  rejected:    { label: 'مرفوضة',        color: C.live },
  active:      { label: 'نشطة',          color: C.softGreen },
};
const statusBadge = (s: string) => {
  const st = STATUS_LABELS[s] || { label: s, color: '#999' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40` }}>
      {st.label}
    </span>
  );
};

const TYPE_OPTIONS = [
  { value: 'partnership',     label: 'شراكة استراتيجية' },
  { value: 'research',        label: 'تعاون بحثي' },
  { value: 'exchange',        label: 'تبادل خبرات' },
  { value: 'collaboration',   label: 'تعاون مشترك' },
  { value: 'student_exchange',label: 'تبادل طلابي' },
  { value: 'faculty_exchange', label: 'تبادل أكاديمي' },
];

// ─── Shared input styles ────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: `1px solid ${C.teal}40`,
  borderRadius: 10, fontSize: '0.95rem', outline: 'none', color: C.darkNavy,
  background: 'white', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: C.teal, marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// SignatureCanvas component
// ═══════════════════════════════════════════════════════════════
function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext('2d')!;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = C.darkNavy; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDraw = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <canvas
        ref={canvasRef} width={420} height={150}
        style={{ border: `2px solid ${C.teal}50`, borderRadius: 10, cursor: 'crosshair', background: '#fafbfc', touchAction: 'none', maxWidth: '100%' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={clear} style={{ padding: '7px 18px', background: '#f0f0f0', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem' }}>مسح</button>
        <button type="button" onClick={save} style={{ padding: '7px 18px', background: C.teal, color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>✓ حفظ التوقيع</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AgreementCard component
// ═══════════════════════════════════════════════════════════════
function AgreementCard({
  ag, currentInstitution,
  onRespond, onTerms, onSign, onDetails,
}: {
  ag: Agreement;
  currentInstitution: number;
  onRespond: (ag: Agreement, action: 'accept' | 'reject') => void;
  onTerms: (ag: Agreement) => void;
  onSign: (ag: Agreement) => void;
  onDetails: (ag: Agreement) => void;
}) {
  const isFrom = ag.from_id === currentInstitution;
  const isTo   = ag.to_id   === currentInstitution;
  const terms: Term[] = ag.terms ? JSON.parse(ag.terms) : [];
  const mySig = isFrom ? ag.signature_from : ag.signature_to;
  const otherSig = isFrom ? ag.signature_to : ag.signature_from;

  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: `0 4px 16px ${C.darkNavy}10`, border: `1px solid ${ag.status === 'signed' ? C.success : C.teal}22`, borderTop: `3px solid ${ag.status === 'signed' ? C.success : ag.status === 'rejected' ? C.live : C.teal}`, direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: C.darkNavy, marginBottom: 4 }}>
            {ag.title || `اتفاقية ${TYPE_OPTIONS.find(t => t.value === ag.type)?.label || ag.type}`}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#888' }}>
            {ag.from_name_ar || ag.from_name} ↔ {ag.to_name_ar || ag.to_name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {statusBadge(ag.status)}
        </div>
      </div>

      {ag.description && (
        <p style={{ fontSize: '0.88rem', color: '#555', margin: '10px 0 0', lineHeight: 1.6 }}>{ag.description}</p>
      )}

      {terms.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.85rem', color: C.teal, fontWeight: 600, marginBottom: 4 }}>البنود ({terms.length})</div>
          <ul style={{ margin: 0, paddingRight: 18, fontSize: '0.85rem', color: '#444', lineHeight: 1.8 }}>
            {terms.slice(0, 3).map(t => <li key={t.id}>{t.text}</li>)}
            {terms.length > 3 && <li style={{ color: C.teal }}>و{terms.length - 3} بنود أخرى...</li>}
          </ul>
        </div>
      )}

      {/* التوقيعات */}
      {(ag.status === 'negotiating' || ag.status === 'signed') && (
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1, padding: '9px 14px', borderRadius: 10, background: ag.signature_from ? `${C.success}12` : '#f9f9f9', border: `1px solid ${ag.signature_from ? C.success : '#e8e8e8'}`, fontSize: '0.85rem', textAlign: 'center', color: ag.signature_from ? C.success : '#999', fontWeight: ag.signature_from ? 700 : 400 }}>
            {ag.from_name_ar || ag.from_name}: {ag.signature_from ? '✓ وقّع' : 'لم يوقّع بعد'}
          </div>
          <div style={{ flex: 1, padding: '9px 14px', borderRadius: 10, background: ag.signature_to ? `${C.success}12` : '#f9f9f9', border: `1px solid ${ag.signature_to ? C.success : '#e8e8e8'}`, fontSize: '0.85rem', textAlign: 'center', color: ag.signature_to ? C.success : '#999', fontWeight: ag.signature_to ? 700 : 400 }}>
            {ag.to_name_ar || ag.to_name}: {ag.signature_to ? '✓ وقّع' : 'لم يوقّع بعد'}
          </div>
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={() => onDetails(ag)} style={{ padding: '7px 16px', borderRadius: 20, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, cursor: 'pointer', fontSize: '0.82rem' }}>
          📄 التفاصيل
        </button>

        {/* رد المؤسسة المستقبِلة على الطلب */}
        {isTo && ag.status === 'draft' && (
          <>
            <button onClick={() => onRespond(ag, 'accept')} style={{ padding: '7px 16px', borderRadius: 20, background: `${C.success}20`, color: C.success, border: `1px solid ${C.success}40`, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
              ✓ قبول
            </button>
            <button onClick={() => onRespond(ag, 'reject')} style={{ padding: '7px 16px', borderRadius: 20, background: `${C.live}15`, color: C.live, border: `1px solid ${C.live}30`, cursor: 'pointer', fontSize: '0.82rem' }}>
              ✗ رفض
            </button>
          </>
        )}

        {/* تعديل البنود — أي من الطرفين أثناء التفاوض */}
        {(isFrom || isTo) && ['draft', 'negotiating'].includes(ag.status) && (
          <button onClick={() => onTerms(ag)} style={{ padding: '7px 16px', borderRadius: 20, background: `${C.warning}15`, color: C.warning, border: `1px solid ${C.warning}40`, cursor: 'pointer', fontSize: '0.82rem' }}>
            📝 البنود
          </button>
        )}

        {/* التوقيع */}
        {(isFrom || isTo) && ag.status === 'negotiating' && !mySig && (
          <button onClick={() => onSign(ag)} style={{ padding: '7px 16px', borderRadius: 20, background: C.darkNavy, color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
            ✍️ توقيع
          </button>
        )}

        {/* طباعة / تحميل PDF */}
        {ag.status === 'signed' && (
          <button onClick={() => printAgreement(ag)} style={{ padding: '7px 16px', borderRadius: 20, background: `${C.softGreen}20`, color: C.softGreen, border: `1px solid ${C.softGreen}50`, cursor: 'pointer', fontSize: '0.82rem' }}>
            ⬇ تحميل PDF
          </button>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: '0.83rem', color: '#bbb' }}>
        {new Date(ag.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

// ─── PDF Print helper ─────────────────────────────────────────
function printAgreement(ag: Agreement) {
  const terms: Term[] = ag.terms ? JSON.parse(ag.terms) : [];
  const fromName = ag.from_name_ar || ag.from_name || `مؤسسة ${ag.from_id}`;
  const toName   = ag.to_name_ar   || ag.to_name   || `مؤسسة ${ag.to_id}`;
  const typeLabel = TYPE_OPTIONS.find(t => t.value === ag.type)?.label || ag.type;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>اتفاقية: ${ag.title || typeLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { font-family: 'Cairo', sans-serif; }
    body { margin: 40px; color: #1a1a2e; line-height: 1.8; }
    h1 { font-size: 1.6rem; color: #281C59; border-bottom: 3px solid #4E8D9C; padding-bottom: 10px; text-align: center; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; background: #f8f9ff; padding: 16px; border-radius: 8px; }
    .meta-item { font-size: 0.9rem; }
    .meta-item b { color: #4E8D9C; }
    .terms { margin: 20px 0; }
    .terms h2 { color: #281C59; font-size: 1.1rem; }
    .term { padding: 8px 14px; margin: 6px 0; background: #f0f7f4; border-right: 3px solid #85C79A; border-radius: 4px; font-size: 0.92rem; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; }
    .sig-box { border: 1px solid #ccc; border-radius: 8px; padding: 16px; text-align: center; }
    .sig-box img { max-width: 100%; height: 80px; object-fit: contain; }
    .sig-box p { font-size: 0.82rem; color: #888; margin: 6px 0 0; }
    .footer { text-align: center; font-size: 0.78rem; color: #aaa; margin-top: 50px; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>وثيقة اتفاقية: ${ag.title || typeLabel}</h1>
  <div class="meta">
    <div class="meta-item"><b>الطرف الأول:</b> ${fromName}</div>
    <div class="meta-item"><b>الطرف الثاني:</b> ${toName}</div>
    <div class="meta-item"><b>نوع الاتفاقية:</b> ${typeLabel}</div>
    <div class="meta-item"><b>تاريخ الإنشاء:</b> ${new Date(ag.created_at).toLocaleDateString('ar-SA')}</div>
    ${ag.start_date ? `<div class="meta-item"><b>تاريخ البدء:</b> ${ag.start_date}</div>` : ''}
    ${ag.end_date ? `<div class="meta-item"><b>تاريخ الانتهاء:</b> ${ag.end_date}</div>` : ''}
    ${ag.is_permanent ? `<div class="meta-item"><b>المدة:</b> دائمة</div>` : ''}
  </div>
  ${ag.description ? `<p style="background:#fafbff;padding:14px;border-radius:8px;font-size:0.92rem">${ag.description}</p>` : ''}
  ${terms.length > 0 ? `
    <div class="terms">
      <h2>البنود والشروط</h2>
      ${terms.map((t, i) => `<div class="term"><b>${i + 1}.</b> ${t.text}</div>`).join('')}
    </div>
  ` : ''}
  <div class="sigs">
    <div class="sig-box">
      <p><b>${fromName}</b></p>
      ${ag.signature_from ? `<img src="${ag.signature_from}" alt="توقيع الطرف الأول" />` : '<p style="color:#ccc;font-size:1.5rem">— لم يوقّع —</p>'}
      ${ag.signed_at_from ? `<p>${new Date(ag.signed_at_from).toLocaleDateString('ar-SA')}</p>` : ''}
    </div>
    <div class="sig-box">
      <p><b>${toName}</b></p>
      ${ag.signature_to ? `<img src="${ag.signature_to}" alt="توقيع الطرف الثاني" />` : '<p style="color:#ccc;font-size:1.5rem">— لم يوقّع —</p>'}
      ${ag.signed_at_to ? `<p>${new Date(ag.signed_at_to).toLocaleDateString('ar-SA')}</p>` : ''}
    </div>
  </div>
  <div class="footer">المجرة الحضارية • وثيقة رسمية • ${new Date().toLocaleDateString('ar-SA')}</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=800,height=900');
  if (w) { w.document.write(html); w.document.close(); }
}

// ═══════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════
export default function AdminAgreementsPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentInstitution, setCurrentInstitution] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState('');

  // ── Modals ──────────────────────────────────────────────────
  const [showCreate, setShowCreate]   = useState(false);
  const [termsModal, setTermsModal]   = useState<Agreement | null>(null);
  const [signModal, setSignModal]     = useState<Agreement | null>(null);
  const [detailModal, setDetailModal] = useState<Agreement | null>(null);

  // ── Create form ──────────────────────────────────────────────
  const [createForm, setCreateForm] = useState({
    from_id: '', to_id: '', type: 'partnership',
    title: '', description: '',
    start_date: '', end_date: '', is_permanent: false, is_public: true,
  });
  const [createTerms, setCreateTerms] = useState<{ text: string }[]>([{ text: '' }]);
  const [createLoading, setCreateLoading] = useState(false);

  // ── Terms modal ──────────────────────────────────────────────
  const [editTerms, setEditTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);

  // ── Sign modal ───────────────────────────────────────────────
  const [savedSig, setSavedSig]     = useState<string | null>(null);
  const [signLoading, setSignLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, agRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/institutions?limit=200`)
          .then(r => r.json()),
        fetchAgreements({ limit: 100 }) as Promise<any>,
      ]);
      setInstitutions(instRes?.data || []);
      setAgreements((agRes?.data || []) as Agreement[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/agreements');
      return;
    }
    const user = JSON.parse(u);
    if (user.institution_id) setCurrentInstitution(user.institution_id);
    loadData();
  }, [router, loadData]);

  // ── Create agreement ─────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.from_id || !createForm.to_id) { alert('اختر المؤسستين'); return; }
    if (createForm.from_id === createForm.to_id) { alert('يجب أن تكون المؤسستان مختلفتين'); return; }
    setCreateLoading(true);
    try {
      const terms = createTerms.filter(t => t.text.trim()).map((t, i) => ({ id: `term_${i + 1}`, text: t.text.trim() }));
      await createAgreement({
        from_id: Number(createForm.from_id),
        to_id: Number(createForm.to_id),
        type: createForm.type,
        title: createForm.title || undefined,
        description: createForm.description || undefined,
        start_date: createForm.start_date || undefined,
        end_date: (!createForm.is_permanent && createForm.end_date) ? createForm.end_date : undefined,
        is_permanent: createForm.is_permanent,
        is_public: createForm.is_public,
        terms: terms.length ? terms : undefined,
      });
      setShowCreate(false);
      setCreateForm({ from_id: '', to_id: '', type: 'partnership', title: '', description: '', start_date: '', end_date: '', is_permanent: false, is_public: true });
      setCreateTerms([{ text: '' }]);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Respond ─────────────────────────────────────────────────
  const handleRespond = async (ag: Agreement, action: 'accept' | 'reject') => {
    const msg = action === 'accept' ? 'الموافقة على طلب الاتفاقية؟' : 'رفض طلب الاتفاقية؟';
    if (!confirm(msg)) return;
    try {
      const res = await respondToAgreement(ag.id, { institution_id: currentInstitution, action });
      alert(res.message);
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  // ── Terms modal init ─────────────────────────────────────────
  const openTerms = (ag: Agreement) => {
    const parsed: Term[] = ag.terms ? JSON.parse(ag.terms) : [];
    setEditTerms(parsed.length ? parsed : [{ id: 'term_1', text: '' }]);
    setTermsModal(ag);
  };

  const handleSaveTerms = async () => {
    if (!termsModal) return;
    const valid = editTerms.filter(t => t.text.trim());
    if (!valid.length) { alert('أضف بنداً واحداً على الأقل'); return; }
    setTermsLoading(true);
    try {
      const res = await updateAgreementTerms(termsModal.id, { institution_id: currentInstitution, terms: valid });
      alert(res.message);
      setTermsModal(null);
      await loadData();
    } catch (err: any) { alert(err.message); } finally { setTermsLoading(false); }
  };

  // ── Sign ─────────────────────────────────────────────────────
  const handleSign = async () => {
    if (!signModal || !savedSig) { alert('ارسم توقيعك أولاً'); return; }
    setSignLoading(true);
    try {
      const res = await signAgreement(signModal.id, { institution_id: currentInstitution, signature: savedSig });
      alert(res.message);
      if (res.both_signed) {
        alert('🎉 تمت عملية التوقيع من كلا الطرفين! تم نشر خبر في قسم الأخبار تلقائياً.');
      }
      setSignModal(null); setSavedSig(null);
      await loadData();
    } catch (err: any) { alert(err.message); } finally { setSignLoading(false); }
  };

  // ─── Filtered list ───────────────────────────────────────────
  const filtered = agreements.filter(a => !filterStatus || a.status === filterStatus);
  const stats = {
    total:       agreements.length,
    draft:       agreements.filter(a => a.status === 'draft').length,
    negotiating: agreements.filter(a => a.status === 'negotiating').length,
    signed:      agreements.filter(a => a.status === 'signed').length,
  };

  // ════════════════════════════════════════════════════════════
  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>

      {/* هيدر */}
      <div className="page-hero" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', margin: 0, fontWeight: 800 }}>🤝 نظام عقود الاتفاق</h1>
          <p style={{ opacity: 0.7, margin: '8px 0 0', fontSize: '0.93rem' }}>
            إنشاء وإدارة الاتفاقيات بين المؤسسات — توقيع إلكتروني • تفاوض • نشر تلقائي
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/admin" style={{ padding: '10px 22px', borderRadius: 30, background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontSize: '0.92rem', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 600 }}>
            ← لوحة الأدمن
          </a>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 26px', borderRadius: 30, background: C.softGreen, color: C.darkNavy, border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', boxShadow: `0 3px 12px ${C.softGreen}50` }}>
            + طلب اتفاقية جديدة
          </button>
        </div>
      </div>

      {/* إحصائيات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'إجمالي الاتفاقيات', value: stats.total,       color: C.teal,    icon: '📋' },
          { label: 'مسودة / انتظار',    value: stats.draft,       color: C.warning, icon: '⏳' },
          { label: 'قيد التفاوض',       value: stats.negotiating, color: C.teal,    icon: '💬' },
          { label: 'موقَّعة',            value: stats.signed,      color: C.success, icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 16,
            padding: '16px 18px',
            boxShadow: `0 4px 14px ${C.darkNavy}10`,
            border: `1px solid ${s.color}20`,
            borderTop: `3px solid ${s.color}`,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* فلتر الحالة */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {['', 'draft', 'negotiating', 'signed', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '7px 18px', borderRadius: 22,
            border: `1px solid ${filterStatus === s ? C.teal : '#e0e0e0'}`,
            background: filterStatus === s ? C.teal : 'white',
            color: filterStatus === s ? 'white' : '#555',
            cursor: 'pointer', fontSize: '0.88rem', fontWeight: filterStatus === s ? 700 : 400,
            transition: 'all 0.2s',
          }}>
            {s === '' ? 'الكل' : (STATUS_LABELS[s]?.label || s)}
          </button>
        ))}
      </div>

      {/* قائمة الاتفاقيات */}
      {loading ? (
        <div className="loading-page">
          <div className="spinner" />
          جاري التحميل...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, color: '#aaa', border: `2px dashed ${C.teal}30` }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 14, opacity: 0.4 }}>🤝</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: C.darkNavy, marginBottom: 6 }}>
            {filterStatus ? 'لا توجد اتفاقيات بهذه الحالة' : 'لا توجد اتفاقيات بعد'}
          </div>
          {!filterStatus && <div style={{ fontSize: '0.88rem', color: '#bbb' }}>أنشئ أول اتفاقية بالضغط على الزر أعلاه</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(ag => (
            <AgreementCard key={ag.id} ag={ag} currentInstitution={currentInstitution}
              onRespond={handleRespond} onTerms={openTerms} onSign={ag => { setSavedSig(null); setSignModal(ag); }}
              onDetails={ag => setDetailModal(ag)}
            />
          ))}
        </div>
      )}

      {/* ══════════════ مودال: إنشاء اتفاقية جديدة ══════════════ */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              🤝 طلب اتفاقية جديدة
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="من / الطرف الأول *">
                  <select value={createForm.from_id} onChange={e => setCreateForm({ ...createForm, from_id: e.target.value })} required style={selectStyle}>
                    <option value="">اختر مؤسسة...</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>)}
                  </select>
                </Field>
                <Field label="إلى / الطرف الثاني *">
                  <select value={createForm.to_id} onChange={e => setCreateForm({ ...createForm, to_id: e.target.value })} required style={selectStyle}>
                    <option value="">اختر مؤسسة...</option>
                    {institutions.filter(i => String(i.id) !== createForm.from_id).map(i => <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="نوع الاتفاقية *">
                <select value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })} required style={selectStyle}>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="عنوان الاتفاقية">
                <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="عنوان مختصر..." style={inputStyle} />
              </Field>
              <Field label="وصف / مقدمة الاتفاقية">
                <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} rows={3} placeholder="فقرة مختصرة تصف الهدف من الاتفاقية..." style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="تاريخ البدء">
                  <input type="date" value={createForm.start_date} onChange={e => setCreateForm({ ...createForm, start_date: e.target.value })} style={inputStyle} />
                </Field>
                {!createForm.is_permanent && (
                  <Field label="تاريخ الانتهاء">
                    <input type="date" value={createForm.end_date} onChange={e => setCreateForm({ ...createForm, end_date: e.target.value })} style={inputStyle} />
                  </Field>
                )}
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', color: C.darkNavy }}>
                  <input type="checkbox" checked={createForm.is_permanent} onChange={e => setCreateForm({ ...createForm, is_permanent: e.target.checked })} />
                  اتفاقية دائمة (بلا تاريخ انتهاء)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', color: C.darkNavy }}>
                  <input type="checkbox" checked={createForm.is_public} onChange={e => setCreateForm({ ...createForm, is_public: e.target.checked })} />
                  ظاهرة للعموم
                </label>
              </div>

              {/* البنود */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: C.teal }}>البنود والشروط</label>
                  <button type="button" onClick={() => setCreateTerms([...createTerms, { text: '' }])} style={{ padding: '4px 12px', background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 14, cursor: 'pointer', fontSize: '0.8rem' }}>
                    + بند
                  </button>
                </div>
                {createTerms.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ minWidth: 24, color: C.teal, fontWeight: 700, fontSize: '0.9rem' }}>{i + 1}.</span>
                    <input
                      value={t.text} onChange={e => { const v = [...createTerms]; v[i] = { text: e.target.value }; setCreateTerms(v); }}
                      placeholder={`البند ${i + 1}...`} style={{ ...inputStyle, flex: 1 }}
                    />
                    {createTerms.length > 1 && (
                      <button type="button" onClick={() => setCreateTerms(createTerms.filter((_, j) => j !== i))} style={{ padding: '6px 10px', background: `${C.live}15`, color: C.live, border: 'none', borderRadius: 8, cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                ))}
                <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '4px 0 0' }}>يمكن إضافة بنود لاحقاً أو تحريرها قبل التوقيع</p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={createLoading} style={{ flex: 1, padding: '12px', background: C.darkNavy, color: 'white', border: 'none', borderRadius: 30, fontWeight: 700, cursor: createLoading ? 'default' : 'pointer', opacity: createLoading ? 0.7 : 1 }}>
                  {createLoading ? 'جاري الإرسال...' : '✦ إرسال طلب الاتفاقية'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '12px 28px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 30, cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ مودال: تعديل البنود ══════════════ */}
      {termsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              📝 تعديل بنود الاتفاقية
              <button onClick={() => setTermsModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            <p style={{ fontSize: '0.85rem', color: C.teal, marginBottom: 16, background: `${C.teal}12`, padding: '10px 14px', borderRadius: 10 }}>
              ⚠️ تعديل البنود سيعيد تعيين التوقيعات ويطلب التوقيع من جديد من كلا الطرفين.
            </p>
            {editTerms.map((t, i) => (
              <div key={t.id || i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <span style={{ minWidth: 24, color: C.teal, fontWeight: 700 }}>{i + 1}.</span>
                <input
                  value={t.text} onChange={e => { const v = [...editTerms]; v[i] = { ...v[i], text: e.target.value }; setEditTerms(v); }}
                  placeholder={`البند ${i + 1}`} style={{ ...inputStyle, flex: 1 }}
                />
                {editTerms.length > 1 && (
                  <button type="button" onClick={() => setEditTerms(editTerms.filter((_, j) => j !== i))} style={{ padding: '6px 10px', background: `${C.live}15`, color: C.live, border: 'none', borderRadius: 8, cursor: 'pointer' }}>×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setEditTerms([...editTerms, { id: `term_${editTerms.length + 1}`, text: '' }])} style={{ padding: '7px 16px', background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 14, cursor: 'pointer', fontSize: '0.85rem', marginBottom: 16 }}>
              + إضافة بند
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSaveTerms} disabled={termsLoading} style={{ flex: 1, padding: '12px', background: C.darkNavy, color: 'white', border: 'none', borderRadius: 30, fontWeight: 700, cursor: termsLoading ? 'default' : 'pointer', opacity: termsLoading ? 0.7 : 1 }}>
                {termsLoading ? 'جاري الحفظ...' : '💾 حفظ البنود'}
              </button>
              <button onClick={() => setTermsModal(null)} style={{ padding: '12px 28px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 30, cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ مودال: التوقيع الإلكتروني ══════════════ */}
      {signModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 520, boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              ✍️ التوقيع الإلكتروني
              <button onClick={() => { setSignModal(null); setSavedSig(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: 16 }}>
              ارسم توقيعك في الحقل أدناه. بتوقيعك توافق على جميع بنود الاتفاقية:&nbsp;
              <strong>{signModal.title || `اتفاقية ${TYPE_OPTIONS.find(t => t.value === signModal.type)?.label || signModal.type}`}</strong>
            </p>
            {savedSig ? (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', color: C.success, marginBottom: 8, fontWeight: 600 }}>✓ تم حفظ التوقيع</div>
                <img src={savedSig} alt="توقيعك" style={{ border: `2px solid ${C.success}40`, borderRadius: 10, maxWidth: '100%' }} />
                <button onClick={() => setSavedSig(null)} style={{ marginTop: 8, padding: '6px 14px', background: '#f0f0f0', border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: '0.82rem' }}>إعادة الرسم</button>
              </div>
            ) : (
              <SignatureCanvas onSave={sig => setSavedSig(sig)} />
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={handleSign} disabled={signLoading || !savedSig} style={{ flex: 1, padding: '12px', background: savedSig ? C.darkNavy : '#ccc', color: 'white', border: 'none', borderRadius: 30, fontWeight: 700, cursor: (signLoading || !savedSig) ? 'default' : 'pointer' }}>
                {signLoading ? 'جاري التوقيع...' : '✍️ تأكيد التوقيع'}
              </button>
              <button onClick={() => { setSignModal(null); setSavedSig(null); }} style={{ padding: '12px 28px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 30, cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ مودال: تفاصيل الاتفاقية ══════════════ */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: C.darkNavy, margin: 0 }}>📄 تفاصيل الاتفاقية</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {detailModal.status === 'signed' && (
                  <button onClick={() => printAgreement(detailModal)} style={{ padding: '7px 16px', borderRadius: 20, background: `${C.softGreen}20`, color: C.softGreen, border: `1px solid ${C.softGreen}50`, cursor: 'pointer', fontSize: '0.85rem' }}>
                    ⬇ PDF
                  </button>
                )}
                <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'الطرف الأول', value: detailModal.from_name_ar || detailModal.from_name },
                { label: 'الطرف الثاني', value: detailModal.to_name_ar || detailModal.to_name },
                { label: 'النوع', value: TYPE_OPTIONS.find(t => t.value === detailModal.type)?.label || detailModal.type },
                { label: 'الحالة', value: <>{statusBadge(detailModal.status)}</> },
                detailModal.start_date ? { label: 'من', value: detailModal.start_date } : null,
                detailModal.end_date ? { label: 'إلى', value: detailModal.end_date } : null,
                detailModal.is_permanent ? { label: 'المدة', value: 'دائمة' } : null,
              ].filter(Boolean).map((item: any, i) => (
                <div key={i} style={{ background: '#f8f9ff', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.83rem', color: C.teal, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontWeight: 600, color: C.darkNavy, fontSize: '0.9rem' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {detailModal.description && (
              <div style={{ background: '#fafbff', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: '0.9rem', color: '#444', lineHeight: 1.7 }}>
                {detailModal.description}
              </div>
            )}

            {(() => {
              const terms: Term[] = detailModal.terms ? JSON.parse(detailModal.terms) : [];
              return terms.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: C.darkNavy, marginBottom: 8 }}>البنود والشروط</div>
                  <ol style={{ margin: 0, paddingRight: 20 }}>
                    {terms.map((t, i) => (
                      <li key={t.id || i} style={{ padding: '7px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.92rem', color: '#333', lineHeight: 1.6 }}>{t.text}</li>
                    ))}
                  </ol>
                </div>
              ) : null;
            })()}

            {/* التوقيعات */}
            {(detailModal.signature_from || detailModal.signature_to) && (
              <div>
                <div style={{ fontWeight: 700, color: C.darkNavy, marginBottom: 10 }}>التوقيعات</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: detailModal.from_name_ar || detailModal.from_name || 'الطرف الأول', sig: detailModal.signature_from, date: detailModal.signed_at_from },
                    { label: detailModal.to_name_ar   || detailModal.to_name   || 'الطرف الثاني', sig: detailModal.signature_to,   date: detailModal.signed_at_to },
                  ].map((s, i) => (
                    <div key={i} style={{ border: `1px solid ${s.sig ? C.success : '#e0e0e0'}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: s.sig ? C.success : '#999', marginBottom: 8 }}>{s.label}</div>
                      {s.sig ? (
                        <>
                          <img src={s.sig} alt="توقيع" style={{ maxWidth: '100%', height: 70, objectFit: 'contain' }} />
                          {s.date && <div style={{ fontSize: '0.82rem', color: '#aaa', marginTop: 4 }}>{new Date(s.date).toLocaleDateString('ar-SA')}</div>}
                        </>
                      ) : (
                        <div style={{ padding: '20px 0', color: '#ccc', fontSize: '0.8rem' }}>لم يوقّع بعد</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
