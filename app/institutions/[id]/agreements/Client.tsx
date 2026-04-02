'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchAgreements,
  fetchInstitutions,
  createAgreement,
  respondToAgreement,
  updateAgreementTerms,
  signAgreement,
} from '@/lib/api';

// ─── الألوان ────────────────────────────────────────────────
const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  live: '#ff4444',
  warning: '#f59e0b',
  success: '#22c55e',
};

// ─── Types ───────────────────────────────────────────────────
interface Term { id: string; text: string }
interface Agreement {
  id: number; from_id: number; to_id: number;
  from_name?: string; from_name_ar?: string;
  to_name?: string; to_name_ar?: string;
  type: string; title?: string; description?: string;
  start_date?: string; end_date?: string; is_permanent?: boolean;
  status: string; terms?: string;
  signature_from?: string; signature_to?: string;
  signed_at_from?: string; signed_at_to?: string;
  is_public?: boolean; created_at: string;
}

// ─── Status labels ───────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:       { label: 'في الانتظار',   color: '#94a3b8' },
  negotiating: { label: 'قيد التفاوض',  color: C.teal },
  signed:      { label: 'موقَّعة ✓',    color: C.success },
  rejected:    { label: 'مرفوضة',       color: C.live },
  active:      { label: 'نشطة',         color: C.softGreen },
};

const TYPE_OPTIONS = [
  { value: 'partnership',      label: 'شراكة استراتيجية' },
  { value: 'research',         label: 'تعاون بحثي' },
  { value: 'exchange',         label: 'تبادل خبرات' },
  { value: 'collaboration',    label: 'تعاون مشترك' },
  { value: 'student_exchange', label: 'تبادل طلابي' },
  { value: 'faculty_exchange', label: 'تبادل أكاديمي' },
];

// ─── Styles ──────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: `1px solid ${C.teal}40`,
  borderRadius: 10, fontSize: '0.95rem', outline: 'none',
  color: C.darkNavy, background: 'white', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: C.teal, marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const StatusBadge = ({ s }: { s: string }) => {
  const st = STATUS_LABELS[s] || { label: s, color: '#999' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.83rem', fontWeight: 700, background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40` }}>
      {st.label}
    </span>
  );
};

// ─── Signature canvas ────────────────────────────────────────
function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawing.current = true;
    const { x, y } = getPos(e, canvas);
    canvas.getContext('2d')!.beginPath();
    canvas.getContext('2d')!.moveTo(x, y);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <canvas ref={canvasRef} width={420} height={140}
        style={{ border: `2px solid ${C.teal}50`, borderRadius: 10, cursor: 'crosshair', background: '#fafbfc', touchAction: 'none', maxWidth: '100%' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={clear} style={{ padding: '7px 18px', background: '#f0f0f0', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem' }}>مسح</button>
        <button type="button" onClick={() => { const c = canvasRef.current; if (c) onSave(c.toDataURL('image/png')); }}
          style={{ padding: '7px 18px', background: C.teal, color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
          ✓ حفظ التوقيع
        </button>
      </div>
    </div>
  );
}

// ─── PDF print ────────────────────────────────────────────────
function printAgreement(ag: Agreement) {
  const terms: Term[] = ag.terms ? JSON.parse(ag.terms) : [];
  const fromName = ag.from_name_ar || ag.from_name || `مؤسسة ${ag.from_id}`;
  const toName   = ag.to_name_ar   || ag.to_name   || `مؤسسة ${ag.to_id}`;
  const typeLabel = TYPE_OPTIONS.find(t => t.value === ag.type)?.label || ag.type;

  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
  <title>اتفاقية: ${ag.title || typeLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    *{font-family:'Cairo',sans-serif}body{margin:40px;color:#1a1a2e;line-height:1.8}
    h1{font-size:1.6rem;color:#281C59;border-bottom:3px solid #4E8D9C;padding-bottom:10px;text-align:center}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;background:#f8f9ff;padding:16px;border-radius:8px}
    .meta-item{font-size:0.9rem}.meta-item b{color:#4E8D9C}
    .terms h2{color:#281C59;font-size:1.1rem}
    .term{padding:8px 14px;margin:6px 0;background:#f0f7f4;border-right:3px solid #85C79A;border-radius:4px;font-size:0.92rem}
    .sigs{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:40px}
    .sig-box{border:1px solid #ccc;border-radius:8px;padding:16px;text-align:center}
    .sig-box img{max-width:100%;height:80px;object-fit:contain}
    .footer{text-align:center;font-size:0.78rem;color:#aaa;margin-top:50px;border-top:1px solid #eee;padding-top:12px}
    @media print{body{margin:10mm}}
  </style></head><body>
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
  ${ag.description ? `<p style="background:#fafbff;padding:14px;border-radius:8px">${ag.description}</p>` : ''}
  ${terms.length > 0 ? `<div class="terms"><h2>البنود والشروط</h2>${terms.map((t,i)=>`<div class="term"><b>${i+1}.</b> ${t.text}</div>`).join('')}</div>` : ''}
  <div class="sigs">
    <div class="sig-box"><p><b>${fromName}</b></p>
      ${ag.signature_from ? `<img src="${ag.signature_from}" alt="توقيع الطرف الأول"/>` : '<p style="color:#ccc">— لم يوقّع —</p>'}
      ${ag.signed_at_from ? `<p>${new Date(ag.signed_at_from).toLocaleDateString('ar-SA')}</p>` : ''}
    </div>
    <div class="sig-box"><p><b>${toName}</b></p>
      ${ag.signature_to ? `<img src="${ag.signature_to}" alt="توقيع الطرف الثاني"/>` : '<p style="color:#ccc">— لم يوقّع —</p>'}
      ${ag.signed_at_to ? `<p>${new Date(ag.signed_at_to).toLocaleDateString('ar-SA')}</p>` : ''}
    </div>
  </div>
  <div class="footer">المجرة الحضارية • وثيقة رسمية • ${new Date().toLocaleDateString('ar-SA')}</div>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;

  const w = window.open('', '_blank', 'width=800,height=900');
  if (w) { w.document.write(html); w.document.close(); }
}

// ════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════════════════════
export default function InstitutionAgreementsPage() {
  const institutionId = typeof window !== 'undefined'
    ? Number(window.location.pathname.split('/').filter(Boolean)[1])
    : 0;
  const router = useRouter();

  const [institutionName, setInstitutionName] = useState('');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [allInstitutions, setAllInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // ── Modals ──────────────────────────────────────────────
  const [showCreate, setShowCreate]   = useState(false);
  const [termsModal, setTermsModal]   = useState<Agreement | null>(null);
  const [signModal, setSignModal]     = useState<Agreement | null>(null);
  const [detailModal, setDetailModal] = useState<Agreement | null>(null);

  // ── Create form ──────────────────────────────────────────
  const [form, setForm] = useState({
    to_id: '', type: 'partnership', title: '',
    description: '', start_date: '', end_date: '',
    is_permanent: false, is_public: true,
  });
  const [createTerms, setCreateTerms] = useState<{ text: string }[]>([{ text: '' }]);
  const [createLoading, setCreateLoading] = useState(false);

  // ── Terms modal ──────────────────────────────────────────
  const [editTerms, setEditTerms] = useState<Term[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);

  // ── Sign modal ───────────────────────────────────────────
  const [savedSig, setSavedSig]     = useState<string | null>(null);
  const [signLoading, setSignLoading] = useState(false);

  // ── Tabs ─────────────────────────────────────────────────
  const [activeTab, setActiveTab]         = useState<'mine' | 'others'>('mine');
  const [otherAgreements, setOtherAgreements] = useState<Agreement[]>([]);
  const [filterOther, setFilterOther]     = useState('');
  const [mineTotal, setMineTotal]         = useState(0);

  // ── Load data ────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
      const [instRes, agRes, allAgRes] = await Promise.all([
        fetch(`${API}/api/institutions?limit=2000`).then(r => r.json()),
        fetchAgreements({ institution_id: institutionId, limit: 2000 }) as Promise<any>,
        fetchAgreements({ limit: 2000 }) as Promise<any>,
      ]);
      const insts: any[] = instRes?.data || [];
      setAllInstitutions(insts);
      const me = insts.find((i: any) => i.id === institutionId);
      if (me) setInstitutionName(me.name_ar || me.name || '');
      setAgreements((agRes?.data || []) as Agreement[]);
      setMineTotal(agRes?.total ?? (agRes?.data || []).length);
      const allAgs: Agreement[] = (allAgRes?.data || []) as Agreement[];
      setOtherAgreements(allAgs.filter(a => a.from_id !== institutionId && a.to_id !== institutionId && a.is_public !== false));
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    if (!institutionId) { router.push('/institutions'); return; }
    loadData();
  }, [institutionId, router, loadData]);

  // ── Create ────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.to_id) { alert('اختر المؤسسة الأخرى'); return; }
    setCreateLoading(true);
    try {
      const terms = createTerms.filter(t => t.text.trim()).map((t, i) => ({ id: `term_${i + 1}`, text: t.text.trim() }));
      await createAgreement({
        from_id: institutionId,
        to_id: Number(form.to_id),
        type: form.type,
        title: form.title || undefined,
        description: form.description || undefined,
        start_date: form.start_date || undefined,
        end_date: (!form.is_permanent && form.end_date) ? form.end_date : undefined,
        is_permanent: form.is_permanent,
        is_public: form.is_public,
        terms: terms.length ? terms : undefined,
      });
      setShowCreate(false);
      setForm({ to_id: '', type: 'partnership', title: '', description: '', start_date: '', end_date: '', is_permanent: false, is_public: true });
      setCreateTerms([{ text: '' }]);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally { setCreateLoading(false); }
  };

  // ── Respond ───────────────────────────────────────────────
  const handleRespond = async (ag: Agreement, action: 'accept' | 'reject') => {
    if (!confirm(action === 'accept' ? 'الموافقة على طلب الاتفاقية؟' : 'رفض طلب الاتفاقية؟')) return;
    try {
      const res = await respondToAgreement(ag.id, { institution_id: institutionId, action });
      alert(res.message);
      await loadData();
    } catch (err: any) { alert(err.message); }
  };

  // ── Terms ─────────────────────────────────────────────────
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
      const res = await updateAgreementTerms(termsModal.id, { institution_id: institutionId, terms: valid });
      alert(res.message); setTermsModal(null); await loadData();
    } catch (err: any) { alert(err.message); } finally { setTermsLoading(false); }
  };

  // ── Sign ──────────────────────────────────────────────────
  const handleSign = async () => {
    if (!signModal || !savedSig) { alert('ارسم توقيعك أولاً'); return; }
    setSignLoading(true);
    try {
      const res = await signAgreement(signModal.id, { institution_id: institutionId, signature: savedSig });
      alert(res.message);
      if (res.both_signed) alert('🎉 تمّ التوقيع من كلا الطرفين! تم نشر خبر تلقائياً.');
      setSignModal(null); setSavedSig(null); await loadData();
    } catch (err: any) { alert(err.message); } finally { setSignLoading(false); }
  };

  // ── Filter ────────────────────────────────────────────────
  const filtered = agreements.filter(a => !filterStatus || a.status === filterStatus);
  const incoming = agreements.filter(a => a.to_id === institutionId && a.status === 'draft');
  const filteredOther = otherAgreements.filter(a => !filterOther || a.status === filterOther);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}20, white)`, direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>

      {/* ── الهيدر ── */}
      <div style={{ background: C.darkNavy, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href={`/institutions/${institutionId}`} style={{ color: C.lightMint, textDecoration: 'none', opacity: 0.8, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← العودة
          </Link>
          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>🤝 اتفاقيات {institutionName}</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>إدارة عقود الاتفاق والشراكات</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', borderRadius: 30, background: C.softGreen, color: C.darkNavy, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
          + طلب اتفاقية جديدة
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── تبويبات ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'white', padding: 6, borderRadius: 16, boxShadow: `0 3px 12px ${C.darkNavy}10`, width: 'fit-content' }}>
          {([
            { key: 'mine',   label: '🏛️ اتفاقياتنا',            count: mineTotal },
            { key: 'others', label: '🌐 اتفاقيات المؤسسات الأخرى', count: otherAgreements.length },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
              background: activeTab === tab.key ? C.darkNavy : 'transparent',
              color: activeTab === tab.key ? 'white' : C.teal,
            }}>
              {tab.label}
              <span style={{ marginRight: 6, background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : `${C.teal}18`, padding: '1px 8px', borderRadius: 10, fontSize: '0.84rem' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'mine' && <>
        {/* تنبيه الطلبات الواردة */}
        {incoming.length > 0 && (
          <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}40`, borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>🔔</span>
            <div>
              <div style={{ fontWeight: 700, color: C.darkNavy, fontSize: '0.95rem' }}>لديك {incoming.length} طلب اتفاقية يحتاج ردك</div>
              <div style={{ fontSize: '0.82rem', color: '#666' }}>راجع الطلبات أدناه وقم بالموافقة أو الرفض</div>
            </div>
          </div>
        )}

        {/* إحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'الإجمالي',   value: agreements.length,                                          color: C.teal,    icon: '📋' },
            { label: 'منتظرة',     value: agreements.filter(a => a.status === 'draft').length,         color: '#94a3b8', icon: '⏳' },
            { label: 'قيد التفاوض', value: agreements.filter(a => a.status === 'negotiating').length,  color: C.teal,    icon: '💬' },
            { label: 'موقَّعة',    value: agreements.filter(a => a.status === 'signed').length,        color: C.success, icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: `0 3px 12px ${C.darkNavy}10`, border: `1px solid ${s.color}25` }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: '0.83rem', color: C.teal }}>{s.label}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* فلتر الحالة */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {['', 'draft', 'negotiating', 'signed', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '5px 14px', borderRadius: 18, border: `1px solid ${filterStatus === s ? C.teal : '#ddd'}`, background: filterStatus === s ? C.teal : 'white', color: filterStatus === s ? 'white' : '#666', cursor: 'pointer', fontSize: '0.82rem' }}>
              {s === '' ? 'الكل' : (STATUS_LABELS[s]?.label || s)}
            </button>
          ))}
        </div>

        {/* قائمة الاتفاقيات */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.teal }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 20, color: C.teal }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🤝</div>
            {filterStatus ? 'لا توجد اتفاقيات بهذه الحالة' : 'لا توجد اتفاقيات بعد — أرسل أول طلب اتفاقية'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(ag => {
              const isFrom = ag.from_id === institutionId;
              const isTo   = ag.to_id   === institutionId;
              const terms: Term[] = ag.terms ? JSON.parse(ag.terms) : [];
              const mySig = isFrom ? ag.signature_from : ag.signature_to;
              const otherPartyName = isFrom ? (ag.to_name_ar || ag.to_name) : (ag.from_name_ar || ag.from_name);

              return (
                <div key={ag.id} style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: `0 3px 14px ${C.darkNavy}10`, border: `1px solid ${ag.status === 'signed' ? C.success : C.teal}20` }}>
                  {/* رأس البطاقة */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: C.darkNavy }}>
                        {ag.title || `اتفاقية ${TYPE_OPTIONS.find(t => t.value === ag.type)?.label || ag.type}`}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 3 }}>
                        {isFrom ? '↑ أرسلتها إلى' : '↓ وردت من'}: <strong>{otherPartyName}</strong>
                      </div>
                    </div>
                    <StatusBadge s={ag.status} />
                  </div>

                  {ag.description && <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.6, margin: '0 0 10px' }}>{ag.description}</p>}

                  {/* البنود */}
                  {terms.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: '0.83rem', color: C.teal, fontWeight: 600 }}>البنود ({terms.length}): </span>
                      <span style={{ fontSize: '0.82rem', color: '#666' }}>{terms[0].text}{terms.length > 1 ? ` ... و${terms.length - 1} أخرى` : ''}</span>
                    </div>
                  )}

                  {/* حالة التوقيعات */}
                  {['negotiating', 'signed'].includes(ag.status) && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      {[
                        { name: ag.from_name_ar || ag.from_name, signed: !!ag.signature_from },
                        { name: ag.to_name_ar   || ag.to_name,   signed: !!ag.signature_to   },
                      ].map((p, i) => (
                        <div key={i} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: p.signed ? `${C.success}12` : '#f9f9f9', border: `1px solid ${p.signed ? C.success : '#e0e0e0'}`, fontSize: '0.83rem', textAlign: 'center', color: p.signed ? C.success : '#999' }}>
                          {p.name}: {p.signed ? '✓ وقّع' : 'لم يوقّع'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* الأزرار */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setDetailModal(ag)} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, cursor: 'pointer', fontSize: '0.8rem' }}>
                      📄 التفاصيل
                    </button>

                    {isTo && ag.status === 'draft' && (
                      <>
                        <button onClick={() => handleRespond(ag, 'accept')} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.success}20`, color: C.success, border: `1px solid ${C.success}40`, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                          ✓ قبول
                        </button>
                        <button onClick={() => handleRespond(ag, 'reject')} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.live}15`, color: C.live, border: `1px solid ${C.live}30`, cursor: 'pointer', fontSize: '0.8rem' }}>
                          ✗ رفض
                        </button>
                      </>
                    )}

                    {(isFrom || isTo) && ['draft', 'negotiating'].includes(ag.status) && (
                      <button onClick={() => openTerms(ag)} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.warning}15`, color: C.warning, border: `1px solid ${C.warning}40`, cursor: 'pointer', fontSize: '0.8rem' }}>
                        📝 البنود
                      </button>
                    )}

                    {(isFrom || isTo) && ag.status === 'negotiating' && !mySig && (
                      <button onClick={() => { setSavedSig(null); setSignModal(ag); }} style={{ padding: '6px 14px', borderRadius: 18, background: C.darkNavy, color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                        ✍️ توقيع
                      </button>
                    )}

                    {ag.status === 'signed' && (
                      <button onClick={() => printAgreement(ag)} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.softGreen}20`, color: C.softGreen, border: `1px solid ${C.softGreen}50`, cursor: 'pointer', fontSize: '0.8rem' }}>
                        ⬇ PDF
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#ccc' }}>
                    {new Date(ag.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </> /* end mine tab */}

        {/* ══ ركن اتفاقيات المؤسسات الأخرى ══ */}
        {activeTab === 'others' && <>

          {/* إحصائيات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'الإجمالي',    value: otherAgreements.length,                                         color: C.teal,    icon: '🌐' },
              { label: 'موقَّعة',     value: otherAgreements.filter(a => a.status === 'signed').length,       color: C.success, icon: '✅' },
              { label: 'قيد التفاوض', value: otherAgreements.filter(a => a.status === 'negotiating').length,  color: C.teal,    icon: '💬' },
              { label: 'منتظرة',      value: otherAgreements.filter(a => a.status === 'draft').length,        color: '#94a3b8', icon: '⏳' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: `0 3px 12px ${C.darkNavy}10`, border: `1px solid ${s.color}25` }}>
                <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: '0.83rem', color: C.teal }}>{s.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* فلتر */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {['', 'draft', 'negotiating', 'signed', 'rejected'].map(s => (
              <button key={s} onClick={() => setFilterOther(s)} style={{ padding: '5px 14px', borderRadius: 18, border: `1px solid ${filterOther === s ? C.teal : '#ddd'}`, background: filterOther === s ? C.teal : 'white', color: filterOther === s ? 'white' : '#666', cursor: 'pointer', fontSize: '0.82rem' }}>
                {s === '' ? 'الكل' : (STATUS_LABELS[s]?.label || s)}
              </button>
            ))}
          </div>

          {/* القائمة */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: C.teal }}>جاري التحميل...</div>
          ) : filteredOther.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 20, color: C.teal }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌐</div>
              {filterOther ? 'لا توجد اتفاقيات بهذه الحالة' : 'لا توجد اتفاقيات علنية من مؤسسات أخرى'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredOther.map(ag => {
                const terms: Term[] = ag.terms ? JSON.parse(ag.terms) : [];
                const typeLabel = TYPE_OPTIONS.find(t => t.value === ag.type)?.label || ag.type;
                return (
                  <div key={ag.id} style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: `0 3px 14px ${C.darkNavy}10`, border: `1px solid ${ag.status === 'signed' ? C.success : C.teal}20` }}>
                    {/* رأس البطاقة */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: C.darkNavy }}>
                          {ag.title || `اتفاقية ${typeLabel}`}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: C.teal }}>{ag.from_name_ar || ag.from_name}</span>
                          <span style={{ color: '#ccc' }}>⟷</span>
                          <span style={{ fontWeight: 600, color: C.teal }}>{ag.to_name_ar || ag.to_name}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.83rem', color: '#aaa', padding: '3px 10px', background: '#f5f5f5', borderRadius: 10 }}>{typeLabel}</span>
                        <StatusBadge s={ag.status} />
                      </div>
                    </div>

                    {ag.description && (
                      <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.6, margin: '0 0 10px' }}>{ag.description}</p>
                    )}

                    {terms.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: '0.83rem', color: C.teal, fontWeight: 600 }}>البنود ({terms.length}): </span>
                        <span style={{ fontSize: '0.82rem', color: '#666' }}>{terms[0].text}{terms.length > 1 ? ` ... و${terms.length - 1} أخرى` : ''}</span>
                      </div>
                    )}

                    {/* حالة التوقيعات للاتفاقيات الموقعة */}
                    {['negotiating', 'signed'].includes(ag.status) && (
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        {[
                          { name: ag.from_name_ar || ag.from_name, signed: !!ag.signature_from },
                          { name: ag.to_name_ar   || ag.to_name,   signed: !!ag.signature_to   },
                        ].map((p, i) => (
                          <div key={i} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: p.signed ? `${C.success}12` : '#f9f9f9', border: `1px solid ${p.signed ? C.success : '#e0e0e0'}`, fontSize: '0.83rem', textAlign: 'center', color: p.signed ? C.success : '#999' }}>
                            {p.name}: {p.signed ? '✓ وقّع' : 'لم يوقّع'}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => setDetailModal(ag)} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, cursor: 'pointer', fontSize: '0.8rem' }}>
                        📄 التفاصيل
                      </button>
                      {ag.status === 'signed' && (
                        <button onClick={() => printAgreement(ag)} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.softGreen}20`, color: C.softGreen, border: `1px solid ${C.softGreen}50`, cursor: 'pointer', fontSize: '0.8rem' }}>
                          ⬇ PDF
                        </button>
                      )}
                      <span style={{ marginRight: 'auto', fontSize: '0.82rem', color: '#ccc' }}>
                        {new Date(ag.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </> /* end others tab */}
      </div>

      {/* ══ مودال: إنشاء اتفاقية ══ */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              🤝 طلب اتفاقية جديدة
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="إلى / المؤسسة الأخرى *">
                <select value={form.to_id} onChange={e => setForm({ ...form, to_id: e.target.value })} required style={selectStyle}>
                  <option value="">اختر مؤسسة...</option>
                  {allInstitutions.filter(i => i.id !== institutionId).map(i => (
                    <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="نوع الاتفاقية *">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required style={selectStyle}>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="عنوان الاتفاقية">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="عنوان مختصر..." style={inputStyle} />
              </Field>
              <Field label="وصف / مقدمة الاتفاقية">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="الهدف من الاتفاقية..." style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="تاريخ البدء">
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
                </Field>
                {!form.is_permanent && (
                  <Field label="تاريخ الانتهاء">
                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
                  </Field>
                )}
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem', color: C.darkNavy }}>
                  <input type="checkbox" checked={form.is_permanent} onChange={e => setForm({ ...form, is_permanent: e.target.checked })} />
                  اتفاقية دائمة
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem', color: C.darkNavy }}>
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} />
                  ظاهرة للعموم
                </label>
              </div>

              {/* البنود */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: C.teal }}>البنود والشروط</label>
                  <button type="button" onClick={() => setCreateTerms([...createTerms, { text: '' }])} style={{ padding: '3px 10px', background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 12, cursor: 'pointer', fontSize: '0.83rem' }}>+ بند</button>
                </div>
                {createTerms.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ minWidth: 22, color: C.teal, fontWeight: 700, fontSize: '0.88rem' }}>{i + 1}.</span>
                    <input value={t.text} onChange={e => { const v = [...createTerms]; v[i] = { text: e.target.value }; setCreateTerms(v); }} placeholder={`البند ${i + 1}...`} style={{ ...inputStyle, flex: 1 }} />
                    {createTerms.length > 1 && (
                      <button type="button" onClick={() => setCreateTerms(createTerms.filter((_, j) => j !== i))} style={{ padding: '5px 8px', background: `${C.live}15`, color: C.live, border: 'none', borderRadius: 7, cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <button type="submit" disabled={createLoading} style={{ flex: 1, padding: '12px', background: C.darkNavy, color: 'white', border: 'none', borderRadius: 30, fontWeight: 700, cursor: createLoading ? 'default' : 'pointer', opacity: createLoading ? 0.7 : 1 }}>
                  {createLoading ? 'جاري الإرسال...' : '✦ إرسال الطلب'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '12px 24px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 30, cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ مودال: البنود ══ */}
      {termsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 22, padding: 30, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              📝 تعديل البنود
              <button onClick={() => setTermsModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            <p style={{ fontSize: '0.83rem', color: C.teal, marginBottom: 14, background: `${C.teal}10`, padding: '8px 12px', borderRadius: 8 }}>
              ⚠️ تعديل البنود يُعيد تعيين التوقيعات ويطلب إعادة التوقيع من الطرفين.
            </p>
            {editTerms.map((t, i) => (
              <div key={t.id || i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ minWidth: 22, color: C.teal, fontWeight: 700 }}>{i + 1}.</span>
                <input value={t.text} onChange={e => { const v = [...editTerms]; v[i] = { ...v[i], text: e.target.value }; setEditTerms(v); }} placeholder={`البند ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
                {editTerms.length > 1 && (
                  <button type="button" onClick={() => setEditTerms(editTerms.filter((_, j) => j !== i))} style={{ padding: '5px 8px', background: `${C.live}15`, color: C.live, border: 'none', borderRadius: 7, cursor: 'pointer' }}>×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setEditTerms([...editTerms, { id: `term_${editTerms.length + 1}`, text: '' }])} style={{ padding: '6px 14px', background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 12, cursor: 'pointer', fontSize: '0.83rem', marginBottom: 14 }}>
              + إضافة بند
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSaveTerms} disabled={termsLoading} style={{ flex: 1, padding: '11px', background: C.darkNavy, color: 'white', border: 'none', borderRadius: 28, fontWeight: 700, cursor: termsLoading ? 'default' : 'pointer', opacity: termsLoading ? 0.7 : 1 }}>
                {termsLoading ? 'جاري الحفظ...' : '💾 حفظ'}
              </button>
              <button onClick={() => setTermsModal(null)} style={{ padding: '11px 22px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 28, cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ مودال: التوقيع ══ */}
      {signModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 22, padding: 30, width: '100%', maxWidth: 500, boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <h2 style={{ color: C.darkNavy, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              ✍️ التوقيع الإلكتروني
              <button onClick={() => { setSignModal(null); setSavedSig(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
            </h2>
            <p style={{ fontSize: '0.87rem', color: '#555', marginBottom: 14 }}>
              بتوقيعك توافق على جميع بنود:&nbsp;
              <strong>{signModal.title || `اتفاقية ${TYPE_OPTIONS.find(t => t.value === signModal.type)?.label || signModal.type}`}</strong>
            </p>
            {savedSig ? (
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: '0.8rem', color: C.success, marginBottom: 6, fontWeight: 600 }}>✓ تم حفظ التوقيع</div>
                <img src={savedSig} alt="توقيعك" style={{ border: `2px solid ${C.success}40`, borderRadius: 10, maxWidth: '100%' }} />
                <button onClick={() => setSavedSig(null)} style={{ marginTop: 8, padding: '5px 14px', background: '#f0f0f0', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.82rem' }}>إعادة الرسم</button>
              </div>
            ) : (
              <SignatureCanvas onSave={sig => setSavedSig(sig)} />
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              <button onClick={handleSign} disabled={signLoading || !savedSig} style={{ flex: 1, padding: '11px', background: savedSig ? C.darkNavy : '#ccc', color: 'white', border: 'none', borderRadius: 28, fontWeight: 700, cursor: (signLoading || !savedSig) ? 'default' : 'pointer' }}>
                {signLoading ? 'جاري التوقيع...' : '✍️ تأكيد التوقيع'}
              </button>
              <button onClick={() => { setSignModal(null); setSavedSig(null); }} style={{ padding: '11px 22px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 28, cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ مودال: التفاصيل ══ */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, direction: 'rtl', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 22, padding: 30, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto', boxShadow: `0 20px 60px ${C.darkNavy}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ color: C.darkNavy, margin: 0 }}>📄 تفاصيل الاتفاقية</h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {detailModal.status === 'signed' && (
                  <button onClick={() => printAgreement(detailModal)} style={{ padding: '6px 14px', borderRadius: 18, background: `${C.softGreen}20`, color: C.softGreen, border: `1px solid ${C.softGreen}50`, cursor: 'pointer', fontSize: '0.82rem' }}>
                    ⬇ PDF
                  </button>
                )}
                <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'الطرف الأول', value: detailModal.from_name_ar || detailModal.from_name },
                { label: 'الطرف الثاني', value: detailModal.to_name_ar || detailModal.to_name },
                { label: 'النوع', value: TYPE_OPTIONS.find(t => t.value === detailModal.type)?.label || detailModal.type },
                { label: 'الحالة', value: <StatusBadge s={detailModal.status} /> },
                ...(detailModal.start_date ? [{ label: 'من', value: detailModal.start_date }] : []),
                ...(detailModal.end_date   ? [{ label: 'إلى', value: detailModal.end_date }] : []),
              ].map((item, i) => (
                <div key={i} style={{ background: '#f8f9ff', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.82rem', color: C.teal, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontWeight: 600, color: C.darkNavy, fontSize: '0.88rem' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {detailModal.description && (
              <div style={{ background: '#fafbff', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: '0.88rem', color: '#444', lineHeight: 1.7 }}>{detailModal.description}</div>
            )}
            {(() => {
              const terms: Term[] = detailModal.terms ? JSON.parse(detailModal.terms) : [];
              return terms.length > 0 ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: C.darkNavy, marginBottom: 8 }}>البنود والشروط</div>
                  <ol style={{ margin: 0, paddingRight: 20 }}>
                    {terms.map((t, i) => (
                      <li key={t.id || i} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem', color: '#333', lineHeight: 1.6 }}>{t.text}</li>
                    ))}
                  </ol>
                </div>
              ) : null;
            })()}
            {(detailModal.signature_from || detailModal.signature_to) && (
              <div>
                <div style={{ fontWeight: 700, color: C.darkNavy, marginBottom: 8 }}>التوقيعات</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: detailModal.from_name_ar || detailModal.from_name || 'الطرف الأول', sig: detailModal.signature_from, date: detailModal.signed_at_from },
                    { label: detailModal.to_name_ar   || detailModal.to_name   || 'الطرف الثاني', sig: detailModal.signature_to, date: detailModal.signed_at_to },
                  ].map((s, i) => (
                    <div key={i} style={{ border: `1px solid ${s.sig ? C.success : '#e0e0e0'}`, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: s.sig ? C.success : '#999', marginBottom: 6 }}>{s.label}</div>
                      {s.sig
                        ? <img src={s.sig} alt="توقيع" style={{ maxWidth: '100%', height: 65, objectFit: 'contain' }} />
                        : <div style={{ padding: '16px 0', color: '#ccc', fontSize: '0.83rem' }}>لم يوقّع بعد</div>
                      }
                      {s.sig && s.date && <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 3 }}>{new Date(s.date).toLocaleDateString('ar-SA')}</div>}
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
