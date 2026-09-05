import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const routes = ['photo'];

for (const route of routes) {
  const routeDir = resolve(dist, route);
  await mkdir(routeDir, { recursive: true });
  await copyFile(resolve(dist, 'index.html'), resolve(routeDir, 'index.html'));
  await copyFile(resolve(dist, 'index.html'), resolve(dist, route));
}

console.log(`Prepared direct GitHub Pages routes: ${routes.join(', ')}`);
