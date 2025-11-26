import { diskStorage, memoryStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, resolve } from 'path';

const uploadDir = resolve('./uploads/media');
const isServerless = process.env.VERCEL === '1';

function ensureUploadDir() {
  if (isServerless) return;
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

const storage = isServerless
  ? memoryStorage()
  : diskStorage({
      destination: (req, file, cb) => {
        try {
          ensureUploadDir();
          cb(null, uploadDir);
        } catch (error) {
          cb(error as Error, uploadDir);
        }
      },
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    });

export const uploadOptions = {
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },

  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'video/mp4'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  },
};
