// shared/js/seo.js
const DEFAULTS = {
    siteName: 'Gridwork',
    author: 'Shane Hennessy',
    authorUrl: 'https://hennessyshane.com/',
    ogImageAlt: 'Gridwork responsive logic puzzle interface in high-contrast dark and light themes'
};

function upsertMeta(attrName, attrValue, content, extraAttrs = {}) {
    let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
    for (const [key, val] of Object.entries(extraAttrs)) {
        el.setAttribute(key, val);
    }
}

function upsertLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute(rel, rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

export function applySEO(config) {
    const data = { ...DEFAULTS, ...config };

    document.title = data.title;
    upsertMeta('name', 'description', data.description);
    upsertMeta('name', 'keywords', data.keywords);
    upsertMeta('name', 'author', data.author);
    upsertMeta('name', 'robots', 'index, follow');
    upsertLink('canonical', data.baseUrl);

    upsertMeta('name', 'theme-color', '#f8fafc', { media: '(prefers-color-scheme: light)' });
    upsertMeta('name', 'theme-color', '#0f172a', { media: '(prefers-color-scheme: dark)' });
    upsertMeta('name', 'apple-mobile-web-app-capable', 'yes');
    upsertMeta('name', 'apple-mobile-web-app-title', data.siteName);

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', data.siteName);
    upsertMeta('property', 'og:title', data.ogTitle || data.title);
    upsertMeta('property', 'og:description', data.description);
    upsertMeta('property', 'og:url', data.baseUrl);
    if (data.ogImage) {
        upsertMeta('property', 'og:image', data.ogImage);
        upsertMeta('property', 'og:image:width', '1200');
        upsertMeta('property', 'og:image:height', '630');
        upsertMeta('property', 'og:image:alt', data.ogImageAlt);
    }

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', data.ogTitle || data.title);
    upsertMeta('name', 'twitter:description', data.description);
    if (data.ogImage) {
        upsertMeta('name', 'twitter:image', data.ogImage);
    }

    let ldScript = document.head.querySelector('script[type="application/ld+json"]');
    if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.type = 'application/ld+json';
        document.head.appendChild(ldScript);
    }

    ldScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: data.appName || data.siteName,
        alternateName: data.title,
        url: data.baseUrl,
        description: data.description,
        applicationCategory: 'GameApplication',
        genre: 'Logic Puzzle',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Person', name: data.author, url: data.authorUrl }
    });
}
