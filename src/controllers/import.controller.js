const { ImportJob } = require('../models');
const ApiError = require('../utils/api-error');
const { createImport } = require('../services/import.service');
const { sendSuccess } = require('../utils/api-response');

async function uploadImport(req, res) {
  if (!req.file) {
    throw new ApiError(400, 'A file field is required');
  }

  const job = await createImport(req.file);
  return sendSuccess(res, {
    statusCode: 202,
    message:
      job.status === 'duplicate'
        ? 'Identical import file was flagged as a duplicate'
        : 'Import accepted for processing',
    data: { jobId: job.id, status: job.status, duplicateOf: job.duplicateOf || null }
  });
}

async function getImportStatus(req, res) {
  const job = await ImportJob.findById(req.params.id).lean();
  if (!job) {
    throw new ApiError(404, 'Import job not found');
  }

  return sendSuccess(res, {
    message: 'Import job retrieved successfully',
    data: job
  });
}

module.exports = { uploadImport, getImportStatus };
