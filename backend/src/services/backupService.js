import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fetchWorks } from './apiService.js';

const BASE_URL = 'https://api.cinemango.org';
const BACKUPS_DIR = path.resolve('backups');

let isRunning = false;
const clients = new Set();

export function addSSEClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(data);
  }
}

export function getIsRunning() {
  return isRunning;
}

function richTextToMarkdown(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        return block.children?.map((c) => c.text || '').join('') || '';
      }
      if (block.type === 'heading') {
        const level = '#'.repeat(block.level || 2);
        return `${level} ${block.children?.map((c) => c.text || '').join('') || ''}`;
      }
      if (block.type === 'list') {
        return block.children
          ?.map((item) => `- ${item.children?.map((c) => c.text || '').join('') || ''}`)
          .join('\n') || '';
      }
      return block.children?.map((c) => c.text || '').join('') || '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function buildMarkdown(work) {
  const categories = (work.categories || []).map((c) => c.Category).filter(Boolean);
  const description = richTextToMarkdown(work.description);
  const images = (work.gallery_images || []).map((img) => img.name || path.basename(img.url));

  const lines = [
    `# ${work.title || work.URL_slug}`,
    '',
    '## Metadata',
    `- **Slug:** ${work.URL_slug}`,
    `- **Type:** ${work.type || '—'}`,
    `- **Featured:** ${work.featured ? 'Yes' : 'No'}`,
    `- **Published:** ${work.publishedDate || '—'}`,
  ];

  if (categories.length) {
    lines.push('', '## Categories');
    categories.forEach((c) => lines.push(`- ${c}`));
  }

  if (description) {
    lines.push('', '## Description', '', description);
  }

  if (images.length) {
    lines.push('', '## Images');
    images.forEach((img) => lines.push(`- ${img}`));
  }

  return lines.join('\n');
}

function buildCategoriesIndex(works) {
  const map = new Map();
  for (const work of works) {
    for (const cat of work.categories || []) {
      if (!cat.Category) continue;
      if (!map.has(cat.Category)) map.set(cat.Category, []);
      map.get(cat.Category).push({ title: work.title, slug: work.URL_slug });
    }
  }

  const lines = ['# Categories', ''];
  for (const [category, items] of [...map.entries()].sort()) {
    lines.push(`## ${category}`, '');
    items.forEach((w) => lines.push(`- [${w.title}](./${w.slug}/index.md)`));
    lines.push('');
  }
  return lines.join('\n');
}

export async function startBackup() {
  if (isRunning) return;
  isRunning = true;

  try {
    const works = await fetchWorks();
    let totalDownloaded = 0;

    // Save categories index
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    fs.writeFileSync(path.join(BACKUPS_DIR, '_categories.md'), buildCategoriesIndex(works));

    for (const work of works) {
      const slug = work.URL_slug || String(work.id);
      const images = work.gallery_images || [];

      const galleryDir = path.join(BACKUPS_DIR, slug);
      fs.mkdirSync(galleryDir, { recursive: true });

      // Save index.md for this gallery
      fs.writeFileSync(path.join(galleryDir, 'index.md'), buildMarkdown(work));

      if (images.length === 0) {
        broadcast({ type: 'done', gallery: slug });
        continue;
      }

      broadcast({ type: 'start', gallery: slug, total: images.length });

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageUrl = `${BASE_URL}${image.url}`;
        const filename = image.name || path.basename(image.url);
        const destPath = path.join(galleryDir, filename);

        try {
          const response = await axios.get(imageUrl, { responseType: 'stream' });
          await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(destPath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          totalDownloaded++;
          broadcast({
            type: 'progress',
            gallery: slug,
            file: filename,
            current: i + 1,
            total: images.length,
          });
        } catch (err) {
          broadcast({
            type: 'error',
            gallery: slug,
            file: filename,
            message: err.message,
          });
        }
      }

      broadcast({ type: 'done', gallery: slug });
    }

    broadcast({ type: 'complete', totalDownloaded });
  } finally {
    isRunning = false;
  }
}
