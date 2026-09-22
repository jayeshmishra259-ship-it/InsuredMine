jest.mock('../src/models', () => ({
  ImportJob: {
    findByIdAndUpdate: jest.fn()
  }
}));

const { ImportJob } = require('../src/models');
const { markImportFailed } = require('../src/services/import.service');

describe('import service failure handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('marks an import job as failed when an unexpected worker error occurs', async () => {
    ImportJob.findByIdAndUpdate.mockResolvedValue(undefined);

    await markImportFailed('job-id', new Error('Worker crashed'));

    expect(ImportJob.findByIdAndUpdate).toHaveBeenCalledWith('job-id', {
      status: 'failed',
      error: 'Worker crashed'
    });
  });
});
