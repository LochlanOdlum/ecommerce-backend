const { Op } = require('sequelize');
const stripe = require('../util/stripe');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');
const Collection = require('../models/collection');

const s3 = require('../util/s3');

//Order must be a order model instance from sequelize
const checkAndUpdateIfPaymentComplete = async (order) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    order.isPaymentCompleted = true;
    await order.save();
  }
};

exports.getProducts = async (req, res, next) => {
  const products = await Product.findAll({
    where: { isAvaliableForPurchase: true },
    order: [['orderPosition', 'ASC']],
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

exports.getCollections = async (req, res, next) => {
  const collections = await Collection.findAll();

  res.json(collections);
};

//Recieve order = {itemIds: [id1, id2, ...], stripeReceiptEmail?}
//Starts an order, creates paymentIntent but still needs to be paid.
//Once paid then seperate webhook middleware activated by stripe will then update the isPaymentCompleted
//TODO: STOP USER ORDERING PHOTO MORE THAN ONCE
exports.startOrder = async (req, res, next) => {
  const { customerEmail, customerName, itemIds } = req.body;

  const products = await Product.findAll({
    where: { id: { [Op.or]: itemIds }, isAvaliableForPurchase: true },
  });

  if (products.length !== itemIds.length) {
    const error = new Error('Could not match each item Id to an existing unique product.');
    error.statusCode = 400;
    return next(error);
  }

  //Get total cost of order from products using order items.

  const totalCostInPence = products.reduce((accumulator, current) => accumulator + +current.priceInPence, 0);

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
    totalPriceInPence: totalCostInPence,
    customerEmail,
    customerName,
  });

  const promises = [];

  products.forEach((product) => {
    promises.push(
      order.createOrderItem({
        title: product.title,
        description: product.description,
        priceInPence: product.priceInPence,
        priceInPounds: product.priceInPounds,
        productId: product.id,
        imageKey: product.imageKey,
        imageMedKey: product.imageMedKey,
        imageMedCropped2to1Key: product.imageMedCropped2to1Key,
      })
    );
  });

  await Promise.all(promises);

  //If order hasn't been paid in 30 mins cancels order and also payment Intent so they cannot be charged after.

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
    } catch (error) {
      console.error(error);
    }
  }, 1000 * 60 * 30);

  res.status(200).json({ clientSecret: paymentIntent.client_secret, orderId: order.id });
};

exports.getMyOrder = async (req, res, next) => {
  const orderId = +req.params.id;
  console.log(orderId);
  const userId = req.userId;

  //Finding order directly rather than using user.getOrder(...), so custom error message for when order exists but not belonging to authenticated user.
  const order = await Order.findOne({
    where: { id: orderId },
    include: [OrderItem],
  });

  //Check if payment has been completed yet with manual query to stripe
  if (!order.isPaymentCompleted) {
    await checkAndUpdateIfPaymentComplete(order);
  }

  if (!order || !order.isPaymentCompleted) {
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
      createdAt: order.createdAt,
      orderItems: order.orderItems,
      totalPriceInPence: order.totalPriceInPence,
    },
  });
};

exports.getMyOrders = async (req, res, next) => {
  const { orderIds } = req.body;
  const user = req.user;

  const orders = await user.getOrders({
    include: OrderItem,
  });

  const updatePromises = [];

  orders.forEach((order) => {
    if (!order.isPaymentCompleted) {
      updatePromises.push(checkAndUpdateIfPaymentComplete(order));
    }
  });

  await Promise.all(updatePromises);

  const paymentCompletedOrders = orders.filter((order) => order.isPaymentCompleted);

  const ordersReturn = paymentCompletedOrders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    orderItems: order.orderItems,
    totalPriceInPence: order.totalPriceInPence,
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

exports.getImageMedCropped2to1 = async (req, res, next) => {
  const { key } = req.params;

  const userOrders = await req.user.getOrders({ include: OrderItem });
  const userOrderItems = [];
  userOrders.forEach((order) => userOrderItems.push(...order.orderItems));

  const orderItemWithKey = userOrderItems.find((orderItem) => orderItem.imageMedCropped2to1Key === key);

  console.log(orderItemWithKey);
  if (!orderItemWithKey) {
    const error = new Error('You have not purchased a photo with this key');
    error.statusCode = 404;
    return next(error);
  }

  try {
    const readStream = s3.getPhoto(process.env.AWS_BUCKET_MED_CROPPED_PHOTOS, key);

    readStream.on('error', (err) => {
      const error = new Error('Could not find image with that key');
      error.statusCode = 404;
      return next(error);
    });

    readStream.pipe(res);
  } catch (err) {
    const error = new Error('Could not find image with that key');
    error.statusCode = 404;
    return next(error);
  }
};

exports.getImage = async (req, res, next) => {
  const { key } = req.params;

  const userOrders = await req.user.getOrders({ include: OrderItem });
  const userOrderItems = [];
  userOrders.forEach((order) => userOrderItems.push(...order.orderItems));

  const orderItemWithKey = userOrderItems.find((orderItem) => orderItem.imageKey === key);

  console.log(orderItemWithKey);
  if (!orderItemWithKey) {
    const error = new Error('You have not purchased a photo with this key');
    error.statusCode = 404;
    return next(error);
  }

  try {
    const readStream = s3.getPhoto(process.env.AWS_BUCKET_PHOTOS, key);

    readStream.on('error', (err) => {
      const error = new Error('Could not find image with that key');
      error.statusCode = 404;
      return next(error);
    });

    readStream.pipe(res);
  } catch (err) {
    const error = new Error('Could not find image with that key');
    error.statusCode = 404;
    return next(error);
  }
};
