/**
 * Cloudflare Pages Middleware
 * يعيد توجيه طلبات نطاق tv.hadmaj.com إلى صفحة /tv/
 *
 * يعمل مع Cloudflare Pages حتى عند استخدام Next.js output: 'export'
 * لأنه يُشغَّل على حافة شبكة Cloudflare قبل تقديم الملفات الثابتة.
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

    // الجذر / أو ‎/index.html → صفحة /tv/
    if (path === '/' || path === '/index.html' || path === '') {
      const rewritten = new URL(context.request.url);
      rewritten.pathname = '/tv/';
      return fetch(rewritten.toString(), context.request);
    }

    // /tv/... → مرور مباشر (لا حاجة لإعادة الكتابة)
    if (path.startsWith('/tv/') || path === '/tv') {
      return context.next();
    }

    // أي مسار آخر على tv.hadmaj.com يُعاد توجيهه إلى /tv/
    return Response.redirect(`https://tv.hadmaj.com/tv/`, 302);
  }

  return context.next();
}
