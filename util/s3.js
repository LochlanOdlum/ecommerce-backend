const S3 = require('aws-sdk/clients/s3');
const Jimp = require('jimp');
const jimp = require('jimp');

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
exports.watermarkAndUpload = (file) => {
  const fileStream = fs.createReadStream(file.path);

  //Somehow watermark and set body below to this watermarked image?
  const image = await Jimp.read(file.buffer);

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_RAW_PHOTOS_NAME,
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
