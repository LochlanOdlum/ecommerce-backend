const express = require('express');

const adminController = require('../controllers/admin');
const upload = require('../util/multer');
const isAuth = require('../middlewares/is-auth');
const fetchUser = require('../middlewares/fetch-user');
const isAdmin = require('../middlewares/is-admin');
const validationRules = require('../middlewares/validators/rules');
const validators = require('../middlewares/validators/validators');

const router = express.Router();

//Ensures user is an admin before allowing access to admin endpoints
router.use(isAuth, fetchUser, isAdmin);

router.post('/photo', upload.single('image'), adminController.postPhoto);

router.post('/collection', validationRules.postCollection(), validators.validate, adminController.postCollection);

module.exports = router;
