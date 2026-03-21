'use client';

import { useEffect, useState } from 'react';
import { Institution } from '@/lib/types';
import { fetchInstitutions } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

// ============================================================
// الألوان الأساسية
// ============================================================
const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

// ============================================================
// أنواع المؤسسات مع ألوانها
// ============================================================
const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  educational: { label: 'تعليمية', color: COLORS.lightMint },
  research: { label: 'بحثية', color: COLORS.softGreen },
  cultural: { label: 'ثقافية', color: COLORS.teal },
  charitable: { label: 'خيرية', color: COLORS.darkNavy },
  media: { label: 'إعلامية', color: '#E6B89C' },
  developmental: { label: 'تنموية', color: '#A7C4B5' },
  default: { label: 'عامة', color: '#B8B8B8' },
};

// ============================================================
// Header Component
// ============================================================
function PageHeader() {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal} 100%)`,
      padding: '60px 40px 100px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* خلفية بنقوش */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        opacity: 0.1,
        background: `
          radial-gradient(circle at 20% 30%, ${COLORS.lightMint} 0%, transparent 20%),
          radial-gradient(circle at 80% 70%, ${COLORS.softGreen} 0%, transparent 25%),
          repeating-linear-gradient(45deg, transparent 0px, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)
        `,
      }} />
      
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* مسار التنقل */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link href="/" style={{
            color: COLORS.lightMint,
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            background: 'rgba(255,255,255,0.12)',
            padding: '6px 16px',
            borderRadius: 30,
            border: `1px solid ${COLORS.lightMint}60`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            ✦ المجرة الحضارية
          </Link>
          <span style={{ color: `${COLORS.lightMint}80`, fontSize: '1rem' }}>›</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>المؤسسات</span>
        </div>

        {/* عنوان الصفحة */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: COLORS.lightMint,
          marginBottom: 20,
          textShadow: `3px 3px 0 ${COLORS.darkNavy}`,
          letterSpacing: '-0.02em',
        }}>
          المؤسسات الحضارية
        </h1>
        
        {/* وصف */}
        <p style={{
          fontSize: '1.2rem',
          color: 'rgba(255,255,255,0.9)',
          maxWidth: 600,
          marginBottom: 40,
          lineHeight: 1.6,
        }}>
          منصة رقمية تجمع المؤسسات التعليمية والبحثية والثقافية في المجرة الحضارية
        </p>
        
        {/* إحصائيات سريعة */}
        <div style={{
          display: 'flex',
          gap: 30,
          flexWrap: 'wrap',
        }}>
          <StatBadge number="150+" label="مؤسسة" color={COLORS.lightMint} />
          <StatBadge number="45+" label="اتفاقية" color={COLORS.softGreen} />
          <StatBadge number="12" label="دولة" color={COLORS.teal} />
          <StatBadge number="5000+" label="مستفيد" color="#E6B89C" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stat Badge Component
// ============================================================
function StatBadge({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${color}`,
      borderRadius: 40,
      padding: '12px 25px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{
        fontSize: '1.8rem',
        fontWeight: 700,
        color: color,
      }}>{number}</span>
      <span style={{
        fontSize: '0.9rem',
        color: 'white',
        opacity: 0.9,
      }}>{label}</span>
    </div>
  );
}

// ============================================================
// Search Bar Component
// ============================================================
function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  return (
    <div style={{
      maxWidth: 800,
      margin: '-30px auto 40px',
      position: 'relative',
      zIndex: 10,
      padding: '0 20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 60,
        boxShadow: `0 20px 40px ${COLORS.darkNavy}30`,
        display: 'flex',
        overflow: 'hidden',
        border: `2px solid ${COLORS.softGreen}`,
      }}>
        <input
          type="text"
          placeholder="🔍 ابحث عن مؤسسة بالاسم، البلد، أو النوع..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          style={{
            flex: 1,
            padding: '20px 30px',
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            direction: 'rtl',
          }}
        />
        <button style={{
          background: COLORS.teal,
          border: 'none',
          padding: '0 40px',
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s',
          borderRight: `2px solid ${COLORS.softGreen}`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = COLORS.darkNavy;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = COLORS.teal;
        }}
        >
          بحث
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Filter Bar Component
// ============================================================
function FilterBar({ 
  activeType, 
  onTypeChange,
  activeCountry,
  onCountryChange,
  countries,
  onSortChange,
}: { 
  activeType: string;
  onTypeChange: (type: string) => void;
  activeCountry: string;
  onCountryChange: (country: string) => void;
  countries: string[];
  onSortChange: (sort: string) => void;
}) {
  const types = [
    { id: 'all', label: 'الكل', color: COLORS.teal },
    { id: 'educational', label: 'تعليمية', color: COLORS.lightMint },
    { id: 'research', label: 'بحثية', color: COLORS.softGreen },
    { id: 'cultural', label: 'ثقافية', color: COLORS.teal },
    { id: 'charitable', label: 'خيرية', color: COLORS.darkNavy },
    { id: 'media', label: 'إعلامية', color: '#E6B89C' },
    { id: 'developmental', label: 'تنموية', color: '#A7C4B5' },
  ];

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto 30px',
      padding: '0 20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '20px',
        boxShadow: `0 5px 20px ${COLORS.darkNavy}20`,
        border: `1px solid ${COLORS.softGreen}40`,
      }}>
        {/* صف التصفية */}
        <div style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 15,
        }}>
          <span style={{
            color: COLORS.darkNavy,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            تصفية حسب:
          </span>
          
          {/* أزرار الأنواع */}
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            flex: 1,
          }}>
            {types.map(type => (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 30,
                  border: `2px solid ${type.color}`,
                  background: activeType === type.id ? type.color : 'transparent',
                  color: activeType === type.id ? 'white' : type.color,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={e => {
                  if (activeType !== type.id) {
                    e.currentTarget.style.background = `${type.color}20`;
                  }
                }}
                onMouseLeave={e => {
                  if (activeType !== type.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* صف إضافي للبلد والترتيب */}
        <div style={{
          display: 'flex',
          gap: 15,
          flexWrap: 'wrap',
          alignItems: 'center',
          borderTop: `1px solid ${COLORS.softGreen}20`,
          paddingTop: 15,
        }}>
          {/* اختيار البلد */}
          <select
            value={activeCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            style={{
              padding: '10px 20px',
              borderRadius: 30,
              border: `2px solid ${COLORS.teal}`,
              background: 'white',
              color: COLORS.darkNavy,
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">🌍 جميع البلدان</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {/* ترتيب حسب */}
          <select
            onChange={(e) => onSortChange(e.target.value)}
            style={{
              padding: '10px 20px',
              borderRadius: 30,
              border: `2px solid ${COLORS.softGreen}`,
              background: 'white',
              color: COLORS.darkNavy,
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="name">📝 ترتيب حسب الاسم</option>
            <option value="weight">⭐ الأكثر تأثيراً</option>
            <option value="founded">📅 الأحدث</option>
            <option value="agreements">🔗 الأكثر اتفاقيات</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Institution Card Component
// ============================================================
function InstitutionCard({ institution }: { institution: Institution }) {
  // تحديد اللون بناءً على النوع
  const typeStyle = TYPE_STYLES[institution.type] || TYPE_STYLES.default;
  
  return (
    <Link href={`/institutions/${institution.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        borderRadius: 30,
        overflow: 'hidden',
        boxShadow: `0 10px 30px ${COLORS.darkNavy}20`,
        transition: 'all 0.3s',
        height: '100%',
        position: 'relative',
        border: `1px solid ${typeStyle.color}40`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-10px)';
        e.currentTarget.style.boxShadow = `0 20px 40px ${COLORS.darkNavy}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 10px 30px ${COLORS.darkNavy}20`;
      }}
      >
        {/* الشريط العلوي حسب النوع */}
        <div style={{
          height: '8px',
          background: `linear-gradient(90deg, ${typeStyle.color}, ${COLORS.softGreen})`,
        }} />

        {/* حالة الشاشة */}
        {institution.screen_active && (
          <div style={{
            position: 'absolute',
            top: 15,
            left: 15,
            background: COLORS.lightMint,
            color: COLORS.darkNavy,
            padding: '5px 12px',
            borderRadius: 30,
            fontSize: '0.7rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            zIndex: 2,
          }}>
            <span>✨</span>
            <span>الشاشة نشطة</span>
          </div>
        )}

        {/* المحتوى */}
        <div style={{ padding: '25px 20px' }}>
          {/* الشعار والاسم */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 15,
            marginBottom: 20,
          }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${typeStyle.color}, ${COLORS.softGreen})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              color: 'white',
              boxShadow: `0 5px 15px ${typeStyle.color}`,
            }}>
              {institution.logo_url ? (
                <Image src={institution.logo_url} alt={institution.name} width={50} height={50} />
              ) : (
                (institution.name_ar || institution.name).charAt(0)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 700,
                color: COLORS.darkNavy,
                marginBottom: 5,
              }}>
                {institution.name_ar || institution.name}
              </h3>
              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <span style={{
                  background: `${typeStyle.color}20`,
                  color: typeStyle.color,
                  padding: '4px 12px',
                  borderRadius: 30,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}>
                  {typeStyle.label}
                </span>
                {institution.is_verified && (
                  <span style={{
                    background: COLORS.softGreen,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 30,
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <span>✓</span>
                    موثقة
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* الموقع */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 15,
            color: COLORS.teal,
            fontSize: '0.9rem',
          }}>
            <span>📍</span>
            <span>{institution.city}، {institution.country}</span>
          </div>

          {/* الإحصائيات */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 20,
            padding: '15px 0',
            borderTop: `1px solid ${COLORS.softGreen}20`,
            borderBottom: `1px solid ${COLORS.softGreen}20`,
          }}>
            <StatItem icon="👥" value={institution.employees_count} label="موظف" />
            <StatItem icon="📊" value={institution.projects_count} label="مشروع" />
            <StatItem icon="🎯" value={institution.beneficiaries_count} label="مستفيد" />
          </div>

          {/* الاتفاقيات */}
        <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }}>
    <span style={{ color: COLORS.teal }}>🔗</span>
    <span style={{ color: COLORS.darkNavy, fontWeight: 600 }}>
      {institution.agreements?.length || 0} اتفاقية
    </span>
  </div>
            <button style={{
              background: 'transparent',
              border: `2px solid ${COLORS.teal}`,
              color: COLORS.teal,
              padding: '8px 16px',
              borderRadius: 30,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = COLORS.teal;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = COLORS.teal;
            }}
            >
              عرض التفاصيل
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Stat Item Component
// ============================================================
function StatItem({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.darkNavy }}>{value}</div>
      <div style={{ fontSize: '0.6rem', color: COLORS.teal }}>{label}</div>
    </div>
  );
}

// ============================================================
// Featured Institutions Section
// ============================================================
function FeaturedSection({ institutions }: { institutions: Institution[] }) {
  const featured = institutions
    .filter(inst => inst.weight > 7)
    .slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <div style={{
      maxWidth: 1200,
      margin: '50px auto',
      padding: '0 20px',
    }}>
      <h2 style={{
        fontSize: '2rem',
        color: COLORS.darkNavy,
        marginBottom: 30,
        textAlign: 'center',
      }}>
        ⭐ المؤسسات الأكثر تأثيراً
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 25,
      }}>
        {featured.map(inst => (
          <div key={inst.id} style={{
            background: `linear-gradient(135deg, ${COLORS.lightMint}40, white)`,
            borderRadius: 30,
            padding: 25,
            border: `2px solid ${COLORS.teal}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* خلفية زخرفية */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              background: COLORS.softGreen,
              opacity: 0.1,
              borderRadius: '50%',
            }} />
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                marginBottom: 15,
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 15,
                  background: COLORS.teal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                }}>
                  ⭐
                </div>
                <div>
                  <h3 style={{ margin: 0, color: COLORS.darkNavy }}>
                    {inst.name_ar || inst.name}
                  </h3>
                  <p style={{ color: COLORS.teal, fontSize: '0.9rem' }}>
                    {inst.city}، {inst.country}
                  </p>
                </div>
              </div>
              
              <Link href={`/institutions/${inst.id}`} style={{
                display: 'block',
                textAlign: 'center',
                background: COLORS.teal,
                color: 'white',
                padding: '12px',
                borderRadius: 40,
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = COLORS.darkNavy;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = COLORS.teal;
              }}
              >
                اكتشف المزيد
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filtered, setFiltered] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // جلب البيانات
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchInstitutions();
        setInstitutions(data);
        setFiltered(data);
      } catch (error) {
        console.error('Error loading institutions:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // تطبيق الفلاتر والبحث
  useEffect(() => {
    let result = [...institutions];

    // فلترة حسب البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inst => 
        (inst.name_ar || inst.name).toLowerCase().includes(query) ||
        inst.country.toLowerCase().includes(query) ||
        inst.city.toLowerCase().includes(query)
      );
    }

    // فلترة حسب النوع
    if (activeType !== 'all') {
      result = result.filter(inst => inst.type === activeType);
    }

    // فلترة حسب البلد
    if (activeCountry !== 'all') {
      result = result.filter(inst => inst.country === activeCountry);
    }

    // الترتيب
    result.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return (a.name_ar || a.name).localeCompare(b.name_ar || b.name);
        case 'weight':
          return (b.weight || 0) - (a.weight || 0);
        case 'founded':
          return (b.founded_year || 0) - (a.founded_year || 0);
        default:
          return 0;
      }
    });

    setFiltered(result);
    setCurrentPage(1);
  }, [searchQuery, activeType, activeCountry, sortBy, institutions]);

  // استخراج قائمة البلدان للفلتر
  const countries = [...new Set(institutions.map(inst => inst.country))].sort();

  // حساب الصفحة الحالية
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // شاشة التحميل
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint} 0%, white 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 80,
            height: 80,
            border: `5px solid ${COLORS.teal}`,
            borderTopColor: COLORS.softGreen,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 20,
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h2 style={{ color: COLORS.darkNavy }}>جاري تحميل المؤسسات...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightMint}20 0%, white 100%)`,
      direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* الهيدر */}
      <PageHeader />

      {/* شريط البحث */}
      <SearchBar onSearch={setSearchQuery} />

      {/* شريط الفلاتر */}
      <FilterBar
        activeType={activeType}
        onTypeChange={setActiveType}
        activeCountry={activeCountry}
        onCountryChange={setActiveCountry}
        countries={countries}
        onSortChange={setSortBy}
      />

      {/* قسم المؤسسات المميزة (يظهر فقط في الصفحة الرئيسية) */}
      {searchQuery === '' && activeType === 'all' && activeCountry === 'all' && (
        <FeaturedSection institutions={institutions} />
      )}

      {/* شبكة المؤسسات */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 50px',
        padding: '0 20px',
      }}>
        {/* عدد النتائج */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          color: COLORS.teal,
        }}>
          <span>
            عرض {currentItems.length} من أصل {filtered.length} مؤسسة
          </span>
          <span>
            الصفحة {currentPage} من {totalPages}
          </span>
        </div>

        {/* شبكة البطاقات */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 25,
        }}>
          {currentItems.map(institution => (
            <InstitutionCard key={institution.id} institution={institution} />
          ))}
        </div>

        {/* إذا لم توجد نتائج */}
        {currentItems.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: 30,
            border: `2px dashed ${COLORS.teal}`,
          }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>🌌</span>
            <h3 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>لا توجد نتائج</h3>
            <p style={{ color: COLORS.teal }}>حاول تغيير معايير البحث</p>
          </div>
        )}

        {/* أزرار التنقل بين الصفحات */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            marginTop: 40,
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '12px 25px',
                borderRadius: 40,
                border: `2px solid ${COLORS.teal}`,
                background: currentPage === 1 ? 'transparent' : COLORS.teal,
                color: currentPage === 1 ? COLORS.teal : 'white',
                cursor: currentPage === 1 ? 'default' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s',
              }}
            >
              ← السابق
            </button>
            
            <span style={{
              padding: '12px 25px',
              background: COLORS.lightMint,
              borderRadius: 40,
              color: COLORS.darkNavy,
              fontWeight: 600,
            }}>
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '12px 25px',
                borderRadius: 40,
                border: `2px solid ${COLORS.teal}`,
                background: currentPage === totalPages ? 'transparent' : COLORS.teal,
                color: currentPage === totalPages ? COLORS.teal : 'white',
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s',
              }}
            >
              التالي →
            </button>
          </div>
        )}
      </div>

      {/* فوتر بسيط */}
      <footer style={{
        background: COLORS.darkNavy,
        color: 'white',
        padding: '30px',
        textAlign: 'center',
        marginTop: 50,
      }}>
        <p style={{ opacity: 0.8 }}>© 2026 المجرة الحضارية - جميع الحقوق محفوظة</p>
        <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>منصة رقمية للمؤسسات الحضارية</p>
      </footer>
    </div>
  );
}