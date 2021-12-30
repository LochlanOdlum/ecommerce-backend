const fs = require('fs');
const { promisify } = require('util');

const sharp = require('sharp');
const sizeOf = promisify(require('image-size'));
const getAverageColor = require('fast-average-color-node').getAverageColor;

const watermark = async (rawImagePath, rawImageFilename) => {
  const { width: rawPhotoWidth } = await sizeOf(rawImagePath);

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
  await sharp(rawImagePath)
    .composite([{ input: watermarkBuffer }])
    .toFile(`util/temp-watermarked-images/${rawImageFilename}`);

  // const pipeline = sharp();
  // const finishedPipeline = pipeline.composite([{ input: watermarkBuffer }]);

  // const readStream = fs.createReadStream(rawImagePath);
  // finishedPipeline.pipe(readStream);
  // return finishedPipeline;
};

module.exports = watermark;
