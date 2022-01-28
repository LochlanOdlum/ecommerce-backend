const fs = require('fs');
const { Readable } = require('stream');

const S3 = require('aws-sdk/clients/s3');

const photoEditFormat = require('./photoEditFormat');

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.uploadRawAndDownscaledSquare = async (file) => {
  const rawMediumImageBuffer = await photoEditFormat.shrinkRawMedium(file.path);

  const fileStream = fs.createReadStream(file.path);

  const uploadPromises = [];

  const uploadParamsRawMedium = {
    Bucket: process.env.AWS_BUCKET_MEDIUM_PHOTOS,
    Body: Readable.from(rawMediumImageBuffer),
    Key: file.filename,
  };

  uploadPromises.push(s3.upload(uploadParamsRawMedium).promise());

  const uploadParamsRaw = {
    Bucket: process.env.AWS_BUCKET_RAW_PHOTOS_NAME,
    Body: fileStream,
    Key: file.filename,
  };

  uploadPromises.push(s3.upload(uploadParamsRaw).promise());

  return Promise.all(uploadPromises);
};

//File must be a multer file object
exports.watermarkAndUpload = async (file) => {
  const [fullWatermarkedImageBuffer, mediumWatermarkedBuffer, mediumCroppedSquareWatermarkedBuffer] =
    await photoEditFormat.watermark(file.path, file.filename);

  console.log('Recieved image buffers');

  //TODO: Create s3 bucket for different versions of photo given above

  const uploadPromises = [];

  //Full quality upload
  const uploadParamsFull = {
    Bucket: process.env.AWS_BUCKET_FULL_WATERMARKED_PHOTOS_NAME,
    Body: Readable.from(fullWatermarkedImageBuffer),
    Key: file.filename,
  };

  uploadPromises.push(s3.upload(uploadParamsFull).promise());

  //Downscaled to medium quality upload
  const uploadParamsMedium = {
    Bucket: process.env.AWS_BUCKET_MEDIUM_WATERMARKED_PHOTOS_NAME,
    Body: Readable.from(mediumWatermarkedBuffer),
    Key: file.filename,
  };

  uploadPromises.push(s3.upload(uploadParamsMedium).promise());

  //Downscaled to medium then cropped square upload
  console.log('heyy');
  console.log(process.env.AWS_BUCKET_MEDIUM_CROPPED_SQUARE_WATERMARKED_PHOTOS_NAME);
  const uploadParamsMediumSquare = {
    Bucket: process.env.AWS_BUCKET_MEDIUM_CROPPED_SQUARE_WATERMARKED_PHOTOS_NAME,
    Body: Readable.from(mediumCroppedSquareWatermarkedBuffer),
    Key: file.filename,
  };

  uploadPromises.push(s3.upload(uploadParamsMediumSquare).promise());

  return Promise.all(uploadPromises);
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
    Bucket: process.env.AWS_BUCKET_FULL_WATERMARKED_PHOTOS_NAME,
  };

  return s3.getObject(downloadParams).createReadStream();
};
