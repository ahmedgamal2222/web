'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface Recipient {
  id: number;
  email: string;
  name?: string;
  name_ar?: string;
  country?: string;
  type?: string;
  sub_type?: string;
  status?: string;
  institution_name?: string;
  role?: string;
}

interface Campaign {
  id: number;
  subject: string;
  body_html: string;
  filters?: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
  sent_at?: string;
}

export default function AdminMailingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'compose' | 'history'>('compose');

  // Filters
  const [target, setTarget] = useState<'institutions' | 'users'>('institutions');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSubType, setFilterSubType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Filter options
  const [countries, setCountries] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [subTypes, setSubTypes] = useState<string[]>([]);

  // Recipients
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Compose
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [sending, setSending] = useState(false);

  // History
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewLogs, setViewLogs] = useState<any[] | null>(null);
  const [viewCampaignId, setViewCampaignId] = useState<number | null>(null);

  // State
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH: Record<string, string> = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/mailing');
      return;
    }
    loadFilters();
    loadHistory();
  }, []);

  const loadFilters = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/mailing/filters`, { headers: { 'X-Session-ID': sid } });
      const d = await res.json();
      if (d.success) {
        setCountries(d.countries || []);
        setTypes(d.types || []);
        setSubTypes(d.subTypes || []);
      }
    } catch {}
  };

  const loadRecipients = async () => {
    setLoadingRecipients(true);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/mailing/recipients`, {
        method: 'POST',
        headers: authH,
        body: JSON.stringify({
          target,
          country: filterCountry || undefined,
          type: filterType || undefined,
          sub_type: filterSubType || undefined,
          status: filterStatus || undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setRecipients(d.data || []);
        setSelectedIds(new Set((d.data || []).map((r: Recipient) => r.id)));
      } else {
        setErr(d.error || 'فشل تحميل المستلمين');
      }
    } catch {
      setErr('فشل تحميل المستلمين');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/mailing/campaigns`, { headers: { 'X-Session-ID': sid } });
      const d = await res.json();
      if (d.success) setCampaigns(d.data || []);
    } catch {}
    setLoadingHistory(false);
  };

  const loadLogs = async (campaignId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/mailing/campaigns/${campaignId}/logs`, { headers: { 'X-Session-ID': sid } });
      const d = await res.json();
      if (d.success) {
        setViewLogs(d.data || []);
        setViewCampaignId(campaignId);
      }
    } catch {}
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === recipients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipients.map(r => r.id)));
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) { setErr('يرجى كتابة الموضوع'); return; }
    if (!bodyHtml.trim()) { setErr('يرجى كتابة محتوى الرسالة'); return; }

    const selected = recipients.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) { setErr('يرجى تحديد مستلم واحد على الأقل'); return; }

    if (!confirm(`سيتم إرسال الرسالة إلى ${selected.length} مستلم. متابعة؟`)) return;

    setSending(true);
    setErr('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/mailing/send`, {
        method: 'POST',
        headers: authH,
        body: JSON.stringify({
          subject,
          body_html: bodyHtml,
          recipients: selected.map(r => ({ email: r.email, name: r.name, name_ar: r.name_ar })),
          filters: { target, country: filterCountry, type: filterType, sub_type: filterSubType },
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSuccessMsg(`تم الإرسال بنجاح! تم إرسال ${d.sentCount} من ${d.total} رسالة` + (d.failedCount ? ` (${d.failedCount} فشل)` : ''));
        setSubject('');
        setBodyHtml('');
        loadHistory();
      } else {
        setErr(d.error || 'فشل الإرسال');
      }
    } catch {
      setErr('حدث خطأ أثناء الإرسال');
    } finally {
      setSending(false);
    }
  };

  const selectedCount = recipients.filter(r => selectedIds.has(r.id)).length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0520 0%, #1a1040 50%, #0d0825 100%)', color: '#fff', fontFamily: "'Tajawal', sans-serif", direction: 'rtl' }}>

      {/* Header */}
      <div style={{ background: 'rgba(78,141,156,0.08)', borderBottom: '1px solid rgba(78,141,156,0.15)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" style={{ color: C.teal, textDecoration: 'none', fontSize: 14 }}>← لوحة التحكم</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, background: `linear-gradient(90deg, ${C.lightMint}, ${C.softGreen})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📧 القائمة البريدية</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['compose', 'history'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'history') loadHistory(); }} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, background: tab === t ? C.teal : 'rgba(255,255,255,0.06)', color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all .2s' }}>
              {t === 'compose' ? '✏️ إنشاء رسالة' : '📋 السجل'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' }}>

        {err && <div style={{ background: 'rgba(255,50,50,0.12)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#ff6b6b', fontSize: 14 }}>{err}</div>}
        {successMsg && <div style={{ background: 'rgba(133,199,154,0.12)', border: `1px solid rgba(133,199,154,0.3)`, borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: C.softGreen, fontSize: 14 }}>{successMsg}</div>}

        {tab === 'compose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>

            {/* Filters Panel */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(78,141,156,0.12)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.lightMint, marginBottom: 20, margin: '0 0 20px' }}>🎯 تصفية المستلمين</h3>

              {/* Target */}
              <label style={labelStyle}>الهدف</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['institutions', 'users'] as const).map(t => (
                  <button key={t} onClick={() => { setTarget(t); setRecipients([]); setSelectedIds(new Set()); }} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, background: target === t ? C.teal : 'rgba(255,255,255,0.06)', color: target === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    {t === 'institutions' ? '🏛️ مؤسسات' : '👥 مستخدمين'}
                  </button>
                ))}
              </div>

              {target === 'institutions' && (
                <>
                  <label style={labelStyle}>الدولة</label>
                  <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={selectStyle}>
                    <option value="">الكل</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <label style={labelStyle}>نوع المؤسسة</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
                    <option value="">الكل</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <label style={labelStyle}>التصنيف الفرعي</label>
                  <select value={filterSubType} onChange={e => setFilterSubType(e.target.value)} style={selectStyle}>
                    <option value="">الكل</option>
                    {subTypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <label style={labelStyle}>الحالة</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
                    <option value="">الكل</option>
                    <option value="active">فعّال</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="inactive">غير فعّال</option>
                  </select>
                </>
              )}

              {target === 'users' && (
                <>
                  <label style={labelStyle}>الحالة</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
                    <option value="">الكل</option>
                    <option value="active">فعّال</option>
                    <option value="inactive">غير فعّال</option>
                  </select>
                </>
              )}

              <button onClick={loadRecipients} disabled={loadingRecipients} style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`, color: '#fff', marginTop: 20, opacity: loadingRecipients ? 0.6 : 1 }}>
                {loadingRecipients ? '⏳ جاري البحث...' : '🔍 بحث عن المستلمين'}
              </button>

              {recipients.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(78,141,156,0.1)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.softGreen }}>{selectedCount}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>مستلم محدد من {recipients.length}</div>
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Recipients Table */}
              {recipients.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(78,141,156,0.12)', borderRadius: 16, padding: 20, maxHeight: 320, overflow: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: C.lightMint }}>📋 المستلمون ({recipients.length})</h4>
                    <button onClick={toggleAll} style={{ background: 'none', border: `1px solid ${C.teal}`, borderRadius: 8, padding: '4px 14px', color: C.teal, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                      {selectedIds.size === recipients.length ? 'إلغاء الكل' : 'تحديد الكل'}
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(78,141,156,0.15)' }}>
                        <th style={thStyle}></th>
                        <th style={thStyle}>الاسم</th>
                        <th style={thStyle}>البريد</th>
                        {target === 'institutions' && <th style={thStyle}>الدولة</th>}
                        {target === 'institutions' && <th style={thStyle}>النوع</th>}
                        {target === 'users' && <th style={thStyle}>المؤسسة</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map(r => (
                        <tr key={r.id} onClick={() => toggleSelect(r.id)} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: selectedIds.has(r.id) ? 'rgba(78,141,156,0.08)' : 'transparent' }}>
                          <td style={tdStyle}><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} style={{ accentColor: C.teal }} /></td>
                          <td style={tdStyle}>{r.name_ar || r.name || '—'}</td>
                          <td style={{ ...tdStyle, direction: 'ltr', textAlign: 'left', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{r.email}</td>
                          {target === 'institutions' && <td style={tdStyle}>{r.country || '—'}</td>}
                          {target === 'institutions' && <td style={tdStyle}>{r.type || '—'}</td>}
                          {target === 'users' && <td style={tdStyle}>{r.institution_name || '—'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Compose */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(78,141,156,0.12)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.lightMint, margin: '0 0 20px' }}>✍️ كتابة الرسالة</h3>

                <label style={labelStyle}>الموضوع</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="موضوع الرسالة..." style={inputStyle} />

                <label style={labelStyle}>محتوى الرسالة (HTML)</label>
                <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)} placeholder="اكتب محتوى الرسالة هنا... يدعم HTML" rows={10} style={{ ...inputStyle, resize: 'vertical', minHeight: 180 }} />

                {/* Preview */}
                {bodyHtml.trim() && (
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>معاينة</label>
                    <div style={{ background: '#fff', borderRadius: 10, padding: 20, color: '#222', fontSize: 14, direction: 'rtl', maxHeight: 260, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                  </div>
                )}

                <button onClick={handleSend} disabled={sending || selectedCount === 0} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: selectedCount > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 900, fontSize: 15, background: selectedCount > 0 ? `linear-gradient(135deg, ${C.softGreen}, ${C.teal})` : 'rgba(255,255,255,0.06)', color: '#fff', marginTop: 20, opacity: sending ? 0.6 : 1, letterSpacing: 0.5 }}>
                  {sending ? '⏳ جاري الإرسال...' : `📨 إرسال إلى ${selectedCount} مستلم`}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>⏳ جاري التحميل...</div>
            ) : campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div>لا توجد حملات بريدية بعد</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {campaigns.map(c => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(78,141,156,0.12)', borderRadius: 14, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: C.lightMint, marginBottom: 4 }}>{c.subject}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        {new Date(c.created_at).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {c.filters && (() => {
                          try {
                            const f = JSON.parse(c.filters);
                            const parts: string[] = [];
                            if (f.country) parts.push(f.country);
                            if (f.type) parts.push(f.type);
                            return parts.length ? ` — ${parts.join(' · ')}` : '';
                          } catch { return ''; }
                        })()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: C.softGreen }}>{c.sent_count}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>تم الإرسال</div>
                      </div>
                      {c.failed_count > 0 && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#ff6b6b' }}>{c.failed_count}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>فشل</div>
                        </div>
                      )}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{c.recipients_count}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>إجمالي</div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.status === 'sent' ? 'rgba(133,199,154,0.15)' : c.status === 'sending' ? 'rgba(255,193,7,0.15)' : 'rgba(255,100,100,0.15)', color: c.status === 'sent' ? C.softGreen : c.status === 'sending' ? '#FFC107' : '#ff6b6b' }}>
                        {c.status === 'sent' ? '✅ تم' : c.status === 'sending' ? '⏳ جاري' : c.status === 'draft' ? '📝 مسودة' : '❌ فشل'}
                      </span>
                      <button onClick={() => loadLogs(c.id)} style={{ background: 'none', border: `1px solid rgba(78,141,156,0.3)`, borderRadius: 8, padding: '6px 14px', color: C.teal, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>التفاصيل</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Logs Modal */}
            {viewLogs && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setViewLogs(null); setViewCampaignId(null); }}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(160deg, #0c0928, #1a1040)', border: '1px solid rgba(78,141,156,0.2)', borderRadius: 20, padding: 28, width: '90%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: C.lightMint }}>📋 تفاصيل الحملة #{viewCampaignId}</h3>
                    <button onClick={() => { setViewLogs(null); setViewCampaignId(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
                  </div>
                  {viewLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)' }}>لا توجد سجلات</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(78,141,156,0.15)' }}>
                          <th style={thStyle}>الاسم</th>
                          <th style={thStyle}>البريد</th>
                          <th style={thStyle}>الحالة</th>
                          <th style={thStyle}>الخطأ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewLogs.map((log: any) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={tdStyle}>{log.recipient_name || '—'}</td>
                            <td style={{ ...tdStyle, direction: 'ltr', textAlign: 'left', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{log.recipient_email}</td>
                            <td style={tdStyle}>
                              <span style={{ color: log.status === 'sent' ? C.softGreen : '#ff6b6b', fontWeight: 700 }}>
                                {log.status === 'sent' ? '✅' : '❌'} {log.status === 'sent' ? 'تم' : 'فشل'}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{log.error || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6, marginTop: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(78,141,156,0.15)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontFamily: "'Tajawal', sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'auto',
};

const thStyle: React.CSSProperties = {
  textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 12,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px', color: 'rgba(255,255,255,0.7)', fontSize: 13,
};
