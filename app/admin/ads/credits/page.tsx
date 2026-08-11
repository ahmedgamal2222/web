'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

interface CreditPackage {
  id: number;
  name: string;
  amount: number;
  price: number;
  currency: string;
  description?: string;
  is_active: boolean;
}

interface Institution {
  id: number;
  name: string;
  name_ar?: string;
  email?: string;
}

export default function AdsCreditsPage() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      router.push('/login?redirect=/admin/ads/credits');
      return;
    }
    const userData = JSON.parse(u);
    setUser(userData);
    if (userData.role !== 'admin' && userData.role !== 'institution') {
      router.push('/login?redirect=/admin/ads/credits');
      return;
    }
    loadInstitutions();
    loadPackages();
  }, [router]);

  async function loadInstitutions() {
    try {
      const res = await fetch(`${API_BASE}/api/institutions?limit=9999`, {
        headers: { 'X-Session-ID': localStorage.getItem('sessionId') || '' },
      });
      const data = await res.json();
      if (data.success) setInstitutions(data.data || []);
    } catch (e) {}
  }

  async function loadPackages() {
    try {
      const res = await fetch(`${API_BASE}/api/ads/credits/packages`, {
        headers: { 'X-Session-ID': localStorage.getItem('sessionId') || '' },
      });
      const data = await res.json();
      if (data.success) setPackages(data.data || []);
    } catch (e) {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInstitution || !selectedPackage) {
      setMessage('يرجى اختيار المؤسسة والباقة');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const sid = localStorage.getItem('sessionId') || '';
      const res = await fetch(`${API_BASE}/api/ads/credits/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sid,
        },
        body: JSON.stringify({
          institution_id: Number(selectedInstitution),
          package_id: Number(selectedPackage),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشت العملية');
      setMessage(`✅ تم إضافة ${data.amount} رصيد بنجاح! الرصيد الجديد: ${data.new_balance}`);
      setSelectedInstitution('');
      setSelectedPackage('');
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'institution';

  // If institution, auto-select their institution
  useEffect(() => {
    if (user?.role === 'institution' && user.institutionId && !selectedInstitution) {
      setSelectedInstitution(user.institutionId.toString());
    }
  }, [user, selectedInstitution]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/admin/ads" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← العودة للإعلانات
          </Link>
          <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
            💰 تعبئة رصيد الإعلانات
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            أضف رصيد إعلاني للمؤسسات
          </p>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          borderRadius: 20,
          padding: '2rem',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          backdropFilter: 'blur(12px)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                المؤسسة
              </label>
              <select
                value={selectedInstitution}
                onChange={e => setSelectedInstitution(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f1f5f9',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">اختر المؤسسة...</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name_ar || inst.name} ({inst.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                الباقة
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {packages.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id.toString())}
                    style={{
                      padding: '1rem',
                      borderRadius: 16,
                      border: selectedPackage === pkg.id.toString()
                        ? '2px solid #FFD700'
                        : '1px solid rgba(255, 215, 0, 0.2)',
                      background: selectedPackage === pkg.id.toString()
                        ? 'rgba(255, 215, 0, 0.1)'
                        : 'rgba(15, 23, 42, 0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ color: '#FFD700', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {pkg.name}
                    </div>
                    <div style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 800 }}>
                      ${pkg.amount}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {pkg.description || `${pkg.amount} رصيد إعلاني`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {message && (
              <div style={{
                padding: '1rem',
                borderRadius: 12,
                background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${message.includes('✅') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: message.includes('✅') ? '#22c55e' : '#ef4444',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}>
                {message}
              </div>
            )}

            {!isAdmin && (
              <div style={{
                padding: '1rem',
                borderRadius: 12,
                background: 'rgba(78, 141, 156, 0.1)',
                border: '1px solid rgba(78, 141, 156, 0.3)',
                color: '#4E8D9C',
                fontSize: '0.9rem',
              }}>
                ℹ️ يمكنك فقط تعبئة رصيد مؤسستك
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedInstitution || !selectedPackage}
              style={{
                padding: '1rem 2rem',
                borderRadius: 12,
                border: 'none',
                background: loading || !selectedInstitution || !selectedPackage
                  ? 'rgba(255, 215, 0, 0.3)'
                  : 'linear-gradient(135deg, #FFD700, #FFA000)',
                color: '#0f172a',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading || !selectedInstitution || !selectedPackage ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'جاري التعبئة...' : '💰 تعبئة الرصيد'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
