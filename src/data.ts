import siteData from "../data/site.json";
import aboutData from "../data/about.json";
import contactData from "../data/contact.json";
import paintingsCurrentData from "../data/paintings-current.json";
import paintingsEarlyData from "../data/paintings-early.json";
import drawingsCurrentData from "../data/drawings-current.json";
import drawingsEarlyData from "../data/drawings-early.json";
import artworksData from "../data/artworks.json";

export interface Artwork {
  id: number;
  title: string;
  year: number | null;
  medium: string;
  dimensions: string;
  framedDimensions: string | null;
  framed: boolean;
  price: number | null;
  image: {
    file_name: string;
    alt: string;
    width: number;
    height: number;
  } | null;
  display: boolean;
  private: boolean;
}

export interface PageData {
  slug: string;
  period?: string;
  title: string;
  artworks: Artwork[];
}

interface PageDataFile {
  slug: string;
  period: string;
  title: string;
  artworks: number[];
}

export interface SiteData {
  title: string;
  description: string;
  navigation: Array<{
    name: string;
    href: string;
  }>;
  footer: {
    email: string;
    instagram: {
      url: string;
      icon: string;
    };
  };
}

export interface AboutData {
  title: string;
  description: string[];
  interview: {
    text: string;
    url: string;
  };
  timeline: Array<{
    year: string;
    description: string;
  }>;
}

export interface ContactData {
  title: string;
  description: string[];
  email: string;
  instagram: {
    url: string;
    handle: string;
  };
}

export function loadSiteData(): SiteData {
  return siteData as SiteData;
}

export function loadAboutData(): AboutData {
  return aboutData as AboutData;
}

export function loadContactData(): ContactData {
  return contactData as ContactData;
}

export function loadPageData(slug: string, period: string): PageData | null {
  const key = `${slug}-${period}` as keyof typeof pageDataMap;
  const data = pageDataMap[key];
  if (!data) return null;

  // Load full artwork data from artworks.json using the ID references
  const artworks = data.artworks
    .map(
      (artworkId) =>
        artworksData[artworkId.toString() as keyof typeof artworksData]
    )
    .filter((artwork) => artwork !== undefined)
    .map((artwork) => artwork as Artwork);

  return {
    slug: data.slug,
    period: data.period,
    title: data.title,
    artworks,
  };
}

export function loadArtwork(id: string): Artwork | null {
  const artwork = artworksData[id as keyof typeof artworksData];
  return artwork ? ({ ...artwork } as Artwork) : null;
}

export function loadAllArtworks(): Record<string, Artwork> {
  return { ...artworksData } as Record<string, Artwork>;
}

const pageDataMap = {
  "paintings-current": paintingsCurrentData as PageDataFile,
  "paintings-early": paintingsEarlyData as PageDataFile,
  "drawings-current": drawingsCurrentData as PageDataFile,
  "drawings-early": drawingsEarlyData as PageDataFile,
};

export function getValidSlugs(): string[] {
  return ["paintings", "drawings"];
}

export function getValidPeriods(): string[] {
  return ["current", "early"];
}

export function isValidSlugPeriod(slug: string, period: string): boolean {
  return getValidSlugs().includes(slug) && getValidPeriods().includes(period);
}

export function formatDimensions(dimensions: string): string {
  return (
    dimensions
      .split("x")
      .map((dim) => `${dim.trim()}`)
      .join(" x ") + "mm"
  );
}

export function formatPrice(price: number | null): string {
  if (price === null) return "Contact for pricing";
  if (price === -1) return "Sold";
  return `$${price.toLocaleString()}`;
}

export function getDimensionDetails(artwork: Artwork): string {
  let result = "";
  if (artwork.framedDimensions) {
    result = `Image ${formatDimensions(
      artwork.dimensions
    )}\nFrame ${formatDimensions(artwork.framedDimensions)}`;
  } else if (artwork.framed) {
    result = `Image ${formatDimensions(artwork.dimensions)}\nFramed`;
  } else {
    result = `Image ${formatDimensions(artwork.dimensions)}\nUnframed`;
  }
  return result;
}

export function getImageUrl(
  fileName: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  }
): string {
  const baseUrl = "https://image.janeperryartist.co.nz";

  if (!options) {
    // Use Cloudflare Image Resizing with default optimization
    return `${baseUrl}/cdn-cgi/image/format=auto,quality=85/${fileName}`;
  }

  // Build comma-separated transformation options (Cloudflare Images format)
  const params: string[] = ["format=auto", "onerror=redirect"];

  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.quality) params.push(`quality=${options.quality}`);
  if (options.fit) params.push(`fit=${options.fit}`);

  return `${baseUrl}/cdn-cgi/image/${params.join(",")}/${fileName}`;
}

export function getResponsiveImageUrls(
  fileName: string,
  options?: {
    quality?: number;
    fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  }
): {
  src: string;
  srcset: string;
  sizes: string;
} {
  const baseUrl = "https://image.janeperryartist.co.nz";
  const widths = [320, 640, 960, 1280, 2560];
  const defaultQuality = options?.quality || 85;
  const fit = options?.fit || "scale-down";

  const srcsetUrls = widths
    .map((width) => {
      const params = `format=auto,quality=${defaultQuality},fit=${fit},width=${width}`;
      return `${baseUrl}/cdn-cgi/image/${params}/${fileName} ${width}w`;
    })
    .join(", ");

  // Default src for fallback (960px width)
  const defaultParams = `format=auto,quality=${defaultQuality},fit=${fit},width=960`;
  const defaultSrc = `${baseUrl}/cdn-cgi/image/${defaultParams}/${fileName}`;

  // Default sizes attribute for responsive behavior
  const sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw";

  return {
    src: defaultSrc,
    srcset: srcsetUrls,
    sizes,
  };
}
