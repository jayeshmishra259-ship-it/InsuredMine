const { Worker } = require('worker_threads');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ImportJob } = require('../models');
const { mongoUri } = require('../config/env');
const logger = require('../config/logger');

async function createImport(file) {
  const fileHash = await hashFile(file.path);
  const originalJob = await ImportJob.findOne({ fileHash, status: { $ne: 'failed' } }).sort({ createdAt: 1 });
  const job = await ImportJob.create({
    originalName: file.originalname,
    storedName: file.filename,
    storagePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileHash,
    ...(originalJob ? { status: 'duplicate', duplicateOf: originalJob._id } : {})
  });
  if (originalJob) {
    logger.info({ jobId: job.id, duplicateOf: originalJob.id }, 'Identical import file flagged as duplicate');
    return job;
  }
  startImportWorker(job, file);

  return job;
}

function startImportWorker(job, file) {
  let worker;
  try {
    worker = new Worker(path.resolve(__dirname, '../workers/policy-import.worker.js'), {
      workerData: { jobId: String(job._id), filePath: file.path, mongoUri, sourceFileName: file.originalname }
    });
  } catch (error) {
    void markImportFailed(job.id, error);
    logger.error({ err: error, jobId: job.id }, 'Unable to start import worker');
    return;
  }

  worker.on('error', (error) => {
    void markImportFailed(job.id, error);
    logger.error({ err: error, jobId: job.id }, 'Import worker error');
  });
  worker.on('exit', (code) => {
    if (code !== 0) {
      void markImportFailed(job.id, new Error(`Import worker exited with code ${code}`));
      logger.error({ code, jobId: job.id }, 'Import worker exited unexpectedly');
    }
  });
}

async function markImportFailed(jobId, error) {
  await ImportJob.findByIdAndUpdate(jobId, {
    status: 'failed',
    error: error.message
  }).catch((updateError) => logger.error({ err: updateError, jobId }, 'Unable to mark import as failed'));
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

module.exports = { createImport, hashFile, markImportFailed };
