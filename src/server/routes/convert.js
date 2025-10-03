import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { mkdir } from 'fs/promises';
import { convertHeicToJpg, safeUnlink } from '../services/converter.js';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
await mkdir(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const baseName = path.parse(file.originalname).name.replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${baseName}-${timestamp}.heic`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (/heic$/i.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only HEIC files are supported.'));
    }
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use the "file" field with a HEIC image.' });
  }

  const uploadedPath = req.file.path;

  try {
    const convertedDir = path.join(process.cwd(), 'converted');
    const { outputPath, command, tool } = await convertHeicToJpg({
      sourcePath: uploadedPath,
      outputDirectory: convertedDir
    });

    const downloadUrl = `/converted/${path.basename(outputPath)}`;

    return res.json({
      message: 'Conversion successful',
      downloadUrl,
      command,
      tool
    });
  } catch (error) {
    console.error('Conversion failed:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await safeUnlink(uploadedPath);
  }
});

router.use((error, _req, res, _next) => {
  console.error('Upload error:', error);
  res.status(400).json({ error: error.message });
});

export default router;
