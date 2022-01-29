const fs = require('fs');
const { promisify } = require('util');

const sharp = require('sharp');
const sizeOf = require('image-size');
const getAverageColor = require('fast-average-color-node').getAverageColor;
const { resize } = require('jimp');

//First scales down image to specified height then crops the image to width from center
//Split into two functions if ever need to do either thing individually

// exports.watermark = async (rawImagePath, rawImageFilename) => {
//   const { width: rawPhotoWidth, height: rawPhotoHeight } = await sizeOf(rawImagePath);

//   const { isDark } = await getAverageColor(rawImagePath);

//   const brightnessMultiplier = isDark ? 1.4 : 4;
//   const watermarkBuffer = await sharp('util/watermark.png')
//     .resize(Math.round(rawPhotoWidth / 3))
//     .composite([
//       {
//         //Final number in array below is opacity: 0 is fully transparent and 255 is no change
//         input: Buffer.from([255, 255, 255, 100]),
//         raw: {
//           width: 1,
//           height: 1,
//           channels: 4,
//         },
//         tile: true,
//         blend: 'dest-in',
//       },
//     ])
//     .modulate({
//       brightness: brightnessMultiplier,
//     })
//     .toBuffer();

//   //TODO: Figure out how to do this with pipelines so don't need to write watermarked image
//   // to store entire images in memory

//   // await sharp(rawImagePath)
//   //   .composite([{ input: watermarkBuffer }])
//   //   .toFile(`util/temp-watermarked-images/${rawImageFilename}`);

//   const promises = [];

//   const fullWatermarkedImageBuffer = await sharp(rawImagePath)
//     .composite([{ input: watermarkBuffer }])
//     .toBuffer();

//   //Medium size image
//   //i.e. downscaled image so height is 500px high
//   promises.push(sharp(fullWatermarkedImageBuffer).resize(null, 500).toBuffer());

//   //Medium sized image then cropped horizontally to square
//   //For use on shop page with list of all photos for sale
//   promises.push(shrinkandcrop(fullWatermarkedImageBuffer, rawPhotoWidth, rawPhotoHeight, 500, 500));

//   const [mediumWatermarkedBuffer, mediumCroppedSquareWatermarkedBuffer] = await Promise.all(promises);

//   return [fullWatermarkedImageBuffer, mediumWatermarkedBuffer, mediumCroppedSquareWatermarkedBuffer];
// };

// exports.shrinkRawMedium = async (rawImagePath) => {
//   // const { width: rawPhotoWidth, height: rawPhotoHeight } = await sizeOf(rawImagePath);

//   return sharp(rawImagePath).resize(null, 500).toBuffer();
// };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Following functions all return promises resolving to the buffer

const shrinkandcrop = async (img, shrinkHeight, cropWidth) => {
  const { width: imageWidth, height: imageHeight } = sizeOf(img);
  const resizedWidth = (shrinkHeight / imageHeight) * imageWidth;

  if (cropWidth > resizedWidth) {
    return sharp(img).resize(null, shrinkHeight).toBuffer();
  }

  return sharp(img)
    .resize(null, shrinkHeight)
    .extract({
      width: cropWidth,
      left: Math.round(0.5 * (resizedWidth - cropWidth)),
      top: 0,
      height: shrinkHeight,
    })
    .toBuffer();
};

exports.overlayPhoto = (img1, img2) => {
  return sharp(img1)
    .composite([{ input: img2 }])
    .toBuffer();
};

//Creates watermark of right size and color for image
exports.watermarkPhoto = async (imgPath) => {
  const { width: photoWidth } = sizeOf(imgPath);

  //Watermark will have less brightness if image is dark so doesn't stand out too much
  const { isDark } = await getAverageColor(imgPath);
  const brightnessMultiplier = isDark ? 1.4 : 4;

  const watermarkBuffer = await sharp('util/watermark.png')
    .resize(Math.round(photoWidth / 3))
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

  return sharp(imgPath)
    .composite([{ input: watermarkBuffer }])
    .toBuffer();
};

//For all below: img can either be buffer of img in memory or the file path to img

exports.photoMed = (img) => sharp(img).resize(null, 500).toBuffer();

exports.photoMedCropped1to1 = (img) => shrinkandcrop(img, 500, 500);

exports.photoMedCropped2to1 = (img) => shrinkandcrop(img, 500, 1000);

//Large ensures photo will fit within 1920px x 1080px
exports.photoLrg = async (img) => {
  const { width: imageWidth, height: imageHeight } = sizeOf(img);

  //First assume shrinking down so width is 1920px exactly
  const scaleFactor = 1920 / imageWidth;
  const newHeight = scaleFactor * imageHeight;

  //If image is taller than 1080px then instead shrink height to 1080px making width less than 1920px
  if (newHeight > 1080) {
    return sharp(img).resize(null, 1080).toBuffer();
  }

  //Otherwise then new height fits as it's <= 1080px so assumption is good and shrink down width to 1920px
  return await sharp(img).resize(1920, null).toBuffer();
};
