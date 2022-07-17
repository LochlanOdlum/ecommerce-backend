const fs = require('fs/promises');

const { Op } = require('sequelize');

const Product = require('../models/product');
const Collection = require('../models/collection');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');
const User = require('../models/user');
const s3 = require('../util/s3');

exports.postPhoto = async (req, res, next) => {
  //req.file contains image info in multer file format
  // {
  //  fieldname: 'image',
  //  originalname: '65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  //  encoding: '7bit',
  //  mimetype: 'image/jpeg',
  //  destination: 'images',
  //  filename: '2021-12-27T03:22:31.903Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  //  path: 'images/2021-12-27T03:22:31.903Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  //  size: 197854
  // }

  const { title, description, priceInPounds, collectionId } = req.body;

  // const priceToPounds = (pence) => {
  //   const array = Array.from(String(pence));
  //   array.splice(array.length - 2, 0, '.');

  //   return +array.join('');
  // };

  const priceInPence = +priceInPounds * 100;

  const S3ResponsePromises = await s3.uploadPhotos(req.file);
  console.log(S3ResponsePromises);

  const [
    photoRes,
    photoMedRes,
    photoMedCropped2to1Res,
    photoWmarkedLrgRes,
    photoWmarkedMedRes,
    photoWmarkedMedSquareRes,
  ] = await Promise.all(S3ResponsePromises);

  console.log(photoRes);

  // const rawResponse = await s3.uploadRaw(req.file);
  // const watermarkedResponse = await s3.watermarkAndUpload(req.file);
  //S3 response object example:
  // {
  // ETag: '"2477a43eada026c5d14c40a1e5402cdd"',
  // Location: 'https://skylight-photography-raw-photos.s3.amazonaws.com/2021-12-27T04%3A11%3A30.108Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  // key: '2021-12-27T04:11:30.108Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  // Key: '2021-12-27T04:11:30.108Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  // Bucket: 'skylight-photography-raw-photos'
  // }

  console.log('Creating photo product in sql database');
  await Product.create({
    title,
    description,
    collectionId,
    priceInPence,
    priceInPounds,
    imageKey: photoRes.Key,
    imageMedKey: photoMedRes.Key,
    imageMedCropped2to1Key: photoMedCropped2to1Res.Key,
    imageWmarkedLrgKey: photoWmarkedLrgRes.Key,
    imageWmarkedLrgPublicURL: photoWmarkedLrgRes.Location,
    imageWmarkedMedKey: photoWmarkedMedRes.Key,
    imageWmarkedMedPublicURL: photoWmarkedMedRes.Location,
    imageWmarkedMedSquareKey: photoWmarkedMedSquareRes.Key,
    imageWmarkedMedSquarePublicURL: photoWmarkedMedSquareRes.Location,
  });

  res.status(200).json({ message: 'Photo created' });
};

exports.postCollection = async (req, res, next) => {
  const { collectionName } = req.body;

  await Collection.create({ name: collectionName });

  res.send({ message: 'Successfully added collection' });
};

exports.editCollection = async (req, res, next) => {
  const { id: collectionId } = req.params;
  const { updatedCollectionName } = req.body;

  await Collection.update({ name: updatedCollectionName }, { where: { id: collectionId } });

  res.send({ message: 'Successfully edited collection' });
};

exports.getPhotos = async (req, res, next) => {
  try {
    const { page: pageParam, resultsPerPage: resultsPerPageParam } = req.query;
    const page = +pageParam;
    const resultsPerPage = +resultsPerPageParam;
    const offset = (page - 1) * resultsPerPage;
    const { count, rows: products } = await Product.findAndCountAll({
      limit: resultsPerPage,
      offset,
      order: [['orderPosition', 'ASC']],
    });
    const pageCount = Math.ceil(count / resultsPerPage);
    res.send({ products, pageCount, count });
  } catch {
    const error = new Error('Could not find all orders');
    error.statusCode = 500;
    return next(error);
  }
};

exports.editPhoto = async (req, res, next) => {
  const { id: photoId } = req.params;

  for (let key in req.body) {
    if (req.body[key] === 'undefined') {
      req.body[key] = undefined;
    }
  }

  //Edited values
  const { title, description, collectionId, priceInPence } = req.body;
  let orderPosition = req.body.orderPosition;

  const photo = await Product.findOne({ where: { id: photoId } });

  //Changing order position is a special case as it requires changing values of other rows as well! Need to handle this.

  if (orderPosition) {
    const productCount = await Product.count();
    orderPosition = Math.min(productCount, orderPosition);

    const incrementAmount = orderPosition > photo.orderPosition ? -1 : 1;
    const lowerLimit = orderPosition > photo.orderPosition ? photo.orderPosition - incrementAmount : orderPosition;
    const upperLimit = orderPosition < photo.orderPosition ? photo.orderPosition - incrementAmount : orderPosition;

    await Product.increment('orderPosition', {
      by: incrementAmount,
      where: {
        orderPosition: {
          [Op.between]: [lowerLimit, upperLimit],
        },
      },
    });
  }

  await photo.update({ orderPosition, title, description, collectionId, priceInPence });

  res.status(200).json({ message: 'Photo edited successfuly' });
};

exports.getOrders = async (req, res, next) => {
  try {
    const { page: pageParam, resultsPerPage: resultsPerPageParam } = req.query;
    const page = +pageParam;
    const resultsPerPage = +resultsPerPageParam;
    const offset = (page - 1) * resultsPerPage;
    const { count, rows: orders } = await Order.findAndCountAll({
      include: [OrderItem],
      limit: resultsPerPage,
      offset,
    });
    const pageCount = Math.ceil(count / resultsPerPage);
    res.send({ orders, pageCount, count });
  } catch {
    const error = new Error('Could not find all orders');
    error.statusCode = 500;
    return next(error);
  }
};

exports.getOrderDetails = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    let user;

    //1: Get order
    const orderInstance = await Order.findOne({ include: [OrderItem], where: { id: orderId } });

    if (!orderInstance) {
      const error = new Error('Could not find an order with this id');
      error.statusCode = 500;
      return next(error);
    }

    const orderJSON = orderInstance.toJSON();

    //2: If order belongs to a user, fetch user and send in return request!
    if (orderInstance.userId) {
      user = await User.findOne({ where: { id: orderInstance.userId } });
    }

    //3: Return response!
    res.send({ order: { ...orderJSON, user } });
  } catch (e) {
    const error = new Error('Could not get order details');
    error.statusCode = 500;
    return next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page: pageParam, resultsPerPage: resultsPerPageParam } = req.query;
    const page = +pageParam;
    const resultsPerPage = +resultsPerPageParam;
    const offset = (page - 1) * resultsPerPage;
    const { count, rows: users } = await User.findAndCountAll({ limit: resultsPerPage, offset });
    const usersResponse = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    }));
    const pageCount = Math.ceil(count / resultsPerPage);
    res.send({ users: usersResponse, pageCount, count });
  } catch {
    const error = new Error('Could not find all orders');
    error.statusCode = 500;
    return next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      const error = new Error('Could not find user with this id');
      error.statusCode = 500;
      return next(error);
    }

    res.send({ user });
  } catch (e) {
    console.error(e);
    const error = new Error('Could not get user');
    error.statusCode = 500;
    return next(error);
  }
};
