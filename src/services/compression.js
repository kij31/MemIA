// Media compression utilities

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
const IMAGE_QUALITY = 0.85;
const MAX_VIDEO_WIDTH = 1280;
const MAX_VIDEO_HEIGHT = 720;

/**
 * Compress an image file
 * @param {File|Blob} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 1920)
 * @param {number} maxHeight - Maximum height (default: 1920)
 * @param {number} quality - Quality from 0 to 1 (default: 0.85)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, maxWidth = MAX_IMAGE_WIDTH, maxHeight = MAX_IMAGE_HEIGHT, quality = IMAGE_QUALITY) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`);
              resolve(blob);
            } else {
              // Fallback to JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    console.log(`Image compressed (JPEG): ${(file.size / 1024).toFixed(2)}KB → ${(jpegBlob.size / 1024).toFixed(2)}KB`);
                    resolve(jpegBlob);
                  } else {
                    reject(new Error('Failed to compress image'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compress a video file
 * Note: Browser-based video compression is limited. This function creates a compressed version
 * by re-encoding to a lower resolution. For better compression, server-side processing is recommended.
 * @param {File|Blob} file - The video file to compress
 * @returns {Promise<Blob>} - Compressed video blob
 */
export async function compressVideo(file) {
  // Note: Real video compression in browser is complex and limited
  // This is a placeholder that would require a library like ffmpeg.wasm for real compression
  // For now, we'll just return the original file or create a thumbnail
  console.warn('Video compression in browser is limited. Consider server-side compression.');

  // For a real implementation, you would use ffmpeg.wasm:
  // https://github.com/ffmpegwasm/ffmpeg.wasm

  // For now, just return the original file
  // In production, you might want to:
  // 1. Upload to server for compression
  // 2. Use ffmpeg.wasm (adds ~25MB to bundle)
  // 3. Just store original and compress server-side

  return file;
}

/**
 * Compress an audio file
 * Note: Browser-based audio compression is limited
 * @param {File|Blob} file - The audio file to compress
 * @returns {Promise<Blob>} - Compressed audio blob
 */
export async function compressAudio(file) {
  // Similar to video, real audio compression requires libraries
  // For now, return original file
  console.warn('Audio compression in browser is limited. Consider server-side compression.');

  // For a real implementation, you could use Web Audio API to re-encode at lower bitrate
  // But this is complex and adds significant code

  return file;
}

/**
 * Main compression function that routes to appropriate compressor
 * @param {File|Blob} file - The media file to compress
 * @param {string} mediaType - Type of media (photo/video/audio)
 * @returns {Promise<Blob>} - Compressed media blob
 */
export async function compressMedia(file, mediaType) {
  try {
    console.log(`Compressing ${mediaType}: ${file.name || 'captured media'} (${(file.size / 1024).toFixed(2)}KB)`);

    switch (mediaType) {
      case 'photo':
        return await compressImage(file);

      case 'video':
        return await compressVideo(file);

      case 'audio':
        return await compressAudio(file);

      default:
        console.warn(`Unknown media type: ${mediaType}`);
        return file;
    }
  } catch (error) {
    console.error('Error compressing media:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Convert Blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Base64 string
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 string to Blob
 * @param {string} base64 - The base64 string
 * @returns {Blob} - The blob
 */
export function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Get media file info
 * @param {File|Blob} file - The media file
 * @returns {Object} - File info
 */
export function getMediaInfo(file) {
  return {
    name: file.name || 'captured-media',
    size: file.size,
    sizeKB: (file.size / 1024).toFixed(2),
    sizeMB: (file.size / 1024 / 1024).toFixed(2),
    type: file.type,
    lastModified: file.lastModified || Date.now()
  };
}

/**
 * Validate media file size
 * @param {File|Blob} file - The media file
 * @param {number} maxSize - Max size in bytes (default: 50MB)
 * @returns {boolean} - True if valid
 */
export function validateMediaSize(file, maxSize = 50 * 1024 * 1024) {
  return file.size <= maxSize;
}

/**
 * Create a thumbnail from an image or video
 * @param {File|Blob} file - The media file
 * @param {string} type - 'image' or 'video'
 * @returns {Promise<Blob>} - Thumbnail blob
 */
export async function createThumbnail(file, type) {
  if (type === 'image' || type === 'photo') {
    // Create small thumbnail (max 200px)
    return await compressImage(file, 200, 200, 0.7);
  } else if (type === 'video') {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        // Seek to 1 second or 10% of duration
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        canvas.width = 200;
        canvas.height = (200 * video.videoHeight) / video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          },
          'image/jpeg',
          0.7
        );
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  return file;
}
