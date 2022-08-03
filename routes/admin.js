const express = require('express');

const adminController = require('../controllers/admin');
const upload = require('../util/multer');
const isAuth = require('../middlewares/is-auth');
const fetchUser = require('../middlewares/fetch-user');
const isAdmin = require('../middlewares/is-admin');
const validationRules = require('../middlewares/validators/rules');
const validators = require('../middlewares/validators/validators');
const cache = require('../middlewares/cache');

const router = express.Router();

//Ensures user is an admin before allowing access to admin endpoints
router.use(isAuth, fetchUser, isAdmin);

router.get('/photos', adminController.getPhotos);

router.post('/photo', upload.single('image'), adminController.postPhoto);

router.patch('/photo/:id', upload.single('image'), adminController.editPhoto);

router.delete('/photo/:id', adminController.deletePhoto);

router.post('/collection', validationRules.postCollection(), validators.validate, adminController.postCollection);

router.patch('/collection/:id', adminController.editCollection);

router.get('/orders', adminController.getOrders);

router.get('/orderDetails/:id', adminController.getOrderDetails);

router.get('/recentOrders', adminController.getRecentOrders);

router.get('/users', adminController.getUsers);

router.get('/userDetails/:id', adminController.getUserDetails);

router.delete('/user/:id', adminController.deleteUser);

router.get('/summaryDetails', cache(30), adminController.summaryDetails);

module.exports = router;
