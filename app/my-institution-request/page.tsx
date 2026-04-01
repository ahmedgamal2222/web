import { Metadata } from 'next';
import MyInstitutionRequestClient from './Client';

export const metadata: Metadata = {
  title: 'طلبات اعتماد المؤسسة | المجرة الحضارية',
};

export default function MyInstitutionRequestPage() {
  return <MyInstitutionRequestClient />;
}
