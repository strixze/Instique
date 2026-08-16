import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const tempDir = "./public/temp";
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

export const upload = multer({ storage: storage });