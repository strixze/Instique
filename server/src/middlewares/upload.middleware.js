import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer to store files in a secure, school‑scoped directory.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files are saved under storage/<schoolId>/<fieldname>
    const schoolId = req.schoolId ? req.schoolId.toString() : 'temp';
    const dest = path.join(__dirname, '../../storage', schoolId, file.fieldname);
    // Ensure the directory exists.
    require('fs').mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Use a UUID to avoid name collisions and prevent guessing.
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xlsx|xls|csv/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type .${ext} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

export default upload;
