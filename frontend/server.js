import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = join(__dirname, 'dist');

// Serve static assets (JS, CSS, images) directly from dist
app.use(express.static(DIST_DIR, { index: false }));

// For every route, serve index.html with Backend_URL injected at runtime
app.get('*', (_req, res) => {
  const backendUrl = process.env.Backend_URL || '';
  let html = readFileSync(join(DIST_DIR, 'index.html'), 'utf-8');
  html = html.replace('%%Backend_URL%%', backendUrl);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Backend URL: ${process.env.Backend_URL || '(not set)'}`);
});
