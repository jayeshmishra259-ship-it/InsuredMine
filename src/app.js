const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const { corsOrigins } = require('./config/env');
const { isDatabaseConnected } = require('./config/database');
const { isRedisConnected } = require('./config/redis');
const importRoutes = require('./routes/import.routes');
const policyRoutes = require('./routes/policy.routes');
const messageRoutes = require('./routes/message.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { sendSuccess, sendError } = require('./utils/api-response');
const { getCpuMetrics } = require('./monitoring/cpu-monitor');

const app = express();
const corsOptions = corsOrigins.length
  ? { origin: corsOrigins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }
  : { origin: true };

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors(corsOptions));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) =>
      sendError(res, {
        statusCode: 429,
        message: 'Too many requests. Please try again later.'
      })
  })
);
app.use(express.json({ limit: '100kb' }));
app.get('/health', (req, res) => sendSuccess(res, { message: 'Service is healthy', data: { status: 'ok' } }));
app.get('/health/metrics', (req, res) =>
  sendSuccess(res, { message: 'Process metrics retrieved successfully', data: getCpuMetrics() })
);
app.get('/health/ready', (req, res) => {
  const dependencies = {
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    redis: isRedisConnected() ? 'connected' : 'disconnected'
  };
  if (dependencies.database !== 'connected' || dependencies.redis !== 'connected') {
    return sendError(res, {
      statusCode: 503,
      message: 'Service dependencies are unavailable',
      errors: Object.entries(dependencies)
        .filter(([, status]) => status !== 'connected')
        .map(([dependency, status]) => ({ field: dependency, message: `Dependency is ${status}` }))
    });
  }

  return sendSuccess(res, {
    message: 'Service dependencies are ready',
    data: { status: 'ready', dependencies }
  });
});
app.use('/api/imports', importRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/messages', messageRoutes);
app.use(notFound);
app.use(errorHandler);
module.exports = app;
