import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const indexPath = resolve(dist, 'index.html');
const SITE_BASE = 'https://d246810g2000.github.io/joy-jacky.love';
const ALBUM_HERO_IMAGE =
  'https://res.cloudinary.com/djqnqxzha/image/upload/f_auto,q_auto:good,w_1200,c_limit/wedding_20260530/260530-14.jpg';

const ROUTE_OG = {
  album: {
    title: 'Joy & Jacky 婚禮相簿',
    description:
      '沿著婚禮影片時間軸，重溫照片與影像交織的每個精彩瞬間。輸入姓名或桌號，秒找屬於您的照片。',
    url: `${SITE_BASE}/album`,
    image: ALBUM_HERO_IMAGE,
  },
  photo: {
    title: 'Joy & Jacky 婚禮相簿',
    description:
      '沿著婚禮影片時間軸，重溫照片與影像交織的每個精彩瞬間。輸入姓名或桌號，秒找屬於您的照片。',
    url: `${SITE_BASE}/album`,
    image: ALBUM_HERO_IMAGE,
  },
};

function applyRouteMeta(html, og) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${og.title}</title>`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${og.url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${og.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${og.description}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${og.image}$2`)
    .replace(/(<meta property="twitter:title" content=")[^"]*(")/, `$1${og.title}$2`)
    .replace(/(<meta property="twitter:description" content=")[^"]*(")/, `$1${og.description}$2`)
    .replace(/(<meta property="twitter:image" content=")[^"]*(")/, `$1${og.image}$2`);
}

const baseHtml = await readFile(indexPath, 'utf8');

for (const route of Object.keys(ROUTE_OG)) {
  const routeDir = resolve(dist, route);
  await mkdir(routeDir, { recursive: true });
  const html = applyRouteMeta(baseHtml, ROUTE_OG[route]);
  await writeFile(resolve(routeDir, 'index.html'), html, 'utf8');
  await writeFile(resolve(dist, `${route}.html`), html, 'utf8');
}

console.log(`Prepared direct GitHub Pages routes: ${Object.keys(ROUTE_OG).join(', ')}`);
