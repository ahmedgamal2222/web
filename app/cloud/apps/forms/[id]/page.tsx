import FormDetailClient from './Client';
export async function generateStaticParams() { return [{ id: 'default' }]; }
export default function FormDetailPage() { return <FormDetailClient />; }
