'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmail, resendVerification } from '@/lib/api';
import Link from 'next/link';

type State = 'loading' | 'success' | 'error' | 'resent' | 'resending';

export default function VerifyEmailClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');

  const [state, setState] = useState<State>(token ? 'loading' : 'error');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('لا يوجد رابط تأكيد. يرجى التحقق من البريد الإلكتروني.');
      setState('error');
      return;
    }

    verifyEmail(token).then((res) => {
      if (res.success) {
        // تحديث بيانات المستخدم المخزنة محلياً
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.email_verified = true;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (_) {}

        setMessage(res.message || 'تم تأكيد بريدك الإلكتروني بنجاح!');
        setState('success');
      } else {
        setMessage(res.error || 'رابط غير صالح أو منتهي الصلاحية.');
        setState('error');
      }
    });
  }, [token]);

  const handleResend = async () => {
    setState('resending');
    const res = await resendVerification();
    if (res.success) {
      setMessage('تم إرسال رابط التأكيد إلى بريدك الإلكتروني.');
      setState('resent');
    } else {
      setMessage(res.error || 'حدث خطأ. تأكد من تسجيل دخولك أولاً.');
      setState('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0618 0%, #13103a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      direction: 'rtl',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(78,141,156,0.3)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {/* أيقونة الحالة */}
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
          {state === 'loading' && '⏳'}
          {state === 'success' && '✅'}
          {(state === 'error') && '❌'}
          {(state === 'resent') && '📧'}
          {state === 'resending' && '⏳'}
        </div>

        {/* العنوان */}
        <h1 style={{
          color: '#EDF7BD',
          fontSize: '1.6rem',
          fontWeight: 800,
          margin: '0 0 12px',
        }}>
          {state === 'loading' && 'جاري التحقق...'}
          {state === 'success' && 'تم التأكيد! 🎉'}
          {state === 'error' && 'رابط غير صالح'}
          {state === 'resent' && 'تم الإرسال!'}
          {state === 'resending' && 'جاري الإرسال...'}
        </h1>

        {/* الرسالة */}
        {message && (
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '1rem',
            lineHeight: 1.7,
            margin: '0 0 28px',
          }}>
            {message}
          </p>
        )}

        {/* أزرار الحالة */}
        {state === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/my-institution-request"
              style={{
                display: 'block',
                background: 'linear-gradient(135deg, #4E8D9C, #281C59)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              ✦ قدّم طلب اعتماد مؤسستك
            </Link>
            <Link
              href="/"
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              الذهاب للصفحة الرئيسية
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleResend}
              style={{
                background: 'linear-gradient(135deg, #4E8D9C, #281C59)',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '40px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              📧 إعادة إرسال رابط التأكيد
            </button>
            <Link
              href="/login"
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              تسجيل الدخول أولاً
            </Link>
          </div>
        )}

        {state === 'resent' && (
          <Link
            href="/"
            style={{
              display: 'inline-block',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            العودة للصفحة الرئيسية
          </Link>
        )}

        {/* شعار */}
        <div style={{
          marginTop: '32px',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.8rem',
        }}>
          ✦ المجرة الحضارية
        </div>
      </div>
    </div>
  );
}
