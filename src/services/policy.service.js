const { User, Policy } = require('../models');

async function searchPoliciesByUser({ firstName, email }, page = 1, limit = 20) {
  const filter = firstName
    ? { firstName: new RegExp(`^${escapeRegex(firstName)}`, 'i') }
    : { email: new RegExp(escapeRegex(email), 'i') };
  const users = await User.find(filter).select('_id firstName email').sort({ firstName: 1, email: 1 }).lean();
  if (!users.length) {
    return { policies: [], total: 0, page, limit, searchBy: firstName ? 'firstName' : 'email' };
  }

  const userIds = users.map((user) => user._id);
  const policyRows = await Policy.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $addFields: { userSearchOrder: { $indexOfArray: [userIds, '$userId'] } } },
    { $sort: { userSearchOrder: 1, policyStartDate: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $project: { userSearchOrder: 0 } }
  ]);
  const policies = await Policy.populate(policyRows, [
    { path: 'userId', select: 'firstName email phone' },
    { path: 'policyCategoryId', select: 'categoryName' },
    { path: 'carrierId', select: 'companyName' },
    { path: 'accountId', select: 'accountName' }
  ]);
  const total = await Policy.countDocuments({ userId: { $in: userIds } });
  return { policies, total, page, limit, searchBy: firstName ? 'firstName' : 'email' };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function aggregateByUser(page = 1, limit = 20) {
  const [result] = await Policy.aggregate([
    {
      $group: {
        _id: '$userId',
        policyCount: { $sum: 1 },
        totalPremium: { $sum: { $ifNull: ['$premiumAmount', 0] } }
      }
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        firstName: '$user.firstName',
        email: '$user.email',
        policyCount: 1,
        totalPremium: 1
      }
    },
    { $sort: { policyCount: -1, firstName: 1 } },
    {
      $facet: {
        users: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        metadata: [{ $count: 'total' }]
      }
    }
  ]);

  return {
    users: result?.users || [],
    total: result?.metadata[0]?.total || 0,
    page,
    limit
  };
}

module.exports = { searchPoliciesByUser, aggregateByUser };
