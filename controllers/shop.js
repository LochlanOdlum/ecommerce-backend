const { Op } = require('sequelize');
const stripe = require('../util/stripe');

const Product = require('../models/product');
const User = require('../models/user');

//Need to limit products to not return any with isReserved: true
exports.getProducts = async (req, res, next) => {
  const products = await Product.findAll({ where: { isReserved: false } });

  res.json(products);
};

//Need to limit products to not return any with isReserved: true
exports.getProduct = async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({ where: { id, isReserved: false } });

  res.json(product);
};

//Recieve order = {itemIds: [id1, id2, ...], stripeReceiptEmail?}
//Starts an order, creates paymentIntent but still needs to be paid.
exports.startOrder = async (req, res, next) => {
  const { stripeReceiptEmail, itemIds } = req.body;

  const products = await Product.findAll({ where: { id: { [Op.or]: itemIds }, isReserved: false } });

  if (products.length !== itemIds.length) {
    console.log(products);
    const error = new Error('Could not match each item Id to an existing unique product.');
    error.statusCode = 400;
    return next(error);
  }

  //Get total cost of order from products using order items.

  const totalCostInPence = 100 * products.reduce((accumulator, current) => accumulator + +current.price, 0);

  //Create payment Intent

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCostInPence,
    receipt_email: stripeReceiptEmail,
    currency: 'gbp',
  });

  //Create order with payment intent id, isPaymentCompleted: false...

  const user = await User.findOne({ where: { id: req.userId } });

  const order = await user.createOrder({ paymentIntentId: paymentIntent.id, isPaymentCompleted: false });

  const promises = [];

  products.forEach((product) => {
    product.isReserved = true;
    promises.push(product.save());
    promises.push(
      order.createOrderItem({
        title: product.title,
        description: product.description,
        price: product.price,
        imageKey: product.imageKey,
      })
    );
  });

  await Promise.all(promises);

  //This will unreserve products if order hasn't been paid in 30 mins and also cancels order.

  setTimeout(async () => {
    try {
      const upToDatePaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);

      if (upToDatePaymentIntent.status === 'succeeded' || upToDatePaymentIntent.status === 'canceled') {
        return;
      }

      stripe.paymentIntents.cancel(paymentIntent.id);

      order.destroy();

      products.forEach((product) => {
        if (!product.isPurchased) {
          product.isReserved = false;
          product.save();
        }
      });
    } catch (error) {
      console.error(error);
    }
  }, 1000 * 60 * 30);

  res.status(200).json({ clientSecret: paymentIntent.client_secret });
};
