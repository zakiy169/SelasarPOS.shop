// Turns the exact receipt preview DOM into the monochrome ESC/POS raster format.
// This keeps the Bluetooth output on the same layout path as the screen preview.

const copyStyles = (source, target) => {
  if (!(source instanceof Element) || !(target instanceof Element)) return;
  const style = window.getComputedStyle(source);
  for (const property of style) target.style.setProperty(property, style.getPropertyValue(property), style.getPropertyPriority(property));
  Array.from(source.children).forEach((child, index) => copyStyles(child, target.children[index]));
};

const imageFromDataUrl = (dataUrl) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = dataUrl;
});

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const inlineImages = async (source, clone) => {
  const sourceImages = source.querySelectorAll('img');
  const cloneImages = clone.querySelectorAll('img');
  await Promise.all(Array.from(sourceImages).map(async (image, index) => {
    const cloneImage = cloneImages[index];
    if (!cloneImage || !image.currentSrc || image.currentSrc.startsWith('data:')) return;
    try {
      const response = await fetch(image.currentSrc);
      if (!response.ok) return;
      cloneImage.src = await blobToDataUrl(await response.blob());
    } catch {
      // If an external logo refuses to load, retain its original source.
    }
  }));
};

export const receiptElementToCanvas = async (element, targetWidth) => {
  if (!element) throw new Error('Preview struk tidak ditemukan. Tutup lalu buka kembali struk ini.');

  const clone = element.cloneNode(true);
  copyStyles(element, clone);
  await inlineImages(element, clone);
  clone.style.margin = '0';
  clone.style.width = `${element.getBoundingClientRect().width}px`;
  clone.style.minWidth = clone.style.width;
  clone.style.maxWidth = clone.style.width;
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  const sourceWidth = Math.ceil(element.getBoundingClientRect().width);
  const sourceHeight = Math.ceil(element.getBoundingClientRect().height);
  if (!sourceWidth || !sourceHeight) throw new Error('Ukuran preview struk belum siap. Coba cetak lagi.');

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sourceWidth}" height="${sourceHeight}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
  const image = await imageFromDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const scale = targetWidth / sourceWidth;
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = Math.ceil(sourceHeight * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
};

// ESC/POS GS v 0 raster image with Floyd-Steinberg dithering.
export const canvasToEscPosRaster = (canvas) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const grayscale = new Float32Array(width * height);
  for (let index = 0; index < grayscale.length; index += 1) {
    const pixel = index * 4;
    const alpha = pixels[pixel + 3] / 255;
    grayscale[index] = (pixels[pixel] * 0.299 + pixels[pixel + 1] * 0.587 + pixels[pixel + 2] * 0.114) * alpha + 255 * (1 - alpha);
  }

  const bytesPerRow = Math.ceil(width / 8);
  const raster = new Uint8Array(bytesPerRow * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldValue = grayscale[index];
      const black = oldValue < 190;
      const newValue = black ? 0 : 255;
      const error = oldValue - newValue;
      if (black) raster[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
      if (x + 1 < width) grayscale[index + 1] += error * 7 / 16;
      if (y + 1 < height) {
        if (x > 0) grayscale[index + width - 1] += error * 3 / 16;
        grayscale[index + width] += error * 5 / 16;
        if (x + 1 < width) grayscale[index + width + 1] += error / 16;
      }
    }
  }

  const command = new Uint8Array(12 + raster.length + 6);
  command.set([0x1b, 0x40, 0x1b, 0x61, 0x00, 0x1d, 0x76, 0x30], 0);
  command[8] = bytesPerRow & 0xff;
  command[9] = (bytesPerRow >> 8) & 0xff;
  command[10] = height & 0xff;
  command[11] = (height >> 8) & 0xff;
  command.set(raster, 12);
  command.set([0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00], 12 + raster.length);
  return command;
};
