const fs = require('fs/promises');

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
  console.log(req.file);
  const response = await s3.uploadRaw(req.file);
  const response2 = await s3.watermarkAndUpload(req.file);
  //S3 response object example:
  // {
  // ETag: '"2477a43eada026c5d14c40a1e5402cdd"',
  // Location: 'https://skylight-photography-raw-photos.s3.amazonaws.com/2021-12-27T04%3A11%3A30.108Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  // key: '2021-12-27T04:11:30.108Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  // Key: '2021-12-27T04:11:30.108Z-65d366_62228a3551614e18a4444ec83c0c0f2c~mv2.jpg',
  // Bucket: 'skylight-photography-raw-photos'
  // }

  console.log(response);
  console.log(response2);

  res.status(200).json({ message: 'Photo created' });
};
