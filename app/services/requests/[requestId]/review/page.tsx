import ClientPage from './Client';

export async function generateStaticParams() {
  return [];
}

export default function Page(props: any) {
  return <ClientPage {...props} />;
}