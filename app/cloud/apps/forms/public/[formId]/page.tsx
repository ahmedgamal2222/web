import PublicFormClient from './Client';

export async function generateStaticParams() {
  return [{ formId: 'default' }];
}

export default function PublicFormPage() {
  return <PublicFormClient />;
}
