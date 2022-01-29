const fs = require('fs');
const { Readable } = require('stream');

const S3 = require('aws-sdk/clients/s3');

const imageProcess = require('./imageProcess');
const upload = require('./multer');

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// exports.uploadRawAndDownscaledRaw = async (file) => {
//   const rawMediumImageBuffer = await photoEditFormat.shrinkRawMedium(file.path);

//   const fileStream = fs.createReadStream(file.path);

//   const uploadPromises = [];

//   const uploadParamsRawMedium = {
//     Bucket: process.env.AWS_BUCKET_MEDIUM_PHOTOS,
//     Body: Readable.from(rawMediumImageBuffer),
//     Key: file.filename,
//   };

//   uploadPromises.push(s3.upload(uploadParamsRawMedium).promise());

//   const uploadParamsRaw = {
//     Bucket: process.env.AWS_BUCKET_RAW_PHOTOS_NAME,
//     Body: fileStream,
//     Key: file.filename,
//   };

//   uploadPromises.push(s3.upload(uploadParamsRaw).promise());

//   return Promise.all(uploadPromises);
// };

// //File must be a multer file object
// exports.watermarkAndUpload = async (file) => {
//   const [fullWatermarkedImageBuffer, mediumWatermarkedBuffer, mediumCroppedSquareWatermarkedBuffer] =
//     await photoEditFormat.watermark(file.path, file.filename);

//   console.log('Recieved image buffers');

//   //TODO: Create s3 bucket for different versions of photo given above

//   const uploadPromises = [];

//   //Full quality upload
//   const uploadParamsFull = {
//     Bucket: process.env.AWS_BUCKET_FULL_WATERMARKED_PHOTOS_NAME,
//     Body: Readable.from(fullWatermarkedImageBuffer),
//     Key: file.filename,
//   };

//   uploadPromises.push(s3.upload(uploadParamsFull).promise());

//   //Downscaled to medium quality upload
//   const uploadParamsMedium = {
//     Bucket: process.env.AWS_BUCKET_MEDIUM_WATERMARKED_PHOTOS_NAME,
//     Body: Readable.from(mediumWatermarkedBuffer),
//     Key: file.filename,
//   };

//   uploadPromises.push(s3.upload(uploadParamsMedium).promise());

//   //Downscaled to medium then cropped square upload
//   console.log('heyy');
//   console.log(process.env.AWS_BUCKET_MEDIUM_CROPPED_SQUARE_WATERMARKED_PHOTOS_NAME);
//   const uploadParamsMediumSquare = {
//     Bucket: process.env.AWS_BUCKET_MEDIUM_CROPPED_SQUARE_WATERMARKED_PHOTOS_NAME,
//     Body: Readable.from(mediumCroppedSquareWatermarkedBuffer),
//     Key: file.filename,
//   };

//   uploadPromises.push(s3.upload(uploadParamsMediumSquare).promise());

//   return Promise.all(uploadPromises);
// };

const uploadBufferToS3 = (bucket, buffer, keyName) => {
  const uploadParams = {
    Bucket: bucket,
    Body: Readable.from(buffer),
    Key: keyName,
  };

  return s3.upload(uploadParams).promise();
};

const uploadfilePathToS3 = (bucket, filePath, keyName) => {
  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: bucket,
    Body: fileStream,
    Key: keyName,
  };

  return s3.upload(uploadParams).promise();
};

//Argument needs to be multer file object
exports.uploadPhotos = async (file) => {
  const imagePath = file.path;
  const keyName = file.filename;
  const photoWatermarkedBuffer = await imageProcess.watermarkPhoto(imagePath);

  //GETTING PHOTO BUFFERS
  const photoMedBuffer = await imageProcess.photoMed(imagePath);
  const photoMedCropped2to1Buffer = await imageProcess.photoMedCropped2to1(imagePath);
  const photoWmarkedLrgBuffer = await imageProcess.photoLrg(photoWatermarkedBuffer);
  const photoWmarkedMedBuffer = await imageProcess.photoMed(photoWatermarkedBuffer);
  const photoWmarkedMedSquareBuffer = await imageProcess.photoMedCropped1to1(photoWatermarkedBuffer);

  //Seperate overlay function here, pass in watermark buffer and image and return watermarked image?
  //That way don't need to store entire raw (Watermarked) photo in memory

  //UPLOADING PHOTO BUFFERS + ACTUAL PHOTO FROM LOCAL FS
  const photoResPromise = uploadfilePathToS3(process.env.AWS_BUCKET_PHOTOS, imagePath, keyName);
  const photoMedResPromise = uploadBufferToS3(process.env.AWS_BUCKET_MED_PHOTOS, photoMedBuffer, keyName);
  const photoMedCropped2to1ResPromise = uploadBufferToS3(
    process.env.AWS_BUCKET_MED_CROPPED_PHOTOS,
    photoMedCropped2to1Buffer,
    keyName
  );
  const photoWmarkedLrgResPromise = uploadBufferToS3(
    process.env.AWS_BUCKET_WMARKED_LRG_PHOTOS,
    photoWmarkedLrgBuffer,
    keyName
  );
  const photoWmarkedMedResPromise = uploadBufferToS3(
    process.env.AWS_BUCKET_WMARKED_MED_PHOTOS,
    photoWmarkedMedBuffer,
    keyName
  );
  const photoWmarkedMedSquareResPromisee = uploadBufferToS3(
    process.env.AWS_BUCKET_WMARKED_MED_SQUARE_PHOTOS,
    photoWmarkedMedSquareBuffer,
    keyName
  );

  //RETURNING PROMISES OF PHOTO UPLOADS TO BUCKET

  console.log('about to return promises');
  console.log(photoResPromise);

  return [
    photoResPromise,
    photoMedResPromise,
    photoMedCropped2to1ResPromise,
    photoWmarkedLrgResPromise,
    photoWmarkedMedResPromise,
    photoWmarkedMedSquareResPromisee,
  ];
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
