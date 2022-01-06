const express = require('express');

const adminController = require('../controllers/admin');
const upload = require('../util/multer');
const isAuth = require('../middlewares/is-auth');
const fetchUser = require('../middlewares/fetch-user');
const isAdmin = require('../middlewares/is-admin');

const router = express.Router();

router.use(isAuth, fetchUser, isAdmin);

router.post('/photo', upload.single('image'), adminController.postPhoto);

module.exports = router;
