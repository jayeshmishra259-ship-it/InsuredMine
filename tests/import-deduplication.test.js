const { rowHash, sourceFields, getChanges } = require('../src/utils/import-deduplication');

describe('import duplicate handling', () => {
  test('produces the same hash despite column order, whitespace, and letter case', () => {
    expect(rowHash({ policy_number: ' P-1 ', address: 'Main Street' })).toBe(
      rowHash({ address: 'main street', policy_number: 'p-1' })
    );
  });

  test('captures only changed source fields for an update audit', () => {
    const changes = getChanges(sourceFields({ policy_number: 'P-1', address: 'Old Road', phone: '123' }), {
      policy_number: 'P-1',
      address: 'New Road',
      phone: '123'
    });
    expect(changes).toEqual([{ field: 'address', oldValue: 'Old Road', newValue: 'New Road' }]);
  });
});
