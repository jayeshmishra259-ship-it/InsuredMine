const crypto = require('crypto');

function normalizedValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value).trim().toLowerCase();
}

function rowHash(row) {
  const normalized = Object.entries(row)
    .map(([name, value]) => [name.trim().toLowerCase(), normalizedValue(value)])
    .sort(([first], [second]) => first.localeCompare(second));
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function sourceFields(row) {
  return Object.entries(row).map(([name, value]) => ({ name, value: value ?? null }));
}

function getChanges(previousFields, row) {
  const previous = new Map((previousFields || []).map(({ name, value }) => [name, value]));
  const current = new Map(Object.entries(row));
  const fieldNames = new Set([...previous.keys(), ...current.keys()]);
  return [...fieldNames]
    .filter((field) => normalizedValue(previous.get(field)) !== normalizedValue(current.get(field)))
    .map((field) => ({ field, oldValue: previous.get(field) ?? null, newValue: current.get(field) ?? null }));
}

module.exports = { rowHash, sourceFields, getChanges };
