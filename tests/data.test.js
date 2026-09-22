const { text, number, date, identity } = require('../src/utils/data');
describe('data normalization', () => {
  test('normalizes primitive values and currency', () => {
    expect(text(' A ')).toBe('A');
    expect(number('$1,234.50')).toBe(1234.5);
    expect(number('bad')).toBeUndefined();
  });
  test('uses Applicant ID before composite user identity', () => {
    expect(identity({ 'Applicant ID': ' 42 ', email: 'a@b.com' })).toBe('42');
    expect(identity({ email: 'A@B.com', firstname: ' Jane ', phone: '(555) 1' })).toBe('a@b.com|jane|5551');
  });
  test('returns undefined for invalid dates', () => expect(date('invalid')).toBeUndefined());
  test('handles Excel serial dates', () => expect(date(45292).toISOString().slice(0, 10)).toBe('2024-01-01'));
});
