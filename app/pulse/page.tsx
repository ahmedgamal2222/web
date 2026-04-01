import { Metadata } from 'next';
import PulseClient from './Client';

export const metadata: Metadata = {
  title: 'نبض المجرة | المجرة الحضارية',
  description: 'تابع أحدث أحداث المجرة الحضارية من اتفاقيات وفعاليات وأخبار المؤسسات',
};

export default function PulsePage() {
  return <PulseClient />;
}
