const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aesthetic-tech-store/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aesthetic-tech-store/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
  },
});

const returnEvidenceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aesthetic-tech-store/returns',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const uploadProductImages = multer({ storage: productStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadReturnEvidence = multer({ storage: returnEvidenceStorage });

module.exports = { cloudinary, uploadProductImages, uploadAvatar, uploadReturnEvidence };
