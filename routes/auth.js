const express = require('express');

const authController = require('../controllers/auth');
const validationRules = require('../middlewares/validators/rules');
const validators = require('../middlewares/validators/validators');

const router = express.Router();

router.post('/signup', validationRules.postSignup(), validators.validate, authController.signup);

module.exports = router;
