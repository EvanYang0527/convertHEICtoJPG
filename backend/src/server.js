const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file) {
      cb(new Error('No file provided.'));
      return;
    }

    const isHeic = /\.(heic|heif)$/i.test(file.originalname) ||
      ['image/heic', 'image/heif', 'application/octet-stream'].includes(file.mimetype);

    if (!isHeic) {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
      return;
    }

    cb(null, true);
  },
});

const STATIC_ROOT = path.join(__dirname, '..', 'static');
app.use(express.static(STATIC_ROOT));
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_ROOT, 'index.html'));
});

app.post('/api/convert', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ detail: 'No file uploaded.' });
      return;
    }

    let jpegBuffer;
    try {
      jpegBuffer = await sharp(req.file.buffer, {
        failOnError: false,
        limitInputPixels: false,
      })
        .rotate()
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (error) {
      if (error?.message?.includes('unsupported image format')) {
        const message = [
          'The server is missing HEIC support.',
          'Ensure libvips is built with libheif when deploying.',
        ].join(' ');
        res.status(500).json({ detail: message });
        return;
      }
      throw error;
    }

    const originalName = path.parse(req.file.originalname || 'converted').name || 'converted';
    const outputName = `${originalName}.jpg`;

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
    res.send(jpegBuffer);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ detail: 'File is too large. Maximum size is 25 MB.' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ detail: 'Only HEIC/HEIF files are accepted.' });
      return;
    }
  }

  const status = err.status || 500;
  const message = err.message || 'Unexpected server error.';
  res.status(status).json({ detail: message });
});

const port = Number(process.env.PORT) || 8000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`HEIC converter listening on http://localhost:${port}`);
});
