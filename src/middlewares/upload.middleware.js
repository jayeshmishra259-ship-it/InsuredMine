const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');
const { uploadDir, maxFileSize } = require('../config/env');
const ApiError = require('../utils/api-error');

fs.mkdirSync(uploadDir, { recursive: true });

function buildStoredName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${timestamp}-${randomUUID()}${extension}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) => callback(null, buildStoredName(file.originalname))
  }),
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!['.csv', '.xlsx'].includes(extension)) {
      return callback(new ApiError(400, 'Only CSV and XLSX files are supported'));
    }

    return callback(null, true);
  }
});

module.exports = { policyFileUpload: upload.single('file'), buildStoredName };
