const Product = require('../models/product');

exports.getProducts = async (req, res, next) => {
  const products = await Product.findAll();

  res.json(products);
};

exports.getProduct = async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({ where: { id } });

  res.json(product);
};
