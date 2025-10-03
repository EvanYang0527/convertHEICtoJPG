import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import convertRouter from './routes/convert.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use('/api/convert', convertRouter);

const publicDir = path.join(__dirname, '../../public');
const convertedDir = path.join(__dirname, '../../converted');
app.use('/converted', express.static(convertedDir));
app.use(express.static(publicDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HEIC to JPG converter listening on http://localhost:${PORT}`);
});
