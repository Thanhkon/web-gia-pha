import { GALLERY_UPLOAD_LIMITS, MEDIA_TYPE } from '../types/gallery';

export function getMediaType(file) {
  if (GALLERY_UPLOAD_LIMITS.imageTypes.includes(file.type)) return MEDIA_TYPE.IMAGE;
  if (GALLERY_UPLOAD_LIMITS.videoTypes.includes(file.type)) return MEDIA_TYPE.VIDEO;
  return null;
}

export function bytesToMb(size) {
  return Math.round((size / 1024 / 1024) * 10) / 10;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không thể đọc tệp ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Không thể xử lý ảnh ${file.name}.`));
    };
    image.src = objectUrl;
  });
}

export function drawImageToCanvas(image, maxDimension) {
  const longestSide = Math.max(image.width, image.height);
  const ratio = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Trình duyệt không hỗ trợ nền ảnh.');
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas;
}

export async function createUploadDataUrl(file) {
  const mediaType = getMediaType(file);

  if (mediaType !== MEDIA_TYPE.IMAGE) {
    throw new Error(`${file.name}: video cần API upload file riêng, hiện chưa hỗ trợ gửi qua JSON.`);
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  if (originalDataUrl.length <= GALLERY_UPLOAD_LIMITS.apiJsonPayloadBudget) {
    return originalDataUrl;
  }

  const image = await loadImage(file);
  const dimensions = [
    GALLERY_UPLOAD_LIMITS.imageMaxDimension,
    960,
    720,
    540,
    420,
    320,
  ];
  const qualities = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34];

  for (const maxDimension of dimensions) {
    const canvas = drawImageToCanvas(image, maxDimension);

    for (const quality of qualities) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      if (dataUrl.length <= GALLERY_UPLOAD_LIMITS.apiJsonPayloadBudget) {
        return dataUrl;
      }
    }
  }

  throw new Error(`${file.name}: ảnh quá lớn để gửi bằng API hiện tại. Hãy chọn ảnh nhỏ hơn hoặc cần backend upload file thật.`);
}

export function validateMediaFiles(files) {
  const items = Array.from(files || []);

  if (items.length === 0) {
    return ['Vui lòng chọn ít nhất một tệp ảnh.'];
  }

  if (items.length > GALLERY_UPLOAD_LIMITS.maxFilesPerUpload) {
    return [`Chỉ được tải tối đa ${GALLERY_UPLOAD_LIMITS.maxFilesPerUpload} tệp trong một lần.`];
  }

  return items.flatMap((file) => {
    const mediaType = getMediaType(file);
    if (!mediaType) {
      return [`${file.name}: định dạng không hợp lệ. Chỉ hỗ trợ JPG, JPEG, PNG, WEBP.`];
    }

    if (mediaType === MEDIA_TYPE.VIDEO) {
      return [`${file.name}: video chưa hỗ trợ tải lên với API hiện tại. Cần backend upload multipart/storage trước.`];
    }

    const maxSize = GALLERY_UPLOAD_LIMITS.maxImageSize;

    if (file.size > maxSize) {
      return [`${file.name}: dung lượng ${bytesToMb(file.size)} MB vượt giới hạn 10 MB.`];
    }

    return [];
  });
}
