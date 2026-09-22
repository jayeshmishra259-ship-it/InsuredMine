const app = require('./app');
const { port } = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const logger = require('./config/logger');
const { startCpuMonitor } = require('./monitoring/cpu-monitor');

async function start() {
  await connectDatabase();
  await connectRedis();
  const server = app.listen(port, () => logger.info({ port }, 'Server listening'));
  const cpuTimer = startCpuMonitor();
  const shutdown = async () => {
    clearInterval(cpuTimer);
    server.close(async () => {
      await Promise.allSettled([disconnectRedis(), disconnectDatabase()]);
      logger.info('Server shut down cleanly');
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
start().catch((error) => {
  logger.fatal(
    { err: error, dependencies: ['MongoDB', 'Redis'] },
    'Unable to start server; HTTP server was not started'
  );
  process.exit(1);
});
