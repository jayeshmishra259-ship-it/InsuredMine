const multer = require('multer');
const { sendError } = require('../utils/api-response');

function notFound(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} was not found`
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const isValidationError = error.name === 'ZodError';
  const isMalformedJson = error instanceof SyntaxError && Object.hasOwn(error, 'body');
  const status =
    error.status || (error instanceof multer.MulterError || isValidationError || isMalformedJson ? 400 : 500);
  req.log?.error({ err: error, status }, 'Request failed');
  const errors = isValidationError ? formatValidationErrors(error.issues) : error.errors;
  const message =
    status === 500
      ? 'Internal server error'
      : isValidationError
        ? 'Validation failed'
        : isMalformedJson
          ? 'Invalid JSON request body'
          : error.message;

  return sendError(res, {
    statusCode: status,
    message,
    errors
  });
}

function formatValidationErrors(issues) {
  return issues.map((issue) => ({
    field: issue.path.join('.') || 'request',
    message: issue.message,
    code: issue.code
  }));
}

module.exports = { notFound, errorHandler, formatValidationErrors };
