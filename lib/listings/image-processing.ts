export const LISTING_IMAGE_CONFIG = {
  maxPhotos: 8,

  maxInputBytes:
    5 * 1024 * 1024,

  maxDimension: 1920,

  targetBytes:
    600 * 1024,

  hardMaxBytes:
    850 * 1024,

  minQuality: 0.58,

  initialQuality: 0.82,

  allowedInputTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const,

  outputType:
    "image/webp" as const,
};

export type ListingImageErrorCode =
  | "INVALID_TYPE"
  | "INPUT_TOO_LARGE"
  | "IMAGE_DECODE_FAILED"
  | "IMAGE_PROCESSING_FAILED";

export class ListingImageError
  extends Error {
  constructor(
    public code: ListingImageErrorCode,
    message: string
  ) {
    super(message);

    this.name =
      "ListingImageError";
  }
}

function isAllowedInputType(
  type: string
): boolean {
  return (
    LISTING_IMAGE_CONFIG.allowedInputTypes.includes(
      type as never
    )
  );
}

function calculateDimensions(
  width: number,
  height: number
) {
  const maxDimension =
    LISTING_IMAGE_CONFIG.maxDimension;

  if (
    width <= maxDimension &&
    height <= maxDimension
  ) {
    return {
      width,
      height,
    };
  }

  const scale =
    maxDimension /
    Math.max(
      width,
      height
    );

  return {
    width: Math.max(
      1,
      Math.round(
        width * scale
      )
    ),

    height: Math.max(
      1,
      Math.round(
        height * scale
      )
    ),
  };
}

function loadImage(
  file: File
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const url =
        URL.createObjectURL(
          file
        );

      const image =
        new Image();

      image.onload = () => {
        URL.revokeObjectURL(
          url
        );

        resolve(
          image
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          url
        );

        reject(
          new ListingImageError(
            "IMAGE_DECODE_FAILED",
            "Не удалось прочитать изображение."
          )
        );
      };

      image.src = url;
    }
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new ListingImageError(
                "IMAGE_PROCESSING_FAILED",
                "Браузер не смог обработать изображение."
              )
            );

            return;
          }

          resolve(
            blob
          );
        },
        LISTING_IMAGE_CONFIG.outputType,
        quality
      );
    }
  );
}

async function encodeAdaptiveWebP(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  let quality =
    LISTING_IMAGE_CONFIG.initialQuality;

  let blob =
    await canvasToBlob(
      canvas,
      quality
    );

  if (
    blob.size <=
    LISTING_IMAGE_CONFIG.targetBytes
  ) {
    return blob;
  }

  let low =
    LISTING_IMAGE_CONFIG.minQuality;

  let high =
    quality;

  let bestBlob =
    blob;

  for (
    let i = 0;
    i < 6;
    i += 1
  ) {
    const nextQuality =
      (low + high) / 2;

    const nextBlob =
      await canvasToBlob(
        canvas,
        nextQuality
      );

    bestBlob =
      nextBlob;

    if (
      nextBlob.size >
      LISTING_IMAGE_CONFIG.targetBytes
    ) {
      high =
        nextQuality;
    } else {
      low =
        nextQuality;
    }
  }

  if (
    bestBlob.size >
    LISTING_IMAGE_CONFIG.hardMaxBytes
  ) {
    return canvasToBlob(
      canvas,
      LISTING_IMAGE_CONFIG.minQuality
    );
  }

  return bestBlob;
}

export async function processListingImage(
  input: File
): Promise<File> {
  if (
    !isAllowedInputType(
      input.type
    )
  ) {
    throw new ListingImageError(
      "INVALID_TYPE",
      "Поддерживаются только JPG, PNG и WebP."
    );
  }

  if (
    input.size >
    LISTING_IMAGE_CONFIG.maxInputBytes
  ) {
    throw new ListingImageError(
      "INPUT_TOO_LARGE",
      "Исходное изображение не должно превышать 5 МБ."
    );
  }

  try {
    const image =
      await loadImage(
        input
      );

    const dimensions =
      calculateDimensions(
        image.naturalWidth,
        image.naturalHeight
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      dimensions.width;

    canvas.height =
      dimensions.height;

    const context =
      canvas.getContext(
        "2d",
        {
          alpha: false,
        }
      );

    if (!context) {
      throw new ListingImageError(
        "IMAGE_PROCESSING_FAILED",
        "Не удалось создать графический контекст."
      );
    }

    context.imageSmoothingEnabled =
      true;

    context.imageSmoothingQuality =
      "high";

    context.drawImage(
      image,
      0,
      0,
      dimensions.width,
      dimensions.height
    );

    const outputBlob =
      await encodeAdaptiveWebP(
        canvas
      );

    return new File(
      [
        outputBlob,
      ],
      buildOutputFileName(
        input.name
      ),
      {
        type:
          LISTING_IMAGE_CONFIG.outputType,

        lastModified:
          Date.now(),
      }
    );
  } catch (error) {
    if (
      error instanceof
      ListingImageError
    ) {
      throw error;
    }

    throw new ListingImageError(
      "IMAGE_PROCESSING_FAILED",
      "Не удалось обработать изображение."
    );
  }
}

function buildOutputFileName(
  originalName: string
): string {
  const baseName =
    originalName
      .replace(
        /\.[^/.]+$/,
        ""
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-"
      )
      .slice(0, 60);

  return `${
    baseName || "photo"
  }.webp`;
}