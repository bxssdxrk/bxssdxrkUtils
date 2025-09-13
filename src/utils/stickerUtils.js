const fs = require("fs");
const path = require("path");
const colors = require("colors");
const webp = require("node-webpmux");
const ffmpeg = require("fluent-ffmpeg");
const { tempDir } = require(`${BASE_DIR}/config`);

async function processToSticker(mediaInput, metadata, ffmpegOptions) {
  const isBuffer = Buffer.isBuffer(mediaInput);
  const tempId = Date.now();
  const inputPath = path.join(tempDir, `input-${tempId}`);
  const outputPath = path.join(tempDir, `output-${tempId}.webp`);

  try {
    if (isBuffer) fs.writeFileSync(inputPath, mediaInput);
    const inputForFfmpeg = isBuffer ? inputPath : path.resolve(mediaInput);

    await new Promise((resolve, reject) => {
      ffmpeg(inputForFfmpeg)
        .on("error", (err) => {
          console.error(colors.brightRed("FFmpeg Error:"), err);
          reject(err);
        })
        .on("end", () => resolve())
        .addOutputOptions(ffmpegOptions)
        .toFormat("webp")
        .save(outputPath);
    });

    await addStickerMetadata(outputPath, metadata);
    const stickerBuffer = fs.readFileSync(outputPath);
    
    if (isBuffer && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    return stickerBuffer;
  } catch (err) {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw err;
  }
}

async function convertMediaToSticker(mediaInput, metadata = {}) {
  const options = [
    "-vcodec", "libwebp_anim",
    "-vf", `
      scale='if(gte(iw,ih),360,-1)':'if(gte(iw,ih),-1,360)',
      fps=24,
      pad=360:360:(ow-iw)/2:(oh-ih)/2:color=white@0.0,
      split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];
      [b][p]paletteuse
    `,
    "-an",
    "-fs", "750k",
    "-qscale:v", "65",
  ];
  return await processToSticker(mediaInput, metadata, options);
}

async function convertMediaToStickerC(mediaInput, metadata = {}) {
  const options = [
    "-vcodec", "libwebp_anim",
    "-vf", `
      scale='if(gt(iw,ih),-1,360)':'if(gt(iw,ih),360,-1)',
      crop=360:360:(iw-360)/2:(ih-360)/2,
      fps=24,
      split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];
      [b][p]paletteuse
    `,
    "-an",
    "-fs", "750k",
    "-qscale:v", "65",
  ];
  return await processToSticker(mediaInput, metadata, options);
}

async function convertMediaToStickerX(mediaInput, metadata = {}) {
  const options = [
    "-vcodec", "libwebp_anim",
    "-vf", `
      scale=360:360,
      fps=24,
      pad=360:360:-1:-1:color=white@0.0,
      split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];
      [b][p]paletteuse
    `,
    "-an",
    "-fs", "750k",
    "-qscale:v", "65",
  ];
  return await processToSticker(mediaInput, metadata, options);
}

async function convertStickerToImage(mediaInput) {
  const isBuffer = Buffer.isBuffer(mediaInput);
  const tempId = Date.now();
  const inputPath = path.join(tempDir, `sticker-${tempId}.webp`);
  const outputPath = path.join(tempDir, `image-${tempId}.png`);

  try {
    if (isBuffer) fs.writeFileSync(inputPath, mediaInput);
    const inputForFfmpeg = isBuffer ? inputPath : path.resolve(mediaInput);

    await new Promise((resolve, reject) => {
      ffmpeg(inputForFfmpeg)
        .on("error", (err) => {
          console.error(colors.brightRed("FFmpeg Error:"), err);
          reject(err);
        })
        .on("end", () => resolve())
        .toFormat("apng")
        .save(outputPath);
    });

    const imageBuffer = fs.readFileSync(outputPath);

    if (isBuffer && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    return imageBuffer;
  } catch (err) {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw err;
  }
}

async function addStickerMetadata(mediaPath, metadata = {}) {
  const img = new webp.Image();
  const json = {
    "sticker-pack-name": metadata.packname || "https://github.com/bxssdxrk/bxssdxrkUtils",
    "sticker-pack-publisher": metadata.author || "bxssdxrkUtils!",
    "emojis": metadata.emojis || ["🔥", "🇧🇷", ":3", "bxssdxrk", "bxss", "dxrk", "bxssdxrkUtils"],
  };

  const attr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
  const buffer = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([attr, buffer]);
  exif.writeUIntLE(buffer.length, 14, 4);

  await img.load(mediaPath);
  img.exif = exif;
  await img.save(mediaPath);
}

module.exports = {
  convertMediaToSticker,
  convertMediaToStickerC,
  convertMediaToStickerX,
  convertStickerToImage,
  addStickerMetadata,
};