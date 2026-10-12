export interface ProcessedImage {
  file: File;
  width: number;
  height: number;
  size_bytes: number;
  previewUrl: string;
}

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_SOURCE_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

/**
 * Validates that the given blob contains genuine WebP binary magic bytes:
 * - Bytes 0..3: ASCII "RIFF" (0x52, 0x49, 0x46, 0x46)
 * - Bytes 8..11: ASCII "WEBP" (0x57, 0x45, 0x42, 0x50)
 */
export const isValidWebP = async (blob: Blob): Promise<boolean> => {
  if (!blob || blob.size < 12) {
    return false;
  }
  try {
    const headerBuffer = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);
    const isRiff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;
    const isWebp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;
    return isRiff && isWebp;
  } catch {
    return false;
  }
};

/**
 * Processes an input image:
 * 1. Validates file size (max 5MB) and MIME type (JPEG, PNG, WebP).
 * 2. Draws image to canvas, resizing down if exceeding 1200x1200 while preserving aspect ratio.
 * 3. Strips EXIF metadata implicitly by drawing onto canvas.
 * 4. Converts to WebP format with 0.8 quality setting.
 * 5. Verifies canvas didn't fall back to PNG and verifies genuine WebP magic bytes.
 * 6. Generates a clean .webp filename and returns a processed WebP File object.
 */
export const processImage = async (file: File): Promise<ProcessedImage> => {
  if (!file) {
    throw new Error('No file provided');
  }

  // 1. File size validation (5MB max)
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`ഫയൽ 5MB-യിൽ കൂടുതലാണ് (${sizeMB}MB). ദയവായി ചെറിയ ഫോട്ടോ തിരഞ്ഞെടുക്കുക. (File exceeds 5MB limit)`);
  }

  // 2. MIME type validation
  const lowerMime = (file.type || '').toLowerCase();
  if (!SUPPORTED_SOURCE_IMAGE_TYPES.includes(lowerMime)) {
    throw new Error(`പിന്തുണയ്ക്കാത്ത ഫയൽ ഫോർമാറ്റ് (${file.type || 'unknown'}). JPG, PNG, WebP ഫയലുകൾ മാത്രം ചേർക്കുക. (Only JPG, PNG, WebP supported)`);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Max dimensions (1200x1200)
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width <= 0 || height <= 0) {
        return reject(new Error('ചിത്രത്തിന്റെ അളവുകൾ അസാധുവാണ്. (Invalid image dimensions)'));
      }

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas 2D context'));
      }

      // Draw and strip EXIF implicitly by drawing to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP (0.8 quality setting)
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            return reject(new Error('WebP ഫോർമാറ്റിലേക്ക് മാറ്റാൻ കഴിഞ്ഞില്ല. (Failed to create WebP blob)'));
          }

          // Verify browser canvas didn't silently fall back to PNG
          if (blob.type !== 'image/webp') {
            return reject(new Error(`ബ്രൗസർ WebP പിന്തുണയ്ക്കുന്നില്ല (${blob.type}). (Browser failed WebP export)`));
          }

          // Verify genuine WebP magic bytes in binary header
          const hasValidWebPHeader = await isValidWebP(blob);
          if (!hasValidWebPHeader) {
            return reject(new Error('WebP പരിശോധന പരാജയപ്പെട്ടു: അസാധുവായ ഡാറ്റ. (Invalid WebP binary data)'));
          }

          // Generate clean stem and .webp extension
          const originalStem = file.name.replace(/\.[^/.]+$/, '').trim() || 'item-image';
          const safeStem = originalStem.replace(/[^a-zA-Z0-9_-]/g, '_');
          const webpFileName = `${safeStem}.webp`;

          const webpFile = new File([blob], webpFileName, {
            type: 'image/webp',
          });

          resolve({
            file: webpFile,
            width,
            height,
            size_bytes: blob.size,
            previewUrl: URL.createObjectURL(blob)
          });
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`ഫോട്ടോ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല: "${file.name}". ഫയൽ തകരാറിലായിരിക്കാം. (Failed to load image)`));
    };

    img.src = objectUrl;
  });
};
