import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local overrides if present without failing when absent
const envLocalPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_TITLE = 'DESTALION — Experimental Multimedia Design Studio';
const DEFAULT_DESCRIPTION =
  'DESTALION is an experimental multimedia design studio specializing in distinctive visual identities, typographic systems, and high-impact digital releases.';
const DEFAULT_OG_IMAGE_PATH = '/og-default.jpg';

interface PublicProjectMeta {
  id: string;
  title: string;
  shortDesc: string;
  imageUrl: string;
  category?: string;
  client?: string;
  date?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveRequestOrigin(req: Request): string {
  const configuredAppUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  const forwardedHost = req.get('x-forwarded-host') || req.get('host');
  const forwardedProto = req.get('x-forwarded-proto') || req.protocol || 'https';

  if (forwardedHost) {
    const cleanProto = forwardedProto.split(',')[0].trim() || 'https';
    const cleanHost = forwardedHost.split(',')[0].trim();
    return `${cleanProto}://${cleanHost}`;
  }

  if (configuredAppUrl && configuredAppUrl !== 'MY_APP_URL') {
    return configuredAppUrl;
  }

  return `http://127.0.0.1:${PORT}`;
}

function resolveAbsoluteImageUrl(rawUrl: string | null | undefined, origin: string): string {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }
  return `${origin}${DEFAULT_OG_IMAGE_PATH}`;
}

function extractCaseStudyIdFromRequest(req: Request): string | null {
  const pathMatch = req.path.match(/^\/case-study\/([^/?#]+)\/?$/i);
  if (pathMatch && pathMatch[1]) {
    try {
      return decodeURIComponent(pathMatch[1]).trim() || null;
    } catch {
      return pathMatch[1].trim() || null;
    }
  }

  const queryVal = req.query['case-study'] || req.query['work'];
  if (typeof queryVal === 'string' && queryVal.trim()) {
    return queryVal.trim();
  }

  return null;
}

async function fetchPublicProjectMeta(projectId: string): Promise<PublicProjectMeta | null> {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === 'https://your-project.supabase.co' ||
    supabaseAnonKey === 'your-anon-key'
  ) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const endpoint = `${supabaseUrl}/rest/v1/portfolio_projects?id=eq.${encodeURIComponent(
      projectId
    )}&select=id,title,short_desc,full_desc,image_url,category,client,date&limit=1`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || typeof row.title !== 'string') return null;

    const rawDesc =
      (typeof row.short_desc === 'string' && row.short_desc.trim()) ||
      (typeof row.full_desc === 'string' && row.full_desc.trim()) ||
      DEFAULT_DESCRIPTION;

    return {
      id: String(row.id || projectId),
      title: row.title.trim(),
      shortDesc: rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc,
      imageUrl: typeof row.image_url === 'string' ? row.image_url : '',
      category: typeof row.category === 'string' ? row.category : undefined,
      client: typeof row.client === 'string' ? row.client : undefined,
      date: typeof row.date === 'string' ? row.date : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function injectSocialMetadata(
  htmlTemplate: string,
  origin: string,
  requestUrl: string,
  projectMeta: PublicProjectMeta | null
): string {
  const title = projectMeta
    ? `${projectMeta.title} — DESTALION Case Study`
    : DEFAULT_TITLE;
  const description = projectMeta ? projectMeta.shortDesc : DEFAULT_DESCRIPTION;
  const canonicalUrl = projectMeta
    ? `${origin}/case-study/${encodeURIComponent(projectMeta.id)}`
    : `${origin}${requestUrl.split('#')[0] || '/'}`;
  const ogImage = resolveAbsoluteImageUrl(projectMeta?.imageUrl, origin);
  const ogImageAlt = projectMeta
    ? `${projectMeta.title} — DESTALION`
    : 'DESTALION Experimental Multimedia Design Studio Showcase';
  const ogType = projectMeta ? 'article' : 'website';

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeCanonical = escapeHtml(canonicalUrl);
  const safeOgImage = escapeHtml(ogImage);
  const safeOgImageAlt = escapeHtml(ogImageAlt);

  const structuredData = projectMeta
    ? {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: projectMeta.title,
        description,
        image: ogImage,
        url: canonicalUrl,
        ...(projectMeta.category ? { genre: projectMeta.category } : {}),
        ...(projectMeta.date ? { datePublished: projectMeta.date } : {}),
        creator: {
          '@type': 'Organization',
          name: 'DESTALION',
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'DesignAgency',
        name: 'DESTALION',
        description: DEFAULT_DESCRIPTION,
        url: origin,
        image: ogImage,
      };

  const safeJsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  const metaBlock = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${safeCanonical}" />
    <meta property="og:site_name" content="DESTALION" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${safeCanonical}" />
    <meta property="og:image" content="${safeOgImage}" />
    <meta property="og:image:secure_url" content="${safeOgImage}" />
    <meta property="og:image:alt" content="${safeOgImageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeOgImage}" />
    <script type="application/ld+json">${safeJsonLd}</script>
  `.trim();

  // Strip static default SEO/OG/Twitter/JSON-LD block before replacing cleanly
  const cleaned = htmlTemplate
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, '')
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

  return cleaned.replace('</head>', `    ${metaBlock}\n  </head>`);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);

  let viteServer: Awaited<ReturnType<typeof import('vite')['createServer']>> | null = null;
  const distDir = path.resolve(__dirname, 'dist');

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    viteServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(viteServer.middlewares);
  } else {
    app.use(
      express.static(distDir, {
        index: false,
      })
    );
  }

  app.get('*', async (req: Request, res: Response, next) => {
    // Let real missing static assets 404 instead of serving HTML
    if (
      /\.(js|mjs|cjs|ts|tsx|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|json|map|txt|xml)$/i.test(
        req.path
      )
    ) {
      return next();
    }

    try {
      const origin = resolveRequestOrigin(req);
      const caseStudyId = extractCaseStudyIdFromRequest(req);
      const projectMeta = caseStudyId
        ? await fetchPublicProjectMeta(caseStudyId)
        : null;

      const templatePath = isProduction
        ? path.resolve(distDir, 'index.html')
        : path.resolve(__dirname, 'index.html');

      let template = fs.readFileSync(templatePath, 'utf-8');
      if (viteServer) {
        template = await viteServer.transformIndexHtml(req.originalUrl, template);
      }

      const finalHtml = injectSocialMetadata(
        template,
        origin,
        req.originalUrl,
        projectMeta
      );

      res
        .status(200)
        .set({ 'Content-Type': 'text/html; charset=utf-8' })
        .end(finalHtml);
    } catch (err) {
      if (viteServer && err instanceof Error) {
        viteServer.ssrFixStacktrace(err);
      }
      next(err);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DESTALION server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
