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
  const worker = new Worker(path.resolve(__dirname, '../workers/policy-import.worker.js'), {
    workerData: { jobId: String(job._id), filePath: file.path, mongoUri, sourceFileName: file.originalname }
  });

  worker.on('error', (error) => logger.error({ err: error, jobId: job.id }, 'Import worker error'));
  worker.on('exit', (code) => {
    if (code > 1) {
      logger.error({ code, jobId: job.id }, 'Import worker exited unexpectedly');
    }
  });

  return job;
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

module.exports = { createImport, hashFile };
