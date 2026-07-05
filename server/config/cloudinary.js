const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let productStorage;
let avatarStorage;
let returnEvidenceStorage;

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

if (isCloudinaryConfigured) {
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  productStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'aesthetic-tech-store/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
  });

  avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'aesthetic-tech-store/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    },
  });

  returnEvidenceStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'aesthetic-tech-store/returns',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });
} else {
  // Local storage fallback
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });

  productStorage = localStorage;
  avatarStorage = localStorage;
  returnEvidenceStorage = localStorage;
}

const uploadProductImages = multer({ storage: productStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadReturnEvidence = multer({ storage: returnEvidenceStorage });

module.exports = { cloudinary, uploadProductImages, uploadAvatar, uploadReturnEvidence };
