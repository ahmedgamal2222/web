import { Metadata } from 'next';
import LandingPageClient from './Client';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
    const res = await fetch(`${API}/api/public/landing/${params.slug}`, { cache: 'no-store' });
    const d = await res.json();
    if (d.success && d.data) {
      return {
        title: d.data.meta_title || d.data.title,
        description: d.data.meta_description || '',
      };
    }
  } catch {}
  return { title: 'صفحة هبوط' };
}

export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

export default function LandingPage({ params }: { params: { slug: string } }) {
  return <LandingPageClient slug={params.slug} />;
}
