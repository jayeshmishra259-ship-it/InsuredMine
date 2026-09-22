const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { connectDatabase } = require('../config/database');
const {
  Agent,
  User,
  Account,
  PolicyCategory,
  PolicyCarrier,
  Policy,
  ImportJob,
  ChangeAudit
} = require('../models');
const { text, number, date, identity } = require('../utils/data');
const { rowHash, sourceFields, getChanges } = require('../utils/import-deduplication');
const { readXlsxRows } = require('../utils/spreadsheet-reader');

const BATCH_SIZE = 500;
async function importCsv(filePath, stats) {
  let batch = [];
  let offset = 0;
  for await (const row of fs.createReadStream(filePath).pipe(csv())) {
    stats.totalRows++;
    batch.push(row);
    if (batch.length === BATCH_SIZE) {
      await processBatch(batch, offset, stats);
      offset += batch.length;
      batch = [];
      await ImportJob.findByIdAndUpdate(workerData.jobId, { stats });
    }
  }
  if (batch.length) {
    await processBatch(batch, offset, stats);
    await ImportJob.findByIdAndUpdate(workerData.jobId, { stats });
  }
}
async function upsertNamed(Model, field, values) {
  const clean = [...new Set(values.map(text).filter(Boolean))];
  if (!clean.length) {
    return new Map();
  }
  await Model.bulkWrite(
    clean.map((value) => ({
      updateOne: { filter: { [field]: value }, update: { $setOnInsert: { [field]: value } }, upsert: true }
    }))
  );
  const docs = await Model.find({ [field]: { $in: clean } }).lean();
  return new Map(docs.map((doc) => [doc[field], doc._id]));
}
async function updateReferenceMetadata(Model, lookupField, metadataField, values) {
  const operations = values
    .map(({ lookup, metadata }) => ({ lookup: text(lookup), metadata: text(metadata) }))
    .filter(({ lookup, metadata }) => lookup && metadata)
    .map(({ lookup, metadata }) => ({
      updateOne: { filter: { [lookupField]: lookup }, update: { $set: { [metadataField]: metadata } } }
    }));

  if (operations.length) {
    await Model.bulkWrite(operations);
  }
}
async function processBatch(rows, offset, stats) {
  const sourceHeaders = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  await ImportJob.findByIdAndUpdate(workerData.jobId, {
    $addToSet: { sourceHeaders: { $each: sourceHeaders } }
  });

  const valid = [];
  rows.forEach((row, index) => {
    const policyNumber = text(row.policy_number);
    const key = identity(row);
    if (!policyNumber || !key || key === '||') {
      stats.failedRows++;
      if (stats.errors.length < 100) {
        stats.errors.push({
          row: offset + index + 2,
          reason: 'policy_number and a user identity are required'
        });
      }
      return;
    }
    valid.push({ row, policyNumber, key, sourceRow: offset + index + 2, rowHash: rowHash(row) });
  });
  if (!valid.length) {
    return;
  }
  const existingPolicies = await Policy.find({
    policyNumber: { $in: valid.map(({ policyNumber }) => policyNumber) }
  })
    .select('_id policyNumber rowHash sourceFields')
    .lean();
  const existingByPolicyNumber = new Map(existingPolicies.map((policy) => [policy.policyNumber, policy]));
  const exactDuplicates = valid.filter(
    ({ policyNumber, rowHash: value }) => existingByPolicyNumber.get(policyNumber)?.rowHash === value
  );
  const toPersist = valid.filter(
    ({ policyNumber, rowHash: value }) => existingByPolicyNumber.get(policyNumber)?.rowHash !== value
  );
  if (exactDuplicates.length) {
    await Policy.bulkWrite(
      exactDuplicates.map(({ policyNumber, sourceRow }) => ({
        updateOne: {
          filter: { policyNumber },
          update: {
            $push: {
              importHistory: {
                importJobId: workerData.jobId,
                sourceRow,
                action: 'skipped_duplicate',
                importedAt: new Date()
              }
            }
          }
        }
      }))
    );
    stats.duplicateRows += exactDuplicates.length;
    stats.skippedRows += exactDuplicates.length;
  }
  if (!toPersist.length) {
    return;
  }
  const [agents, accounts, categories, carriers] = await Promise.all([
    upsertNamed(
      Agent,
      'name',
      toPersist.map(({ row }) => row.agent)
    ),
    upsertNamed(
      Account,
      'accountName',
      toPersist.map(({ row }) => row.account_name)
    ),
    upsertNamed(
      PolicyCategory,
      'categoryName',
      toPersist.map(({ row }) => row.category_name)
    ),
    upsertNamed(
      PolicyCarrier,
      'companyName',
      toPersist.map(({ row }) => row.company_name)
    )
  ]);
  await Promise.all([
    updateReferenceMetadata(
      Agent,
      'name',
      'agencyId',
      toPersist.map(({ row }) => ({ lookup: row.agent, metadata: row.agency_id }))
    ),
    updateReferenceMetadata(
      Account,
      'accountName',
      'accountType',
      toPersist.map(({ row }) => ({ lookup: row.account_name, metadata: row.account_type }))
    )
  ]);
  await User.bulkWrite(
    toPersist.map(({ row, key }) => ({
      updateOne: {
        filter: { identityKey: key },
        update: {
          $set: {
            firstName: text(row.firstname) || undefined,
            dob: date(row.dob),
            address: text(row.address) || undefined,
            phone: text(row.phone) || undefined,
            state: text(row.state) || undefined,
            zip: text(row.zip) || undefined,
            email: text(row.email).toLowerCase() || undefined,
            gender: text(row.gender) || undefined,
            userType: text(row.userType) || undefined,
            city: text(row.city) || undefined,
            applicantId: text(row['Applicant ID']) || undefined,
            agentId: agents.get(text(row.agent))
          },
          $setOnInsert: { identityKey: key }
        },
        upsert: true
      }
    }))
  );
  const users = await User.find({ identityKey: { $in: toPersist.map(({ key }) => key) } }).lean();
  const userIds = new Map(users.map((user) => [user.identityKey, user._id]));
  const operations = toPersist.map(({ row, key, policyNumber, sourceRow, rowHash: value }) => ({
    updateOne: {
      filter: { policyNumber },
      update: {
        $set: {
          policyStartDate: date(row.policy_start_date),
          policyEndDate: date(row.policy_end_date),
          policyCategoryId: categories.get(text(row.category_name)),
          carrierId: carriers.get(text(row.company_name)),
          userId: userIds.get(key),
          accountId: accounts.get(text(row.account_name)),
          premiumAmount: number(row.premium_amount) ?? number(row.premium_amount_written),
          premiumAmountWritten: number(row.premium_amount_written),
          policyType: text(row.policy_type) || undefined,
          mode: text(row.policy_mode) || undefined,
          producer: text(row.producer) || undefined,
          csr: text(row.csr) || undefined,
          primary: text(row.primary) || undefined,
          hasActiveClientPolicy: text(row['hasActive ClientPolicy']) || undefined,
          sourceImportId: workerData.jobId,
          sourceRow,
          rowHash: value,
          sourceFields: sourceFields(row)
        },
        $setOnInsert: { policyNumber },
        $push: {
          importHistory: {
            importJobId: workerData.jobId,
            sourceRow,
            action: existingByPolicyNumber.has(policyNumber) ? 'updated' : 'created',
            importedAt: new Date()
          }
        }
      },
      upsert: true
    }
  }));
  await Policy.bulkWrite(operations);
  const auditRecords = toPersist
    .filter(({ policyNumber }) => existingByPolicyNumber.has(policyNumber))
    .map(({ row, policyNumber, sourceRow }) => {
      const existing = existingByPolicyNumber.get(policyNumber);
      return {
        entityType: 'Policy',
        entityId: existing._id,
        policyNumber,
        importJobId: workerData.jobId,
        sourceFileName: workerData.sourceFileName,
        sourceRow,
        changes: getChanges(existing.sourceFields, row)
      };
    })
    .filter(({ changes }) => changes.length);
  if (auditRecords.length) {
    await ChangeAudit.insertMany(auditRecords);
  }
  stats.successfulRows += toPersist.length;
}
async function run() {
  const stats = {
    totalRows: 0,
    successfulRows: 0,
    failedRows: 0,
    skippedRows: 0,
    duplicateRows: 0,
    errors: []
  };
  try {
    await connectDatabase(workerData.mongoUri);
    await ImportJob.findByIdAndUpdate(workerData.jobId, { status: 'processing' });
    if (path.extname(workerData.filePath).toLowerCase() === '.csv') {
      await importCsv(workerData.filePath, stats);
    } else {
      const rows = await readXlsxRows(workerData.filePath);
      stats.totalRows = rows.length;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await processBatch(rows.slice(i, i + BATCH_SIZE), i, stats);
        await ImportJob.findByIdAndUpdate(workerData.jobId, { stats });
      }
    }
    await ImportJob.findByIdAndUpdate(workerData.jobId, { status: 'completed', stats });
    parentPort.postMessage({ ok: true, stats });
  } catch (error) {
    await ImportJob.findByIdAndUpdate(workerData.jobId, {
      status: 'failed',
      stats,
      error: error.message
    }).catch(() => {});
    parentPort.postMessage({ ok: false, error: error.message });
  } finally {
    process.exit();
  }
}
run();
