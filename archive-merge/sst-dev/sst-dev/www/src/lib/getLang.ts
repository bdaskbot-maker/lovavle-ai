export function getLang(Astro: any): string {
  // Prefer explicit query param, then cookie, then route-local language, then fallback to 'en'
  const queryLang = Astro?.url?.searchParams?.get('lang') || null;

  const cookieHeader = Astro?.request?.headers ? (Astro.request.headers.get('cookie') || '') : '';
  const cookies = cookieHeader
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .reduce((acc: Record<string, string>, pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return acc;
      const k = pair.slice(0, idx).trim();
      let v = pair.slice(idx + 1).trim();
      try { v = decodeURIComponent(v); } catch (e) { /* ignore */ }
      acc[k] = v;
      return acc;
    }, {} as Record<string, string>);

  const cookieLang = cookies['lang'] || null;
  const routeLang = Astro?.locals?.starlightRoute?.lang || null;

  return queryLang || cookieLang || routeLang || 'en';
}
