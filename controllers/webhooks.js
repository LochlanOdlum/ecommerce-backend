const stripe = require('../util/stripe');

exports.stripewhook = async (req, res) => {
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

    //Eager load order Items in request below. Then loop through all order items and update products to have 'isPurchased = true'
    const order = await Order.findOne({ where: { paymentIntentId: paymentIntent.id }, include: OrderItem });

    if (!order) {
      return res.json({ received: true });
    }

    const orderProductIds = order.orderItems.map((item) => item.productId);

    console.log(order);
    console.log(order.orderItems);
    console.log(orderProductIds);

    orderProductIds.forEach(async (id) => {
      const product = await Product.findOne({ where: { id } });
      product.isPurchased = true;
      await product.save();
    });

    order.isPaymentCompleted = true;
    await order.save();
  }

  res.json({ received: true });
};
