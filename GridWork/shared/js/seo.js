// shared/js/seo.js
const DEFAULTS = {
    siteName: 'Gridwork',
    author: 'Shane Hennessy',
    authorUrl: 'https://hennessyshane.com/',
    ogImageAlt: 'Gridwork responsive logic puzzle interface in high-contrast dark and light themes'
};

function upsertMeta(attrName, attrValue, content, extraAttrs = {}) {
    if (!content) return;
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
    if (!href) return;
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

function upsertJsonLd(schema) {
    let ldScript = document.head.querySelector('script[type="application/ld+json"]');
    if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.type = 'application/ld+json';
        document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(schema);
}

export function applySEO(config) {
    const data = { ...DEFAULTS, ...config };
    const socialTitle = data.ogTitle || data.title;
    const socialDesc = data.ogDescription || data.description;

    document.title = data.title;
    upsertLink('canonical', data.baseUrl);

    const metaTags = [
        // Standard SEO & Mobile Theme
        ['name', 'description', data.description],
        ['name', 'keywords', data.keywords],
        ['name', 'author', data.author],
        ['name', 'robots', 'index, follow'],
        ['name', 'apple-mobile-web-app-title', data.siteName],
        ['name', 'theme-color', '#f8fafc', { media: '(prefers-color-scheme: light)' }],
        ['name', 'theme-color', '#0f172a', { media: '(prefers-color-scheme: dark)' }],

        // Open Graph
        ['property', 'og:type', 'website'],
        ['property', 'og:site_name', data.siteName],
        ['property', 'og:title', socialTitle],
        ['property', 'og:description', socialDesc],
        ['property', 'og:url', data.baseUrl],
        ...(data.ogImage ? [
            ['property', 'og:image', data.ogImage],
            ['property', 'og:image:width', '1200'],
            ['property', 'og:image:height', '630'],
            ['property', 'og:image:alt', data.ogImageAlt]
        ] : []),

        // Twitter / X Cards
        ['name', 'twitter:card', 'summary_large_image'],
        ['name', 'twitter:title', socialTitle],
        ['name', 'twitter:description', socialDesc],
        ...(data.ogImage ? [
            ['name', 'twitter:image', data.ogImage],
            ['name', 'twitter:image:alt', data.ogImageAlt]
        ] : [])
    ];

    metaTags.forEach(args => upsertMeta(...args));

    upsertJsonLd({
        '@context': 'https://schema.org',
        '@type': data.schemaType || 'WebApplication',
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
