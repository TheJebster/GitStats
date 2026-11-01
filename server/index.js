import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import app from './app.js';
import { hasToken } from './github.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;

// Serve the built React app when it exists (npm run build && npm start).
const clientDist = path.resolve(__dirname, '../client/dist');

if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`GitStats API listening on http://localhost:${PORT}`);
  console.log(hasToken() ? 'GitHub token: configured' : 'GitHub token: not set (60 requests/hour)');
});
