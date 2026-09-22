const { createMessageSchema } = require('../src/validations/message.validation');
const { resolveScheduledFor } = require('../src/utils/scheduled-time');

describe('scheduled-message validation', () => {
  test('accepts an ISO timestamp with timezone', () => {
    const input = createMessageSchema.parse({
      message: 'Renewal reminder',
      scheduledFor: '2026-10-01T09:30:00+05:30'
    });
    expect(resolveScheduledFor(input).toISOString()).toBe('2026-10-01T04:00:00.000Z');
  });

  test('keeps the legacy day and time input compatible', () => {
    expect(
      createMessageSchema.parse({ message: 'Reminder', day: '2026-10-01', time: '09:30' })
    ).toMatchObject({
      day: '2026-10-01',
      time: '09:30'
    });
  });

  test('requires a scheduling value', () => {
    expect(() => createMessageSchema.parse({ message: 'Reminder' })).toThrow();
  });
});
