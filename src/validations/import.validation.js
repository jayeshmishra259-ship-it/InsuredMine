const { z } = require('zod');

const importJobParamsSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid import job ID') });

module.exports = { importJobParamsSchema };
