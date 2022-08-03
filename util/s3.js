const fs = require('fs');
const { Readable } = require('stream');

const S3 = require('aws-sdk/clients/s3');

const imageProcess = require('./imageProcess');
const upload = require('./multer');

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  signatureVersion: 'v4',
});

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
exports.uploadPhotos = async (file, s3ImagesKey) => {
  const imagePath = file.path;
  const keyName = s3ImagesKey;
  //TODO: Figure out a way to not load entire image into memory at full scale (could be ~20MB for biggest photos!)
  const photoWatermarkedBuffer = await imageProcess.watermarkPhoto(imagePath);

  //GETTING PHOTO BUFFERS
  const photoMedBuffer = await imageProcess.photoMed(imagePath);
  const photoMedCropped2to1Buffer = await imageProcess.photoMedCropped2to1(imagePath);
  const photoWmarkedLrgBuffer = await imageProcess.photoLrg(photoWatermarkedBuffer);
  const photoWmarkedMedBuffer = await imageProcess.photoMed(photoWatermarkedBuffer);
  const photoWmarkedMedSquareBuffer = await imageProcess.photoMedCropped1to1(photoWatermarkedBuffer);

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

  return [
    photoResPromise,
    photoMedResPromise,
    photoMedCropped2to1ResPromise,
    photoWmarkedLrgResPromise,
    photoWmarkedMedResPromise,
    photoWmarkedMedSquareResPromisee,
  ];
};

exports.getPhoto = (bucket, key) => {
  const downloadParams = {
    Key: key,
    Bucket: bucket,
  };
  try {
    return s3.getObject(downloadParams).createReadStream();
  } catch (error) {
    throw error;
  }
};

exports.getSignedPhotoURL = async (bucket, key, expirationTime) => {
  const params = { Bucket: bucket, Key: key, Expires: expirationTime };
  return await s3.getSignedUrlPromise('getObject', params);
};

exports.getMetadata = async (bucket, key) => {
  const downloadParams = {
    Key: key,
    Bucket: bucket,
  };
  try {
    return s3.headObject(downloadParams).promise();
  } catch (error) {
    throw error;
  }
};

//Deletes image from each bucket
exports.deletePhotos = (key) => {
  const buckets = [
    process.env.AWS_BUCKET_PHOTOS,
    process.env.AWS_BUCKET_MED_PHOTOS,
    process.env.AWS_BUCKET_MED_CROPPED_PHOTOS,
    process.env.AWS_BUCKET_WMARKED_LRG_PHOTOS,
    process.env.AWS_BUCKET_WMARKED_MED_PHOTOS,
    process.env.AWS_BUCKET_WMARKED_MED_SQUARE_PHOTOS,
  ];

  const deletePromises = [];

  buckets.forEach((bucket) => {
    const deleteParams = {
      Bucket: bucket,
      Key: key,
    };

    deletePromises.push(s3.deleteObject(deleteParams).promise());
  });

  return Promise.all(deletePromises);
};
