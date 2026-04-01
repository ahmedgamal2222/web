/**
 * Cloudflare Pages Middleware
 * يعيد توجيه طلبات نطاق tv.hadmaj.com إلى صفحة الشاشة الحضارية
 */
export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: Record<string, unknown>;
}): Promise<Response> {
  const url = new URL(context.request.url);
  const host = url.hostname;

  // --- نطاق TV ---
  if (host === 'tv.hadmaj.com') {
    const path = url.pathname;

    // الأصول الثابتة تمر مباشرة دون إعادة توجيه
    if (
      path.startsWith('/_next/') ||
      path.startsWith('/fonts/') ||
      path.startsWith('/sound/') ||
      path.startsWith('/images/') ||
      path.endsWith('.ico') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.webp') ||
      path.endsWith('.svg') ||
      path.endsWith('.woff') ||
      path.endsWith('.woff2') ||
      path.endsWith('.js') ||
      path.endsWith('.css') ||
      path.endsWith('.json') ||
      path.endsWith('.mp3') ||
      path.endsWith('.mp4')
    ) {
      return context.next();
    }

    // صفحة الشاشة — مرور مباشر
    if (path.startsWith('/screen/')) {
      return context.next();
    }

    // الجذر وأي مسار آخر → إعادة توجيه لصفحة الشاشة العامة
    return Response.redirect('https://tv.hadmaj.com/screen/tv/', 302);
  }

  return context.next();
}
