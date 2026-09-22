function text(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}
function number(value) {
  const result = Number(String(value ?? '').replace(/[$,]/g, ''));
  return Number.isFinite(result) ? result : undefined;
}
function date(value) {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === 'number' && value > 1000 && value < 100000) {
    return new Date(Date.UTC(1899, 11, 30 + value));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
function identity(row) {
  return (
    text(row['Applicant ID']) ||
    [
      text(row.email).toLowerCase(),
      text(row.firstname).toLowerCase(),
      text(row.phone).replace(/\D/g, '')
    ].join('|')
  );
}
module.exports = { text, number, date, identity };
