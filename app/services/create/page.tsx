// app/services/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

export default function CreateServicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // نموذج الخدمة
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    currency: 'EGP',
    delivery_time: '',
    image_url: '',
    tags: [] as string[],
    currentTag: '',
  });

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const checkAuth = async () => {
      const userStr = localStorage.getItem('user');
      const sessionId = localStorage.getItem('sessionId');
      
      if (!userStr || !sessionId) {
        router.push('/login?redirect=/services/create');
        return;
      }

      try {
        // التحقق من صحة الجلسة مع الخادم
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'X-Session-ID': sessionId,
          },
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          setUser(data.user);
          // تحديث بيانات المستخدم في التخزين المحلي
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // الجلسة غير صالحة
          localStorage.removeItem('user');
          localStorage.removeItem('sessionId');
          router.push('/login?redirect=/services/create');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // في حالة خطأ الشبكة، نسمح بالمتابعة مع البيانات المخزنة مؤقتاً
        setUser(JSON.parse(userStr));
      }
    };

    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTag = () => {
    if (formData.currentTag.trim() && !formData.tags.includes(formData.currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.currentTag.trim()],
        currentTag: '',
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${API_BASE}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId || '',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          currency: formData.currency,
          delivery_time: parseInt(formData.delivery_time),
          image_url: formData.image_url || undefined,
          tags: formData.tags,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/services');
        }, 2000);
      } else {
        if (response.status === 401) {
          // غير مصرح - ربما انتهت الجلسة
          localStorage.removeItem('user');
          localStorage.removeItem('sessionId');
          router.push('/login?redirect=/services/create');
        } else {
          setError(data.error || 'فشل إنشاء الخدمة');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        جاري التحميل...
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 30,
          padding: '50px',
          maxWidth: 400,
          textAlign: 'center',
          boxShadow: `0 20px 40px ${COLORS.darkNavy}20`,
        }}>
          <div style={{
            width: 80,
            height: 80,
            background: COLORS.softGreen,
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: 'white',
          }}>
            ✓
          </div>
          <h2 style={{ color: COLORS.darkNavy, marginBottom: 10 }}>
            تم إنشاء الخدمة بنجاح!
          </h2>
          <p style={{ color: COLORS.teal, marginBottom: 20 }}>
            سيتم مراجعة الخدمة ونشرها قريباً
          </p>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${COLORS.teal}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '20px auto',
          }} />
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            جاري تحويلك إلى صفحة الخدمات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap page-inner" style={{ direction: 'rtl' }}>
      {/* الهيدر */}
      <div style={{
        background: COLORS.darkNavy,
        borderRadius: 30,
        padding: '40px',
        marginBottom: 30,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: 200,
          height: 200,
          background: COLORS.teal,
          opacity: 0.2,
          borderRadius: '50%',
        }} />
        
        <Link href="/services" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: COLORS.lightMint,
          textDecoration: 'none',
          marginBottom: 20,
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 40,
          fontSize: '0.9rem',
        }}>
          <span>←</span>
          العودة إلى الخدمات
        </Link>

        <h1 style={{ fontSize: '2.5rem', marginBottom: 10 }}>
          ✦ إنشاء خدمة جديدة
        </h1>
        <p style={{ maxWidth: 600, opacity: 0.9 }}>
          شارك مهاراتك وخدماتك مع المجتمع في المجرة الحضارية
        </p>

        {/* مؤشر الخطوات */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 30,
        }}>
          <StepIndicator 
            number={1} 
            label="المعلومات الأساسية" 
            active={currentStep === 1} 
            completed={currentStep > 1}
          />
          <StepIndicator 
            number={2} 
            label="التفاصيل والسعر" 
            active={currentStep === 2} 
            completed={currentStep > 2}
          />
          <StepIndicator 
            number={3} 
            label="الوسوم والصورة" 
            active={currentStep === 3} 
            completed={currentStep > 3}
          />
        </div>
      </div>

      {/* نموذج إنشاء الخدمة */}
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: 30,
        padding: '40px',
        maxWidth: 800,
        margin: '0 auto',
        boxShadow: `0 10px 30px ${COLORS.darkNavy}20`,
      }}>
        {error && (
          <div style={{
            background: '#ff505020',
            border: '1px solid #ff5050',
            borderRadius: 10,
            padding: '12px',
            marginBottom: 30,
            color: '#ff5050',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* الخطوة 1: المعلومات الأساسية */}
        {currentStep === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{
              color: COLORS.teal,
              fontSize: '1.3rem',
              marginBottom: 25,
              paddingBottom: 10,
              borderBottom: `2px solid ${COLORS.lightMint}`,
            }}>
              المعلومات الأساسية
            </h2>

            <div style={{ marginBottom: 25 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: COLORS.darkNavy,
                fontWeight: 600,
              }}>
                عنوان الخدمة *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="مثال: تصميم هوية بصرية متكاملة"
                style={inputStyle}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 5 }}>
                عنوان واضح ومحدد للخدمة (3-100 حرف)
              </p>
            </div>

            <div style={{ marginBottom: 25 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: COLORS.darkNavy,
                fontWeight: 600,
              }}>
                وصف الخدمة *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="اشرح بالتفصيل ماذا تقدم، ما هي المخرجات، وكيف ستعمل..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 5 }}>
                وصف مفصل للخدمة (20-2000 حرف)
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: '12px 30px',
                  background: COLORS.teal,
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* الخطوة 2: التفاصيل والسعر */}
        {currentStep === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{
              color: COLORS.teal,
              fontSize: '1.3rem',
              marginBottom: 25,
              paddingBottom: 10,
              borderBottom: `2px solid ${COLORS.lightMint}`,
            }}>
              تفاصيل الخدمة والسعر
            </h2>

            <div style={{ marginBottom: 25 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: COLORS.darkNavy,
                fontWeight: 600,
              }}>
                التصنيف *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">-- اختر التصنيف --</option>
                <option value="تصميم جرافيك">🎨 تصميم جرافيك</option>
                <option value="برمجة وتطوير">💻 برمجة وتطوير</option>
                <option value="تسويق">📈 تسويق</option>
                <option value="ترجمة">🌐 ترجمة</option>
                <option value="كتابة وتحرير">✍️ كتابة وتحرير</option>
                <option value="تدريب وتعليم">📚 تدريب وتعليم</option>
                <option value="استشارات">💡 استشارات</option>
                <option value="أخرى">🛠️ أخرى</option>
              </select>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 15,
              marginBottom: 25,
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  السعر *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                }}>
                  العملة *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
                  <option value="EGP">جنيه مصري</option>
                  <option value="USD">دولار أمريكي</option>
                  <option value="SAR">ريال سعودي</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 25 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: COLORS.darkNavy,
                fontWeight: 600,
              }}>
                مدة التسليم (بالأيام) *
              </label>
              <input
                type="number"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleChange}
                required
                min="1"
                placeholder="مثال: 7"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: '12px 30px',
                  background: 'transparent',
                  color: COLORS.teal,
                  border: `2px solid ${COLORS.teal}`,
                  borderRadius: 40,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                style={{
                  padding: '12px 30px',
                  background: COLORS.teal,
                  color: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* الخطوة 3: الوسوم والصورة */}
        {currentStep === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{
              color: COLORS.teal,
              fontSize: '1.3rem',
              marginBottom: 25,
              paddingBottom: 10,
              borderBottom: `2px solid ${COLORS.lightMint}`,
            }}>
              الوسوم وصورة الخدمة
            </h2>

            <div style={{ marginBottom: 25 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: COLORS.darkNavy,
                fontWeight: 600,
              }}>
                رابط صورة الخدمة (اختياري)
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                style={inputStyle}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 5 }}>
                صورة تعبر عن الخدمة (يفضل 800x600)
              </p>
            </div>

            <div style={{ marginBottom: 25 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: COLORS.darkNavy,
                fontWeight: 600,
              }}>
                الوسوم (Tags)
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={formData.currentTag}
                  onChange={(e) => setFormData({ ...formData, currentTag: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder="أضف وسماً ثم اضغط Enter"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  style={{
                    padding: '12px 20px',
                    background: COLORS.teal,
                    color: 'white',
                    border: 'none',
                    borderRadius: 40,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  إضافة
                </button>
              </div>

              {/* عرض الوسوم المضافة */}
              {formData.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 15,
                  padding: '15px',
                  background: `${COLORS.lightMint}20`,
                  borderRadius: 12,
                }}>
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 12px',
                        background: COLORS.teal,
                        color: 'white',
                        borderRadius: 30,
                        fontSize: '0.85rem',
                      }}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '0 4px',
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ملخص الخدمة */}
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
              borderRadius: 16,
              padding: '20px',
              marginBottom: 25,
              border: `1px solid ${COLORS.teal}40`,
            }}>
              <h3 style={{
                color: COLORS.teal,
                fontSize: '1rem',
                marginBottom: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>📋</span>
                ملخص الخدمة
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>العنوان</div>
                  <div style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                    {formData.title || 'لم يحدد'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>التصنيف</div>
                  <div style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                    {formData.category || 'لم يحدد'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>السعر</div>
                  <div style={{ fontWeight: 600, color: COLORS.teal }}>
                    {formData.price || '0'} {formData.currency}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>المدة</div>
                  <div style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                    {formData.delivery_time || '0'} يوم
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: '12px 30px',
                  background: 'transparent',
                  color: COLORS.teal,
                  border: `2px solid ${COLORS.teal}`,
                  borderRadius: 40,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                السابق
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 40px',
                  background: COLORS.softGreen,
                  color: COLORS.darkNavy,
                  border: 'none',
                  borderRadius: 40,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء الخدمة'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* نصائح سريعة */}
      <div style={{
        maxWidth: 800,
        margin: '30px auto 0',
        padding: '20px',
        background: 'white',
        borderRadius: 20,
        border: `1px solid ${COLORS.teal}40`,
      }}>
        <h3 style={{
          color: COLORS.teal,
          fontSize: '1rem',
          marginBottom: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>💡</span>
          نصائح لخدمة ناجحة
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 15,
        }}>
          <TipCard
            icon="🎯"
            title="كن محدداً"
            description="اشرح بالضبط ماذا تقدم، وما هي المخرجات المتوقعة"
          />
          <TipCard
            icon="💰"
            title="سعر مناسب"
            description="حدد سعراً يتناسب مع خبرتك وجودة الخدمة"
          />
          <TipCard
            icon="⏱️"
            title="مدة واقعية"
            description="حدد مدة تسليم مناسبة وتأكد من الالتزام بها"
          />
          <TipCard
            icon="🏷️"
            title="وسوم دقيقة"
            description="استخدم وسماً دقيقة تساعد العملاء في العثور على خدمتك"
          />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// المكونات المساعدة
// ============================================================

function StepIndicator({ number, label, active, completed }: { 
  number: number; 
  label: string; 
  active: boolean; 
  completed: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: completed ? COLORS.softGreen : (active ? COLORS.teal : 'rgba(255,255,255,0.2)'),
        color: completed || active ? COLORS.darkNavy : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
      }}>
        {completed ? '✓' : number}
      </div>
      <span style={{
        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
        fontSize: '0.9rem',
        fontWeight: active ? 600 : 400,
      }}>
        {label}
      </span>
    </div>
  );
}

function TipCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      padding: '15px',
      background: `${COLORS.lightMint}20`,
      borderRadius: 12,
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
      <h4 style={{ color: COLORS.darkNavy, fontSize: '0.9rem', marginBottom: 5 }}>{title}</h4>
      <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: `2px solid ${COLORS.teal}40`,
  borderRadius: 12,
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.3s',
  boxSizing: 'border-box' as const,
  backgroundColor: 'white',
};