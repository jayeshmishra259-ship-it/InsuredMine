function sendSuccess(
  res,
  { statusCode = 200, message = 'Request completed successfully', data = null, meta } = {}
) {
  const body = {
    success: true,
    statusCode,
    message,
    data
  };

  if (meta !== undefined) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

function sendError(res, { statusCode = 500, message = 'Internal server error', errors } = {}) {
  const body = {
    success: false,
    statusCode,
    message
  };

  if (errors?.length) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
