const { z } = require('zod');

const createMessageSchema = z
  .object({
    message: z.string().trim().min(1).max(4000),
    scheduledFor: z.string().datetime({ offset: true }).optional(),
    day: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Use HH:mm')
      .optional()
  })
  .superRefine((value, context) => {
    const hasIsoTimestamp = Boolean(value.scheduledFor);
    const hasLegacyDateTime = Boolean(value.day && value.time);

    if (hasIsoTimestamp && (value.day || value.time)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either scheduledFor or day and time, not both'
      });
    } else if (!hasIsoTimestamp && !hasLegacyDateTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scheduledFor or both day and time are required'
      });
    }
  });

module.exports = { createMessageSchema };
