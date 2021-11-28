const { Op } = require('sequelize');
const stripe = require('../util/stripe');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');

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

  const user = req.user;

  const order = await user.createOrder({ paymentIntentId: paymentIntent.id, isPaymentCompleted: false });

  const promises = [];

  //Reserve products so other users cannot buy a product which someone else is buying
  products.forEach((product) => {
    product.isReserved = true;
    promises.push(product.save());
    promises.push(
      order.createOrderItem({
        title: product.title,
        description: product.description,
        price: product.price,
        imageKey: product.imageKey,
        productId: product.id,
      })
    );
  });

  await Promise.all(promises);

  //This will unreserve products if order hasn't been paid in 30 mins and also cancels order and payment Intent so they cannot be charged after.

  setTimeout(async () => {
    try {
      const upToDatePaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);

      //Alternatively could just call order.reload() to reload existing order model instance
      const upToDateOrder = await Order.findOne({ where: { id: order.id } });

      if (
        upToDatePaymentIntent.status === 'succeeded' ||
        upToDatePaymentIntent.status === 'canceled' ||
        upToDateOrder.isPaymentCompleted === true
      ) {
        return;
      }

      stripe.paymentIntents.cancel(upToDatePaymentIntent.id);

      upToDateOrder.destroy();

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

exports.getMyOrder = async (req, res, next) => {
  const { id: orderId } = req.params;
  const userId = req.userId;

  //Finding order directly rather than using user.getOrder(...), so custom error message for when order exists but not belonging to authenticated user.
  const order = await Order.findOne({ where: { id: orderId }, include: [User, OrderItem] });

  if (!order) {
    const error = new Error('Could not find an order with this id');
    error.statusCode = 404;
    return next(error);
  }

  if (order.userId !== userId) {
    const error = new Error(`Unauthorised. This order isn't yours.`);
    error.statusCode = 403;
    return next(error);
  }

  res.status(200).json({
    id: orderId,
    isPaymentCompleted: order.isPaymentCompleted,
    createdAt: order.createdAt,
    orderItems: order.orderItems,
  });
};

exports.getMyOrders = async (req, res, next) => {
  const { orderIds } = req.body;
  const userId = req.userId;

  const orders = await Order.findAll({
    where: {
      id: {
        [Op.or]: orderIds,
      },
    },
    include: OrderItem,
  });

  let isAllOrdersBelongToUser = true;

  orders.forEach((order) => {
    if (order.userId !== userId) {
      isAllOrdersBelongToUser = false;
    }
  });

  if (!isAllOrdersBelongToUser) {
    const error = new Error('Unauthorised. Not all of the orders are yours');
    error.statusCode = 403;
    return next(error);
  }

  if (orders.length !== orderIds.length) {
    const error = new Error('Could not find a unique order for each order id provided');
    error.statusCode = 404;
    return next(error);
  }

  const ordersReturn = orders.map((order) => ({
    id: order.id,
    isPaymentCompleted: order.isPaymentCompleted,
    createdAt: order.createdAt,
    orderItems: order.orderItems,
  }));

  res.status(200).json(ordersReturn);
};

exports.orderSuccess = async (req, res, next) => {
  const { paymentIntentId } = req.params;

  const order = await Order.findOne({ where: { paymentIntentId } });

  // if (order.userId !== req.userId) {
  //   const error = new Error(`Unauthorised. This order isn't yours.`);
  //   error.statusCode = 403;
  //   return next(error);
  // }

  res.redirect(`/shop/myOrder/${order.id}`);
};
