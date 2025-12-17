const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiResponse = require('../utils/apiResponse');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Створюємо папки якщо не існують
const dirs = [uploadDir, `${uploadDir}/avatars`, `${uploadDir}/products`];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = uploadDir;
    if (file.fieldname === 'avatar') {
      folder = `${uploadDir}/avatars`;
    } else if (file.fieldname === 'productImage') {
      folder = `${uploadDir}/products`;
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Непідтримуваний тип файлу. Дозволені: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.badRequest(res, 'Файл занадто великий. Максимум 5MB');
    }
    return ApiResponse.badRequest(res, `Помилка завантаження: ${err.message}`);
  } else if (err) {
    return ApiResponse.badRequest(res, err.message);
  }
  next();
};

module.exports = { upload, handleMulterError };