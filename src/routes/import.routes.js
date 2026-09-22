const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { policyFileUpload } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { importJobParamsSchema } = require('../validations/import.validation');
const { uploadImport, getImportStatus } = require('../controllers/import.controller');

const router = express.Router();

router.post('/', policyFileUpload, asyncHandler(uploadImport));
router.get('/:id', validate(importJobParamsSchema, 'params'), asyncHandler(getImportStatus));

module.exports = router;
