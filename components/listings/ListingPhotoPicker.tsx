"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LISTING_IMAGE_CONFIG,
  ListingImageError,
  processListingImage,
} from "@/lib/listings/image-processing";

export interface ListingDraftPhoto {
  id: string;
  file: File;
  previewUrl: string;
  size: number;
}

interface ListingPhotoPickerProps {
  photos: ListingDraftPhoto[];

  onChange: (
    photos: ListingDraftPhoto[]
  ) => void;

  disabled?: boolean;
}

export default function ListingPhotoPicker({
  photos,
  onChange,
  disabled = false,
}: ListingPhotoPickerProps) {
  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    return () => {
      photos.forEach(
        (photo) => {
          URL.revokeObjectURL(
            photo.previewUrl
          );
        }
      );
    };
  }, [photos]);

  const remaining =
    LISTING_IMAGE_CONFIG.maxPhotos -
    photos.length;

  const totalSize =
    useMemo(
      () =>
        photos.reduce(
          (
            total,
            photo
          ) =>
            total +
            photo.size,
          0
        ),
      [photos]
    );

  const totalSizeLabel =
    formatBytes(
      totalSize
    );

  const handleFiles =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const selected =
        Array.from(
          event.target.files ??
            []
        );

      /*
       * Позволяем браузеру
       * повторно выбрать тот же файл.
       */
      event.target.value =
        "";

      if (
        selected.length ===
        0
      ) {
        return;
      }

      if (remaining <= 0) {
        setError(
          `Можно добавить максимум ${LISTING_IMAGE_CONFIG.maxPhotos} фотографий.`
        );

        return;
      }

      setError(null);
      setProcessing(
        true
      );

      const batch =
        selected.slice(
          0,
          remaining
        );

      const processed: ListingDraftPhoto[] =
        [];

      const errors: string[] =
        [];

      try {
        /*
         * Последовательно,
         * чтобы не загрузить CPU/Memory
         * несколькими большими изображениями
         * одновременно.
         */
        for (
          const file of batch
        ) {
          try {
            const processedFile =
              await processListingImage(
                file
              );

            const photo: ListingDraftPhoto =
              {
                id: crypto.randomUUID(),

                file:
                  processedFile,

                previewUrl:
                  URL.createObjectURL(
                    processedFile
                  ),

                size:
                  processedFile.size,
              };

            processed.push(
              photo
            );
          } catch (error) {
            if (
              error instanceof
              ListingImageError
            ) {
              errors.push(
                `${file.name}: ${error.message}`
              );
            } else {
              errors.push(
                `${file.name}: не удалось обработать изображение`
              );
            }
          }
        }

        if (
          processed.length > 0
        ) {
          onChange([
            ...photos,
            ...processed,
          ]);
        }

        if (
          errors.length > 0
        ) {
          setError(
            errors.join(
              "\n"
            )
          );
        }
      } finally {
        setProcessing(
          false
        );
      }
    };

  const handleRemove =
    (id: string) => {
      const target =
        photos.find(
          (photo) =>
            photo.id === id
        );

      if (target) {
        URL.revokeObjectURL(
          target.previewUrl
        );
      }

      onChange(
        photos.filter(
          (photo) =>
            photo.id !== id
        )
      );
    };

  const movePhoto = (
    index: number,
    direction:
      | "left"
      | "right"
  ) => {
    const nextIndex =
      direction ===
      "left"
        ? index - 1
        : index + 1;

    if (
      nextIndex < 0 ||
      nextIndex >=
        photos.length
    ) {
      return;
    }

    const next =
      [...photos];

    [
      next[index],
      next[nextIndex],
    ] = [
      next[nextIndex],
      next[index],
    ];

    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[12px] font-semibold text-white/70">
          Фотографии
        </div>

        <div className="mt-1 text-[11px] leading-5 text-white/30">
          До{" "}
          {
            LISTING_IMAGE_CONFIG.maxPhotos
          }{" "}
          фото. Исходники автоматически
          сжимаются и сохраняются в WebP.
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.018] px-3 py-2.5">
        <span className="text-[11px] text-white/40">
          {photos.length} /{" "}
          {
            LISTING_IMAGE_CONFIG.maxPhotos
          }
        </span>

        <span className="text-[10px] text-white/25">
          {totalSizeLabel} после сжатия
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {photos.map(
          (
            photo,
            index
          ) => (
            <div
              key={
                photo.id
              }
              className="group relative aspect-square overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.025]"
            >
              <img
                src={
                  photo.previewUrl
                }
                alt=""
                className="h-full w-full object-cover"
              />

              {/* Cover */}
              {index ===
                0 && (
                <div className="absolute left-2 top-2 rounded-full bg-[#6FC9C2] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-[#0a0f14]">
                  Обложка
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent p-2 pt-8 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={
                      index ===
                      0
                    }
                    onClick={() =>
                      movePhoto(
                        index,
                        "left"
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-[12px] text-white/80 disabled:opacity-20"
                    aria-label="Переместить влево"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    disabled={
                      index ===
                      photos.length -
                        1
                    }
                    onClick={() =>
                      movePhoto(
                        index,
                        "right"
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-[12px] text-white/80 disabled:opacity-20"
                    aria-label="Переместить вправо"
                  >
                    →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleRemove(
                      photo.id
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/70 text-[12px] text-white"
                  aria-label="Удалить"
                >
                  ×
                </button>
              </div>

              {/* Order */}
              <div className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[10px] font-semibold text-white/80">
                {index +
                  1}
              </div>
            </div>
          )
        )}

        {/* Add */}
        {remaining >
          0 && (
          <label
            className={[
              "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-white/[0.12] bg-white/[0.018] transition",
              disabled ||
              processing
                ? "cursor-not-allowed opacity-40"
                : "hover:border-[#6FC9C2]/50 hover:bg-[#6FC9C2]/5",
            ].join(" ")}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={
                disabled ||
                processing
              }
              onChange={
                handleFiles
              }
              className="hidden"
            />

            <span className="text-[26px] leading-none text-[#6FC9C2]">
              {processing
                ? "…"
                : "+"}
            </span>

            <span className="mt-2 text-[11px] font-medium text-white/50">
              {processing
                ? "Обработка…"
                : "Добавить"}
            </span>

            <span className="mt-1 text-[9px] text-white/20">
              осталось{" "}
              {remaining}
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="whitespace-pre-line rounded-[10px] border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-[11px] leading-5 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}

function formatBytes(
  bytes: number
): string {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(0)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}