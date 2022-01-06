const fs = require('fs');
const { promisify } = require('util');

const sharp = require('sharp');
const sizeOf = promisify(require('image-size'));
const getAverageColor = require('fast-average-color-node').getAverageColor;

//First scales down image to specified height then crops the image to width from center
const shrinkandcrop = (
  image,
  imageWidth,
  imageHeight,
  shrinkHeight,
  cropWidth
) => {
  const resizedWidth = (shrinkHeight / imageHeight) * imageWidth;

  return sharp(image)
    .resize(null, shrinkHeight)
    .extract({
      width: cropWidth,
      left: Math.round(0.5 * (resizedWidth - cropWidth)),
      top: 0,
      height: shrinkHeight - 1,
    })
    .toBuffer();
};
exports.watermark = async (rawImagePath, rawImageFilename) => {
  const { width: rawPhotoWidth, height: rawPhotoHeight } = await sizeOf(
    rawImagePath
  );

  const { isDark } = await getAverageColor(rawImagePath);

  const brightnessMultiplier = isDark ? 1.4 : 4;
  const watermarkBuffer = await sharp('util/watermark.png')
    .resize(Math.round(rawPhotoWidth / 3))
    .composite([
      {
        //Final number in array below is opacity: 0 is fully transparent and 255 is no change
        input: Buffer.from([255, 255, 255, 100]),
        raw: {
          width: 1,
          height: 1,
          channels: 4,
        },
        tile: true,
        blend: 'dest-in',
      },
    ])
    .modulate({
      brightness: brightnessMultiplier,
    })
    .toBuffer();

  //TODO: Figure out how to do this with pipelines so don't need to write watermarked image
  // to local storage, send directly to s3 bucket

  // await sharp(rawImagePath)
  //   .composite([{ input: watermarkBuffer }])
  //   .toFile(`util/temp-watermarked-images/${rawImageFilename}`);

  const promises = [];

  const fullWatermarkedImageBuffer = await sharp(rawImagePath)
    .composite([{ input: watermarkBuffer }])
    .toBuffer();

  //Medium size image
  //i.e. downscaled image so height is 500px high
  promises.push(sharp(fullWatermarkedImageBuffer).resize(null, 500).toBuffer());

  //Medium sized image then cropped horizontally to square
  //For use on shop page with list of all photos for sale
  promises.push(
    shrinkandcrop(
      fullWatermarkedImageBuffer,
      rawPhotoWidth,
      rawPhotoHeight,
      500,
      500
    )
  );

  const [mediumWatermarkedBuffer, mediumCroppedSquareWatermarkedBuffer] =
    await Promise.all(promises);

  return [
    fullWatermarkedImageBuffer,
    mediumWatermarkedBuffer,
    mediumCroppedSquareWatermarkedBuffer,
  ];
};

exports.shrinkRawAndSquare = async (rawImagePath) => {
  const { width: rawPhotoWidth, height: rawPhotoHeight } = await sizeOf(
    rawImagePath
  );

  return shrinkandcrop(rawImagePath, rawPhotoWidth, rawPhotoHeight, 500, 500);
};
