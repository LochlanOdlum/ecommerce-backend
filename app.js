// require('dotenv').config();
const express = require('express');

const sequelize = require('./util/database');
const stripe = require('./util/stripe');
const shopRoute = require('./routes/shop');
const authRoute = require('./routes/auth');

const Product = require('./models/product');
const User = require('./models/user');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

app.use((req, res, next) => {
  if (req.originalUrl === '/stripewhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE ');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.post('/stripewhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WHSEC);
  } catch (err) {
    console.log(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  console.log('event created successfully');

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    const order = await Order.findOne({ where: { paymentIntentId: paymentIntent.id } });

    if (!order) {
      return res.json({ received: true });
    }

    order.isPaymentCompleted = true;
    await order.save();
  }

  res.json({ received: true });
});

app.use('/shop', shopRoute);
app.use(authRoute);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

User.hasMany(Order);
Order.belongsTo(User);
Order.hasMany(OrderItem, { onDelete: 'cascade' });
OrderItem.belongsTo(Order);

const main = async () => {
  const order = await Order.findOne({ where: { id: 7 } });
  // const result = await sequelize.sync({ alter: true });
  // console.log('t');
  // const result = await sequelize.sync({ force: true });
  // console.log(user.toJSON());
  // await Product.create({
  //   title: 'Dark Night',
  //   description: 'photo of the moony',
  //   price: 34.99,
  //   imageKey: 'awdwar3r3asd',
  // });
  app.listen(process.env.PORT || 5000);
};

main();
