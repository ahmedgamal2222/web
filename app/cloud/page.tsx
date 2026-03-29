import { Metadata } from 'next';
import CloudClient from './Client';

export const metadata: Metadata = {
  title: 'الخدمات السحابية | المجرة الحضارية',
  description: 'منظومة SAAS متكاملة للمؤسسات: ERP, CRM, HR, Funnels, Landing Pages, Registration Forms',
};

export default function CloudPage() {
  return <CloudClient />;
}
