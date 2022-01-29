const fs = require('fs/promises');

const Product = require('../models/product');
const Collection = require('../models/collection');
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
