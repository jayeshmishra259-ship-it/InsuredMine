const { z } = require('zod');

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

const policySearchQuerySchema = paginationQuerySchema
  .extend({
    firstName: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional()
  })
  .superRefine((value, context) => {
    const hasFirstName = Boolean(value.firstName);
    const hasEmail = Boolean(value.email);

    if (hasFirstName === hasEmail) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one search parameter: firstName or email'
      });
    }
  });

module.exports = { policySearchQuerySchema, paginationQuerySchema };
