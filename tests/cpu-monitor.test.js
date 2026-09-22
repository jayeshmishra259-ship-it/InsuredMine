const { calculateProcessCpuPercent } = require('../src/monitoring/cpu-monitor');

describe('process CPU monitoring', () => {
  test('calculates CPU as a percentage of one logical CPU core', () => {
    const percent = calculateProcessCpuPercent(
      { user: 100_000, system: 50_000 },
      1_000_000_000n,
      { user: 300_000, system: 150_000 },
      2_000_000_000n
    );

    expect(percent).toBe(30);
  });

  test('returns zero when elapsed time is not positive', () => {
    expect(
      calculateProcessCpuPercent(
        { user: 0, system: 0 },
        1_000_000_000n,
        { user: 10, system: 10 },
        1_000_000_000n
      )
    ).toBe(0);
  });
});
