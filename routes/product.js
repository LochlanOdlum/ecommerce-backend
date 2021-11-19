const express = require('express');

const productController = require('../controllers/product');

const router = express.Router();

router.get('/', productController.getProducts);

router.get('/:id', productController.getProduct);

module.exports = router;
