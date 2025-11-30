import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';

// Use memory storage on Vercel (read-only file system), disk storage otherwise
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

export const uploadOptions = {
  storage: isVercel
    ? memoryStorage()
    : diskStorage({
        destination: './uploads/media',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),

  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },

  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'video/mp4'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  },
};
