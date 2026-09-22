function validate(schema, location) {
  return (req, res, next) => {
    const result = schema.safeParse(req[location]);
    if (!result.success) {
      return next(result.error);
    }

    req.validated = { ...req.validated, [location]: result.data };
    return next();
  };
}

module.exports = { validate };
