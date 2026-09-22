const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { validate } = require('../middlewares/validate.middleware');
const { createMessageSchema } = require('../validations/message.validation');
const { createScheduledMessage } = require('../controllers/message.controller');

const router = express.Router();

router.post('/', validate(createMessageSchema, 'body'), asyncHandler(createScheduledMessage));

module.exports = router;
