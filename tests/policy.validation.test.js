const { policySearchQuerySchema, paginationQuerySchema } = require('../src/validations/policy.validation');

describe('policy search validation', () => {
  test('accepts firstName prefix search', () => {
    expect(policySearchQuerySchema.parse({ firstName: 'jay' })).toMatchObject({
      firstName: 'jay',
      page: 1,
      limit: 20
    });
  });

  test('accepts partial email search', () => {
    expect(policySearchQuerySchema.parse({ email: '@gmail.com', page: '2' })).toMatchObject({
      email: '@gmail.com',
      page: 2,
      limit: 20
    });
  });

  test('rejects missing or conflicting search parameters', () => {
    expect(() => policySearchQuerySchema.parse({})).toThrow('Provide exactly one search parameter');
    expect(() => policySearchQuerySchema.parse({ firstName: 'jay', email: 'jay@example.com' })).toThrow(
      'Provide exactly one search parameter'
    );
  });
});

describe('pagination validation', () => {
  test('uses safe pagination defaults and coerces query strings', () => {
    expect(paginationQuerySchema.parse({ page: '2', limit: '50' })).toEqual({ page: 2, limit: 50 });
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  test('rejects invalid or excessive pagination values', () => {
    expect(() => paginationQuerySchema.parse({ page: '0' })).toThrow();
    expect(() => paginationQuerySchema.parse({ limit: '101' })).toThrow();
  });
});
