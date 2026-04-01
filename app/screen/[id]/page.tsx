import ClientPage from './Client';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: 'default' }, { id: 'tv' }];
}

export default function Page() {
  return <ClientPage />;
}
