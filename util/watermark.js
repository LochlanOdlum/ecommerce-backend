const Jimp = require('jimp');
const getAverageColor = require('fast-average-color-node').getAverageColor;

//Watermarks image, outputting to './temp-watermarked-images/(filename)'
const watermark = async (RAW_IMAGE_PATH, RAW_IMAGE_FILENAME) => {
  // First figure out if image is dark or light to know what watermark color
  const { isDark } = await getAverageColor(RAW_IMAGE_PATH);

  // Add watermark
  const [image, watermark] = await Promise.all([
    Jimp.read(RAW_IMAGE_PATH),
    Jimp.read('./watermark.png'),
  ]);

  // Watermark is 2/5th the width of the photo
  watermark.resize(image.bitmap.width / 2.5, Jimp.AUTO);

  watermark.opacity(0.4);

  if (isDark) {
    // Slightly ligthten as watermark wasn't standing out enough on dark photos
    watermark.brightness(0.05);
  } else {
    // Lighten image as watermark stood out too much
    watermark.brightness(0.35);
  }

  // X,Y co-ordinates chosen to print watermark centered on photo
  const X = 0.5 * (image.bitmap.width - watermark.bitmap.width);
  const Y = 0.5 * (image.bitmap.height - watermark.bitmap.height);

  const watermarkedImage = await image.composite(watermark, X, Y, [
    {
      mode: Jimp.BLEND_SCREEN,
      opacitySource: 1,
      opacityDest: 1,
    },
  ]);

  watermarkedImage.write(`./temp-watermarked-images/${RAW_IMAGE_FILENAME}`);
};

module.exports = watermark;
