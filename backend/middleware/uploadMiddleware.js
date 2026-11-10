const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `img-${uniqueSuffix}${ext}`);
    }
});

// Require both a permitted extension and a matching image MIME type.
// This is an initial validation layer; production deployments should also inspect file signatures.
const MIME_BY_EXTENSION = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
};

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const expectedMime = MIME_BY_EXTENSION[extension];
    if (expectedMime && file.mimetype === expectedMime) return cb(null, true);
    return cb(new Error("Upload a valid JPEG, PNG, WEBP, or GIF image."));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

module.exports = upload;
