const logger = require('../config/logger');
const { cpuThreshold, cpuInterval, restartOnHighCpu } = require('../config/env');

let latestCpuPercent = null;
let lastSampledAt = null;

function calculateProcessCpuPercent(previousUsage, previousTime, currentUsage, currentTime) {
  const elapsedMicroseconds = Number(currentTime - previousTime) / 1_000;
  if (elapsedMicroseconds <= 0) {
    return 0;
  }

  const usedMicroseconds =
    currentUsage.user - previousUsage.user + (currentUsage.system - previousUsage.system);
  return (usedMicroseconds / elapsedMicroseconds) * 100;
}

function startCpuMonitor() {
  let previousUsage = process.cpuUsage();
  let previousTime = process.hrtime.bigint();

  return setInterval(() => {
    const currentUsage = process.cpuUsage();
    const currentTime = process.hrtime.bigint();
    const busy = calculateProcessCpuPercent(previousUsage, previousTime, currentUsage, currentTime);
    previousUsage = currentUsage;
    previousTime = currentTime;
    latestCpuPercent = Number(busy.toFixed(2));
    lastSampledAt = new Date().toISOString();

    if (busy >= cpuThreshold) {
      logger.warn({ cpuPercent: Number(busy.toFixed(2)), threshold: cpuThreshold }, 'CPU threshold reached');
      if (restartOnHighCpu) {
        process.exit(1);
      }
    }
  }, cpuInterval);
}

function getCpuMetrics() {
  const memory = process.memoryUsage();
  return {
    processCpuPercent: latestCpuPercent,
    sampledAt: lastSampledAt,
    thresholdPercent: cpuThreshold,
    checkIntervalMs: cpuInterval,
    restartEnabled: restartOnHighCpu,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal
    }
  };
}

module.exports = { calculateProcessCpuPercent, getCpuMetrics, startCpuMonitor };
