export interface ProcessedImage {
  file: File;
  width: number;
  height: number;
  size_bytes: number;
  previewUrl: string;
}

export const processImage = async (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Max dimensions
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

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
        return reject(new Error('Failed to get canvas context'));
      }

      // Draw and strip EXIF implicitly by drawing to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP
      // 0.8 is a good balance between quality and compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Failed to create WebP blob'));
          }

          // Create a new File from the Blob
          const originalName = file.name.split('.')[0];
          const newFile = new File([blob], `${originalName}.webp`, {
            type: 'image/webp',
          });

          resolve({
            file: newFile,
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
      reject(new Error('Failed to load image for processing'));
    };

    img.src = objectUrl;
  });
};
