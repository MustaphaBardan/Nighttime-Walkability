import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});
const OUTPUTS = [
  {
    input: "assets/images/Test_image_panoramic.png",
    variants: [
      { width: 4096, height: 2048, output: "assets/images/Test_image_panoramic_4k.png" },
    ],
  },
];

for (const job of OUTPUTS) {
  const source = decodePng(readFileSync(job.input));

  for (const variant of job.variants) {
    const resized = resizeBox(source, variant.width, variant.height);
    writeFileSync(variant.output, encodePng(resized));
    console.log(`Generated ${variant.output} from ${basename(job.input)}`);
  }
}

function decodePng(buffer) {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("Input is not a PNG file.");
  }

  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const data = buffer.subarray(dataStart, dataStart + length);
    offset = dataStart + length + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error("Only 8-bit RGB or RGBA PNG panoramas are supported.");
  }

  const channels = colorType === 6 ? 4 : 3;
  const bytesPerPixel = channels;
  const stride = width * channels;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.allocUnsafe(width * height * 4);
  let readOffset = 0;
  let previous = Buffer.alloc(stride);
  let current = Buffer.allocUnsafe(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[readOffset];
    readOffset += 1;
    const row = inflated.subarray(readOffset, readOffset + stride);
    readOffset += stride;
    unfilterScanline(filter, row, current, previous, bytesPerPixel);
    copyRowToRgba(current, pixels, y * width * 4, channels);
    const nextPrevious = current;
    current = previous;
    previous = nextPrevious;
  }

  return { width, height, pixels };
}

function unfilterScanline(filter, row, current, previous, bytesPerPixel) {
  for (let index = 0; index < row.length; index += 1) {
    const left = index >= bytesPerPixel ? current[index - bytesPerPixel] : 0;
    const up = previous[index] || 0;
    const upperLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] || 0 : 0;
    let predictor = 0;

    if (filter === 1) {
      predictor = left;
    } else if (filter === 2) {
      predictor = up;
    } else if (filter === 3) {
      predictor = Math.floor((left + up) / 2);
    } else if (filter === 4) {
      predictor = paeth(left, up, upperLeft);
    } else if (filter !== 0) {
      throw new Error(`Unsupported PNG filter: ${filter}`);
    }

    current[index] = (row[index] + predictor) & 255;
  }
}

function copyRowToRgba(row, pixels, targetOffset, channels) {
  if (channels === 4) {
    row.copy(pixels, targetOffset);
    return;
  }

  for (let source = 0, target = targetOffset; source < row.length; source += 3, target += 4) {
    pixels[target] = row[source];
    pixels[target + 1] = row[source + 1];
    pixels[target + 2] = row[source + 2];
    pixels[target + 3] = 255;
  }
}

function resizeBox(source, targetWidth, targetHeight) {
  const scaleX = source.width / targetWidth;
  const scaleY = source.height / targetHeight;

  if (!Number.isInteger(scaleX) || !Number.isInteger(scaleY) || scaleX < 1 || scaleY < 1) {
    throw new Error("The built-in optimizer expects integer downscales such as 8K to 4K or 2K.");
  }

  const pixels = Buffer.allocUnsafe(targetWidth * targetHeight * 4);
  const sampleCount = scaleX * scaleY;

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;

      for (let sampleY = 0; sampleY < scaleY; sampleY += 1) {
        const sourceY = y * scaleY + sampleY;

        for (let sampleX = 0; sampleX < scaleX; sampleX += 1) {
          const sourceX = x * scaleX + sampleX;
          const sourceOffset = (sourceY * source.width + sourceX) * 4;
          red += source.pixels[sourceOffset];
          green += source.pixels[sourceOffset + 1];
          blue += source.pixels[sourceOffset + 2];
          alpha += source.pixels[sourceOffset + 3];
        }
      }

      const targetOffset = (y * targetWidth + x) * 4;
      pixels[targetOffset] = Math.round(red / sampleCount);
      pixels[targetOffset + 1] = Math.round(green / sampleCount);
      pixels[targetOffset + 2] = Math.round(blue / sampleCount);
      pixels[targetOffset + 3] = Math.round(alpha / sampleCount);
    }
  }

  return { width: targetWidth, height: targetHeight, pixels };
}

function encodePng(image) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", deflateSync(filterScanlines(image), { level: 9 })),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function filterScanlines(image) {
  const stride = image.width * 4;
  const filtered = Buffer.allocUnsafe((stride + 1) * image.height);
  const candidates = Array.from({ length: 5 }, () => Buffer.allocUnsafe(stride));

  for (let y = 0; y < image.height; y += 1) {
    const row = image.pixels.subarray(y * stride, (y + 1) * stride);
    const previous = y > 0 ? image.pixels.subarray((y - 1) * stride, y * stride) : null;
    let bestFilter = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let filter = 0; filter < candidates.length; filter += 1) {
      const score = applyFilter(filter, row, previous, candidates[filter]);

      if (score < bestScore) {
        bestScore = score;
        bestFilter = filter;
      }
    }

    const outputOffset = y * (stride + 1);
    filtered[outputOffset] = bestFilter;
    candidates[bestFilter].copy(filtered, outputOffset + 1);
  }

  return filtered;
}

function applyFilter(filter, row, previous, output) {
  let score = 0;

  for (let index = 0; index < row.length; index += 1) {
    const left = index >= 4 ? row[index - 4] : 0;
    const up = previous ? previous[index] : 0;
    const upperLeft = previous && index >= 4 ? previous[index - 4] : 0;
    let predictor = 0;

    if (filter === 1) {
      predictor = left;
    } else if (filter === 2) {
      predictor = up;
    } else if (filter === 3) {
      predictor = Math.floor((left + up) / 2);
    } else if (filter === 4) {
      predictor = paeth(left, up, upperLeft);
    }

    const value = (row[index] - predictor) & 255;
    output[index] = value;
    score += value < 128 ? value : 256 - value;
  }

  return score;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(left, up, upperLeft) {
  const prediction = left + up - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upperLeftDistance = Math.abs(prediction - upperLeft);

  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) {
    return left;
  }

  if (upDistance <= upperLeftDistance) {
    return up;
  }

  return upperLeft;
}
