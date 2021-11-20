require('dotenv').config();
const express = require('express');

const sequelize = require('./util/database');
const productRoute = require('./routes/product');
const authRoute = require('./routes/auth');

const Product = require('./models/product');
const User = require('./models/user');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE ');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/products', productRoute);
app.use('/', authRoute);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

const main = async () => {
  // const result = await sequelize.sync({ alter: true });
  // console.log('t');
  // const result = await sequelize.sync({ force: true });
  // console.log(user.toJSON());
  // await Product.create({
  //   title: 'Dark Night',
  //   description: 'photo of the moon',
  //   price: 34.99,
  //   imageKey: 'awdwar3r3asd',
  // });
  app.listen(5000);
};

main();
