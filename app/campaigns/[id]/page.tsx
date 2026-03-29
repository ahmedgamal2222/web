import ClientPage from './Client';
export const dynamicParams = false;
export async function generateStaticParams() { return [{ id: 'default' }]; }
export default function Page() { return <ClientPage />; }
