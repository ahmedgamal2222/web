import { Suspense } from 'react';
import VerifyEmailClient from './Client';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحميل...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
