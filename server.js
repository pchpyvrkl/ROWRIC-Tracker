// Minimal zero-dependency static file server for local development.
// Usage: node server.js  (or: npm run dev)
// Port:  set via PORT env var or first CLI arg (default: 3000)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json'
};

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        let pathname = decodeURIComponent(url.pathname);

        if (pathname === '/') pathname = '/index.html';

        // Prevent path traversal
        const filePath = normalize(join(ROOT, pathname));
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        const data = await readFile(filePath);
        const type = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': type,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    } catch (err) {
        if (err && err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('Not found');
        } else {
            res.writeHead(500);
            res.end('Internal server error');
        }
    }
});

server.listen(PORT, () => {
    console.log(`ROWRIC Tracker dev server running at http://localhost:${PORT}`);
});
