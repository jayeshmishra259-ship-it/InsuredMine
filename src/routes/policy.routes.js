const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { validate } = require('../middlewares/validate.middleware');
const { policySearchQuerySchema, paginationQuerySchema } = require('../validations/policy.validation');
const { searchPolicies, getPoliciesAggregatedByUser } = require('../controllers/policy.controller');

const router = express.Router();

router.get('/search', validate(policySearchQuerySchema, 'query'), asyncHandler(searchPolicies));
router.get(
  '/aggregated-by-user',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(getPoliciesAggregatedByUser)
);

module.exports = router;
