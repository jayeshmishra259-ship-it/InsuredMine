const { searchPoliciesByUser, aggregateByUser } = require('../services/policy.service');
const { sendSuccess } = require('../utils/api-response');

async function searchPolicies(req, res) {
  const { firstName, email, page, limit } = req.validated.query;
  const result = await searchPoliciesByUser({ firstName, email }, page, limit);
  return sendSuccess(res, {
    message: 'Policies retrieved successfully',
    data: result.policies,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      searchBy: result.searchBy
    }
  });
}

async function getPoliciesAggregatedByUser(req, res) {
  const { page, limit } = req.validated.query;
  const result = await aggregateByUser(page, limit);

  return sendSuccess(res, {
    message: 'Policies aggregated by user successfully',
    data: result.users,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit)
    }
  });
}

module.exports = { searchPolicies, getPoliciesAggregatedByUser };
