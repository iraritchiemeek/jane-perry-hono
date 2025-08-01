import { getImageUrl } from "../../data";

interface ResponsiveImageProps {
  fileName: string;
  alt: string;
  className?: string;
  variant?: "thumbnail" | "detail";
}

const BREAKPOINTS = [480, 640, 828, 1080, 1200, 1920];

export const ResponsiveImage = ({
  fileName,
  alt,
  className = "",
  variant = "thumbnail",
}: ResponsiveImageProps) => {
  // Different settings for thumbnails vs detail views
  const isDetail = variant === "detail";
  const quality = isDetail ? 75 : 65;
  const fit = isDetail ? "contain" : "cover";
  const loading = isDetail ? "eager" : "lazy";
  const sizes = isDetail
    ? "(max-width: 768px) 100vw, 66vw"
    : "(max-width: 768px) 100vw, (max-width: 1200px) 400px, 360px";

  // Generate srcset
  const srcSet = BREAKPOINTS.map(
    (width) => `${getImageUrl(fileName, { width, quality, fit })} ${width}w`
  ).join(", ");

  // Default src - use smaller size for thumbnails
  const defaultWidth = isDetail ? 1200 : 640;
  const src = getImageUrl(fileName, { width: defaultWidth, quality, fit });

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      // Debug attributes - inspect in DevTools
      data-variant={variant}
      data-default-src-width={defaultWidth}
      data-breakpoints={BREAKPOINTS.join(',')}
    />
  );
};
