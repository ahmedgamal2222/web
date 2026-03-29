'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const COLORS = { lightMint: '#EDF7BD', softGreen: '#85C79A', teal: '#4E8D9C', darkNavy: '#281C59' };

export default function AdminMarketplace() {
  const router = useRouter();
  const [items, setItems]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [page, setPage]       = useState(1);
  const limit = 20;

  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const headers   = { 'X-Session-ID': sessionId };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') { router.push('/'); return; }
    fetchItems();
  }, [category, page]);

  const fetchItems = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category) params.set('category', category);
    const res  = await fetch(`${API_BASE}/api/marketplace?${params}`, { headers });
    const data = await res.json();
    setItems(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
    // direct DB update via admin endpoint (if available) — otherwise use a raw fetch
    const res = await fetch(`${API_BASE}/api/marketplace/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => null);
    fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('حذف هذا العنصر؟')) return;
    await fetch(`${API_BASE}/api/marketplace/${id}`, { method: 'DELETE', headers }).catch(() => {});
    fetchItems();
  };

  const CAT_LABELS: Record<string, string> = {
    service: 'خدمة', product: 'منتج', subscription: 'اشتراك',
    course: 'دورة', tool: 'أداة', other: 'أخرى',
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 6 }}>🛒 السوق الرقمي</h1>
          <p style={{ opacity: 0.7 }}>إدارة عروض المؤسسات في السوق الرقمي</p>
        </div>
        <Link href="/admin" style={{
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
          color: 'white', padding: '10px 20px', borderRadius: 40, textDecoration: 'none',
        }}>← لوحة التحكم</Link>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} style={{
          padding: '8px 36px 8px 14px', borderRadius: 40,
          border: `1px solid ${COLORS.teal}40`, outline: 'none', fontSize: '0.9rem',
          appearance: 'none',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', backgroundSize: '14px',
          fontFamily: 'Cairo, sans-serif',
        }}>
          <option value="">كل التصنيفات</option>
          <option value="service">خدمة</option>
          <option value="product">منتج</option>
          <option value="subscription">اشتراك</option>
          <option value="course">دورة</option>
          <option value="tool">أداة</option>
        </select>
        <span style={{ color: '#888', marginRight: 'auto' }}>{total} عنصر</span>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: `0 4px 14px ${COLORS.darkNavy}12` }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#ccc' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛒</div>
            لا توجد عناصر بعد
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: `${COLORS.darkNavy}08`, borderBottom: `2px solid ${COLORS.teal}20` }}>
                {['#', 'العنوان', 'التصنيف', 'السعر', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: COLORS.darkNavy, fontWeight: 700, fontSize: '0.88rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.teal}10` }}
                  onMouseEnter={e => e.currentTarget.style.background = `${COLORS.teal}06`}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '0.85rem' }}>{(page - 1) * limit + i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: COLORS.darkNavy, fontSize: '0.92rem' }}>{item.title}</div>
                    {item.institution_name && <div style={{ fontSize: '0.78rem', color: '#888' }}>{item.institution_name}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: `${COLORS.teal}15`, color: COLORS.teal, padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem' }}>
                      {CAT_LABELS[item.category] || item.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: item.is_free ? '#10b981' : COLORS.darkNavy, fontSize: '0.9rem' }}>
                    {item.is_free ? 'مجاني' : `$${item.price}`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: item.status === 'active' ? '#10b98118' : '#ef444418',
                      color: item.status === 'active' ? '#10b981' : '#ef4444',
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                    }}>
                      {item.status === 'active' ? 'نشط' : 'مخفي'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleStatus(item.id, item.status)} style={{
                        background: `${COLORS.teal}15`, color: COLORS.teal,
                        border: 'none', borderRadius: 20, padding: '4px 12px',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                      }}>
                        {item.status === 'active' ? 'إخفاء' : 'إظهار'}
                      </button>
                      <button onClick={() => deleteItem(item.id)} style={{
                        background: '#ef444415', color: '#ef4444',
                        border: 'none', borderRadius: 20, padding: '4px 12px',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
                      }}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {Math.ceil(total / limit) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: page === p ? COLORS.teal : 'white',
              color: page === p ? 'white' : COLORS.darkNavy,
              border: `1px solid ${page === p ? COLORS.teal : '#ddd'}`,
              cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
