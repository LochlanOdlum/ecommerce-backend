const express = require('express');

const productController = require('../controllers/shop');
const isAuth = require('../middlewares/is-auth');

const router = express.Router();

router.get('/products', productController.getProducts);

router.get('/products/:id', productController.getProduct);

router.post('/startOrder', isAuth, productController.startOrder);

module.exports = router;
