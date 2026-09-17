const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
  // Create RGBA buffer
  const width = size;
  const height = size;
  const buffer = Buffer.alloc(width * height * 4);

  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  // Simple bolt polygon coordinates normalized (0..1)
  const bolt = [
    [0.56, 0.12],
    [0.22, 0.56],
    [0.48, 0.56],
    [0.44, 0.88],
    [0.78, 0.44],
    [0.52, 0.44]
  ];

  function pointInPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0] * size, yi = poly[i][1] * size;
      const xj = poly[j][0] * size, yj = poly[j][1] * size;
      const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function inRoundedRect(x, y, w, h, r) {
    if (x < r && y < r) return Math.hypot(x - r, y - r) <= r;
    if (x > w - r && y < r) return Math.hypot(x - (w - r), y - r) <= r;
    if (x < r && y > h - r) return Math.hypot(x - r, y - (h - r)) <= r;
    if (x > w - r && y > h - r) return Math.hypot(x - (w - r), y - (h - r)) <= r;
    return x >= 0 && x <= w && y >= 0 && y <= h;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (!inRoundedRect(x, y, width, height, radius)) {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
        continue;
      }

      // Purple gradient
      const gradRatio = (x + y) / (width + height);
      const r = Math.round(79 + (147 - 79) * gradRatio);
      const g = Math.round(70 + (51 - 70) * gradRatio);
      const b = Math.round(229 + (234 - 229) * gradRatio);

      if (pointInPolygon(x, y, bolt)) {
        // Bolt White
        buffer[idx] = 255;
        buffer[idx + 1] = 255;
        buffer[idx + 2] = 255;
        buffer[idx + 3] = 255;
      } else {
        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
        buffer[idx + 3] = 255;
      }
    }
  }

  // Encode as PNG
  return buildPng(width, height, buffer);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ (-1)) >>> 0;
}

function buildPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowLen = width * 4;
  const rawData = Buffer.alloc(height * (rowLen + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (rowLen + 1)] = 0; // Filter None
    rgbaBuffer.copy(rawData, y * (rowLen + 1) + 1, y * rowLen, (y + 1) * rowLen);
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = chunk.subarray(4, 8 + len);
  const crc = crc32(toCrc);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach(size => {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png`);
});
