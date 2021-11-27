const express = require('express');

const webhooksController = require('../controllers/webhooks');

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), webhooksController.stripewhook);

module.exports = router;
