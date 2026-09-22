const request = require('supertest');
const app = require('../src/app');
describe('application', () => {
  test('serves health without database access', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      statusCode: 200,
      message: 'Service is healthy',
      data: { status: 'ok' }
    });
  });
  test('validates unknown paths', async () => {
    const response = await request(app).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.statusCode).toBe(404);
  });

  test('exposes process metrics without dependency access', async () => {
    const response = await request(app).get('/health/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: 'Process metrics retrieved successfully',
      data: {
        thresholdPercent: 70,
        checkIntervalMs: 5000,
        restartEnabled: false,
        memory: {
          rssBytes: expect.any(Number),
          heapUsedBytes: expect.any(Number),
          heapTotalBytes: expect.any(Number)
        }
      }
    });
  });

  test('reports each required dependency in the readiness response', async () => {
    const response = await request(app).get('/health/ready');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      statusCode: 503,
      message: 'Service dependencies are unavailable',
      errors: [
        { field: 'database', message: 'Dependency is disconnected' },
        { field: 'redis', message: 'Dependency is disconnected' }
      ]
    });
  });

  test('rejects invalid API input before it reaches the database', async () => {
    const [policyResponse, importResponse, messageResponse] = await Promise.all([
      request(app).get('/api/policies/search?username='),
      request(app).get('/api/imports/not-an-object-id'),
      request(app).post('/api/messages').send({ message: '', day: 'not-a-date', time: '9:00' })
    ]);

    expect(policyResponse.status).toBe(400);
    expect(importResponse.status).toBe(400);
    expect(messageResponse.status).toBe(400);
    [policyResponse, importResponse, messageResponse].forEach((response) => {
      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual(expect.any(Array));
    });
  });

  test('returns a clean error for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/messages')
      .set('Content-Type', 'application/json')
      .send('{invalid-json}');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: 'Invalid JSON request body'
    });
  });
});
