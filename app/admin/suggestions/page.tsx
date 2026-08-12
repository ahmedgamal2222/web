'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suggestion, fetchSuggestions, approveSuggestion, rejectSuggestion } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
  bg: '#07091e',
  card: '#0d1129',
  border: '#1a1f3d',
  teal: '#4E8D9C',
  mint: '#EDF7BD',
  gold: '#FFD700',
  text: '#e2eaf2',
  muted: '#7a96aa',
  green: '#22c55e',
  red: '#ef4444',
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  approved: { label: 'موافق عليه', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function AdminSuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/admin/suggestions');
      return;
    }
    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      router.push('/');
      return;
    }
    loadSuggestions();
  }, [filter, router]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const result = await fetchSuggestions({
        status: filter === 'all' ? undefined : filter,
        limit: 50,
      });
      setSuggestions(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await approveSuggestion(id);
      await loadSuggestions();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('هل تريد رفض هذا الاقتراح؟')) return;
    setActionId(id);
    try {
      await rejectSuggestion(id);
      await loadSuggestions();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setActionId(null);
    }
  };

  const stats = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="admin-page" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="admin-header">
        <div>
          <Link href="/admin" style={{ color: C.mint, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, marginBottom: 10, display: 'inline-block' }}>
            → لوحة التحكم
          </Link>
          <h1 style={{ fontSize: '2rem', margin: '8px 0 6px', fontWeight: 900 }}>
            💡 إدارة الاقتراحات
          </h1>
          <p style={{ color: `${C.mint}80`, fontSize: '0.9rem' }}>
            مراجعة والموافقة على اقتراحات المستخدمين
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div style={{
          background: 'white', borderRadius: 18, padding: '18px 20px',
          boxShadow: `0 4px 14px rgba(0,0,0,0.06)`, borderTop: `3px solid ${C.teal}`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: '0.85rem', color: '#777', fontWeight: 600 }}>الكل</div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: C.teal }}>{total}</div>
        </div>
        <div style={{
          background: 'white', borderRadius: 18, padding: '18px 20px',
          boxShadow: `0 4px 14px rgba(0,0,0,0.06)`, borderTop: `3px solid #f59e0b`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: '0.85rem', color: '#777', fontWeight: 600 }}>قيد المراجعة</div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        <div style={{
          background: 'white', borderRadius: 18, padding: '18px 20px',
          boxShadow: `0 4px 14px rgba(0,0,0,0.06)`, borderTop: `3px solid #22c55e`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: '0.85rem', color: '#777', fontWeight: 600 }}>موافق عليه</div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#22c55e' }}>{stats.approved}</div>
        </div>
        <div style={{
          background: 'white', borderRadius: 18, padding: '18px 20px',
          boxShadow: `0 4px 14px rgba(0,0,0,0.06)`, borderTop: `3px solid #ef4444`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: '0.85rem', color: '#777', fontWeight: 600 }}>مرفوض</div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ef4444' }}>{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white', borderRadius: 18, padding: '16px 20px', marginBottom: 20,
        boxShadow: `0 4px 14px rgba(0,0,0,0.06)`,
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? `${C.teal}20` : 'transparent',
            border: `1px solid ${filter === f ? C.teal : 'transparent'}`,
            color: filter === f ? C.teal : '#666',
            borderRadius: 12,
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}>
            {f === 'all' ? 'الكل' : STATUS_MAP[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Suggestions List */}
      <div style={{
        background: 'white', borderRadius: 20, overflow: 'hidden',
        boxShadow: `0 4px 14px rgba(0,0,0,0.06)`,
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: C.teal }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            جاري التحميل...
          </div>
        ) : suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
            لا توجد اقتراحات
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${C.teal}15` }}>
                  {['#', 'العنوان', 'المؤسسة', 'المحاضرة', 'رابط الفيديو', 'الحالة', 'التاريخ', 'إجراءات'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: '0.83rem', color: '#281C59', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, i) => {
                  const statusMeta = STATUS_MAP[s.status] || STATUS_MAP.pending;
                  const isPending = s.status === 'pending';
                  const isActing = actionId === s.id;
                  return (
                    <tr key={s.id} style={{
                      borderBottom: `1px solid ${C.teal}10`,
                      background: i % 2 === 0 ? 'white' : '#f8fafc',
                    }}>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap' }}>#{s.id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#281C59', fontSize: '0.88rem', maxWidth: 250 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        {s.description && (
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 3, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#555', whiteSpace: 'nowrap' }}>
                        {s.institution_name || s.institution_name_en || `#${s.institution_id}`}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#555', whiteSpace: 'nowrap' }}>
                        {s.lecture_title ? (
                          <span style={{ color: C.teal, fontWeight: 600 }}>{s.lecture_title}</span>
                        ) : (
                          <span style={{ color: '#aaa' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', maxWidth: 200 }}>
                        <a href={s.video_url} target="_blank" rel="noopener noreferrer" style={{
                          color: C.teal, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                        }}>
                          {s.video_url.length > 35 ? s.video_url.substring(0, 35) + '...' : s.video_url}
                        </a>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                          background: statusMeta.bg, color: statusMeta.color, whiteSpace: 'nowrap',
                        }}>{statusMeta.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#666', whiteSpace: 'nowrap' }}>
                        {new Date(s.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {isPending && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleApprove(s.id)}
                              disabled={isActing}
                              style={{
                                padding: '6px 16px',
                                background: isActing ? '#ccc' : '#22c55e',
                                border: 'none',
                                borderRadius: 10,
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: isActing ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              {isActing ? '...' : '✅ موافقة'}
                            </button>
                            <button
                              onClick={() => handleReject(s.id)}
                              disabled={isActing}
                              style={{
                                padding: '6px 16px',
                                background: isActing ? '#ccc' : '#ef4444',
                                border: 'none',
                                borderRadius: 10,
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: isActing ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              {isActing ? '...' : '❌ رفض'}
                            </button>
                          </div>
                        )}
                        {!isPending && (
                          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>تمت المراجعة</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
