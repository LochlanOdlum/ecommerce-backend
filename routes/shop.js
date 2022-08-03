const express = require('express');

const validationRules = require('../middlewares/validators/rules');
const validators = require('../middlewares/validators/validators');
const shopController = require('../controllers/shop');
const isAuth = require('../middlewares/is-auth');
const fetchUser = require('../middlewares/fetch-user');

const router = express.Router();

router.get('/products', shopController.getProducts);

router.get('/products/:id', shopController.getProduct);

router.get('/collections', shopController.getCollections);

router.post('/startOrder', isAuth, fetchUser, shopController.startOrder);

router.get('/myOrder/:id', isAuth, validationRules.getMyOrder(), validators.validate, shopController.getMyOrder);

router.get('/myOrders', isAuth, fetchUser, shopController.getMyOrders);

router.get('/order/success/:paymentIntentId', isAuth, shopController.orderSuccess);

router.get('/photoMedCropped2to1/:key', isAuth, fetchUser, shopController.getImageMedCropped2to1);

router.get('/photoTempURL/:key', isAuth, fetchUser, shopController.getImageTempURL);

module.exports = router;
