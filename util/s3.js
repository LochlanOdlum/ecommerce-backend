const fs = require('fs');

const S3 = require('aws-sdk/clients/s3');

const watermark = require('./watermark');

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.uploadRaw = (file) => {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_RAW_PHOTOS_NAME,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
};

//File must be a multer file object
exports.watermarkAndUpload = async (file) => {
  watermark(file.path, file.filename);

  const fileStream = fs.createReadStream(
    `./temp-watermarked-images/${file.filename}`
  );

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_WATERMARKED_PHOTOS_NAME,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
};

exports.getRawPhoto = (key) => {
  const downloadParams = {
    Key: key,
    Bucket: process.env.AWS_BUCKET_RAW_PHOTOS_NAME,
  };

  return s3.getObject(downloadParams).createReadStream();
};

exports.getWatermarkedPhoto = (key) => {
  const downloadParams = {
    Key: key,
    Bucket: process.env.AWS_BUCKET_WATERMARKED_PHOTOS_NAME,
  };

  return s3.getObject(downloadParams).createReadStream();
};
