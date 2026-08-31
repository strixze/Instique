import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../public/uploads/events");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/**
 * Upload a local file to Cloudinary (with automatic local fallback if credentials are unset)
 * @param {String} localFilePath
 * @param {Object} options - { folder, resource_type, eventId, etc. }
 * @returns {Promise<Object>}
 */
const uploadFileOnCloudinary = async function (localFilePath, options = {}) {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) return null;

    if (isCloudinaryConfigured) {
      const uploadOptions = {
        resource_type: options.resource_type || "auto",
        folder: options.folder || "instique",
        ...options,
      };

      const uploadInfo = await cloudinary.uploader.upload(localFilePath, uploadOptions);

      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return {
        ...uploadInfo,
        secure_url: uploadInfo.secure_url,
        public_id: uploadInfo.public_id,
        success: true,
      };
    }

    // Fallback: Local storage in public/uploads/events
    const eventFolder = options.eventId
      ? path.join(uploadsDir, String(options.eventId))
      : uploadsDir;

    if (!fs.existsSync(eventFolder)) {
      fs.mkdirSync(eventFolder, { recursive: true });
    }

    const fileName = path.basename(localFilePath);
    const destPath = path.join(eventFolder, fileName);

    fs.copyFileSync(localFilePath, destPath);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    const stats = fs.statSync(destPath);
    const relUrl = options.eventId
      ? `/uploads/events/${options.eventId}/${fileName}`
      : `/uploads/events/${fileName}`;

    return {
      secure_url: relUrl,
      public_id: `local_events_${options.eventId || 'root'}_${fileName}`,
      bytes: stats.size,
      format: path.extname(fileName).replace('.', ''),
      success: true,
    };
  } catch (error) {
    console.error("Cloudinary upload failed, attempting local fallback:", error);

    try {
      if (localFilePath && fs.existsSync(localFilePath)) {
        const fileName = path.basename(localFilePath);
        const destPath = path.join(uploadsDir, fileName);
        fs.copyFileSync(localFilePath, destPath);
        fs.unlinkSync(localFilePath);

        return {
          secure_url: `/uploads/events/${fileName}`,
          public_id: `local_events_${fileName}`,
          bytes: fs.statSync(destPath).size,
          format: path.extname(fileName).replace('.', ''),
          success: true,
        };
      }
    } catch (fallbackErr) {
      console.error("Local fallback also failed:", fallbackErr);
    }

    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkErr) {}
    }

    return {
      success: false,
      message: error.message || "Upload failed",
      error: error.message,
    };
  }
};

/**
 * Delete a single file from Cloudinary or local uploads
 * @param {String} publicId
 * @param {String} resourceType
 * @returns {Promise<Object>}
 */
const deleteFileFromCloudinary = async function (publicId, resourceType = "image") {
  try {
    if (!publicId) return { success: true };

    if (publicId.startsWith('local_events_')) {
      const parts = publicId.replace('local_events_', '').split('_');
      const fileName = parts[parts.length - 1];
      const eventId = parts.length > 1 ? parts[0] : null;

      const targetPath = eventId
        ? path.join(uploadsDir, eventId, fileName)
        : path.join(uploadsDir, fileName);

      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      return { success: true };
    }

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return {
        success: result.result === "ok" || result.result === "not found",
        result,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Cloudinary single deletion error:", error);
    return {
      success: false,
      message: error.message || "Deletion from cloudinary failed",
    };
  }
};

/**
 * Delete multiple files from Cloudinary or local storage
 * @param {Array<String>} publicIds
 * @param {String} resourceType
 * @returns {Promise<Object>}
 */
const deleteMultipleFilesFromCloudinary = async function (publicIds = [], resourceType = "image") {
  try {
    const validIds = publicIds.filter(Boolean);
    if (!validIds.length) return { success: true };

    const localIds = validIds.filter((id) => id.startsWith('local_events_'));
    const cloudIds = validIds.filter((id) => !id.startsWith('local_events_'));

    for (const localId of localIds) {
      await deleteFileFromCloudinary(localId);
    }

    if (cloudIds.length > 0 && isCloudinaryConfigured) {
      if (cloudinary.api && cloudinary.api.delete_resources) {
        await cloudinary.api.delete_resources(cloudIds, { resource_type: resourceType });
      } else {
        await Promise.allSettled(cloudIds.map((id) => cloudinary.uploader.destroy(id, { resource_type: resourceType })));
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Cloudinary batch deletion error:", error);
    return {
      success: false,
      message: error.message || "Batch deletion failed",
    };
  }
};

export {
  uploadFileOnCloudinary,
  deleteFileFromCloudinary,
  deleteMultipleFilesFromCloudinary,
  cloudinary,
};
