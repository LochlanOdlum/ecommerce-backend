const express = require('express');

const authController = require('../controllers/auth');
const validationRules = require('../middlewares/validators/rules');
const validators = require('../middlewares/validators/validators');
const fetchUser = require('../middlewares/fetch-user');
const isAuth = require('../middlewares/is-auth');

const router = express.Router();

router.post('/signup', validationRules.postSignup(), validators.validate, authController.signup);

router.post('/login', validationRules.login(), validators.validate, authController.login);

router.get('/myDetails', isAuth, fetchUser, authController.getMyDetails);

router.patch(
  '/myDetails',
  isAuth,
  validationRules.updateMyDetails(),
  validators.validate,
  authController.updateMyDetails
);

router.patch(
  '/changeMyPassword',
  isAuth,
  fetchUser,
  validationRules.changeMyPassword(),
  validators.validate,
  authController.changeMyPassword
);

router.post('/sendResetPasswordLink', authController.sendResetPasswordLink);

router.patch('/resetPassword', authController.resetPassword);

module.exports = router;
