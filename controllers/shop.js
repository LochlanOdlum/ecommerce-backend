const { Op } = require('sequelize');
const stripe = require('../util/stripe');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');

exports.getProducts = async (req, res, next) => {
  const products = await Product.findAll({
    where: { isAvaliableForPurchase: true },
  });

  res.json(products);
};

exports.getProduct = async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({
    where: { id, isAvaliableForPurchase: true },
  });

  if (!product) {
    const error = new Error('Could not find a product with this id');
    error.statusCode = 404;
    return next(error);
  }

  res.json(product);
};

//Recieve order = {itemIds: [id1, id2, ...], stripeReceiptEmail?}
//Starts an order, creates paymentIntent but still needs to be paid.
exports.startOrder = async (req, res, next) => {
  const { itemIds } = req.body;

  const products = await Product.findAll({
    where: { id: { [Op.or]: itemIds }, isAvaliableForPurchase: true },
  });

  if (products.length !== itemIds.length) {
    console.log(products);
    const error = new Error(
      'Could not match each item Id to an existing unique product.'
    );
    error.statusCode = 400;
    return next(error);
  }

  //Get total cost of order from products using order items.

  const totalCostInPence = products.reduce(
    (accumulator, current) => accumulator + +current.price,
    0
  );

  //Create payment Intent

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCostInPence,
    // receipt_email: stripeReceiptEmail,
    currency: 'gbp',
  });

  //Create order with payment intent id, isPaymentCompleted: false...

  const user = req.user;

  const order = await user.createOrder({
    paymentIntentId: paymentIntent.id,
    isPaymentCompleted: false,
    totalPrice: totalCostInPence,
  });

  const promises = [];

  //Reserve products so other users cannot buy a product which someone else is buying
  products.forEach((product) => {
    // product.isReserved = true;
    // promises.push(product.save());
    promises.push(
      order.createOrderItem({
        title: product.title,
        description: product.description,
        price: product.price,
        rawImageKey: product.rawImageKey,
        productId: product.id,
      })
    );
  });

  await Promise.all(promises);

  //If order hasn't been paid in 30 mins and also cancels order and payment Intent so they cannot be charged after.

  setTimeout(async () => {
    try {
      const upToDatePaymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntent.id
      );

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

      // products.forEach((product) => {
      //   if (!product.isPurchased) {
      //     product.isAvaliableForPurchase = true;
      //     product.save();
      //   }
      // });
    } catch (error) {
      console.error(error);
    }
  }, 1000 * 60 * 30);

  res
    .status(200)
    .json({ clientSecret: paymentIntent.client_secret, orderId: order.id });
};

exports.getMyOrder = async (req, res, next) => {
  const { id: orderId } = req.params;
  const userId = req.userId;

  //Finding order directly rather than using user.getOrder(...), so custom error message for when order exists but not belonging to authenticated user.
  const order = await Order.findOne({
    where: { id: orderId, isPaymentCompleted: true },
    include: [User, OrderItem],
  });

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
    order: {
      id: orderId,
      isPaymentCompleted: order.isPaymentCompleted,
      createdAt: order.createdAt,
      orderItems: order.orderItems,
    },
  });
};

exports.getMyOrders = async (req, res, next) => {
  const { orderIds } = req.body;
  const user = req.user;

  const orders = await user.getOrders({
    include: OrderItem,
    where: { isPaymentCompleted: true },
  });

  const ordersReturn = orders.map((order) => ({
    id: order.id,
    isPaymentCompleted: order.isPaymentCompleted,
    createdAt: order.createdAt,
    orderItems: order.orderItems,
  }));

  res.status(200).json({ orders: ordersReturn });
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
