// src/services/localStorage.service.js
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Base directory for secure storage (outside public folder) */
const BASE_STORAGE_DIR = path.resolve(__dirname, '../../storage');

// Ensure the base storage directory exists
if (!fs.existsSync(BASE_STORAGE_DIR)) {
  fs.mkdirSync(BASE_STORAGE_DIR, { recursive: true });
}

/** Generate a safe filename preserving the original extension using UUID */
function generateSafeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  // Validate extension against mime-types; fallback to empty string if unknown
  const mimeType = mime.lookup(ext);
  const safeExt = mimeType ? ext : '';
  return `${uuidv4()}${safeExt}`;
}

/** Compute the absolute path for a given school and entity type */
function getEntityPath(schoolId, entity) {
  const entityPath = path.join(BASE_STORAGE_DIR, String(schoolId), entity);
  if (!fs.existsSync(entityPath)) {
    fs.mkdirSync(entityPath, { recursive: true });
  }
  return entityPath;
}

/** Store a file buffer securely and return stored filename */
export async function storeFile({ schoolId, entity, originalName, buffer }) {
  const safeName = generateSafeFilename(originalName);
  const destDir = getEntityPath(schoolId, entity);
  const destPath = path.join(destDir, safeName);
  await fs.promises.writeFile(destPath, buffer);
  return { filename: safeName, path: destPath };
}

/** Retrieve a stored file as a read stream; returns null if missing */
export function getFileReadStream({ schoolId, entity, filename }) {
  const filePath = path.join(getEntityPath(schoolId, entity), filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.createReadStream(filePath);
}

/** Delete a stored file */
export async function deleteFile({ schoolId, entity, filename }) {
  const filePath = path.join(getEntityPath(schoolId, entity), filename);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}

export default {
  storeFile,
  getFileReadStream,
  deleteFile,
};
