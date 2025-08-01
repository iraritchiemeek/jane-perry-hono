import siteData from '../data/site.json'
import aboutData from '../data/about.json'
import contactData from '../data/contact.json'
import paintingsCurrentData from '../data/paintings-current.json'
import paintingsEarlyData from '../data/paintings-early.json'
import drawingsCurrentData from '../data/drawings-current.json'
import drawingsEarlyData from '../data/drawings-early.json'
import artworksData from '../data/artworks.json'

export interface Artwork {
  id: number
  title: string
  year: number
  medium: string
  dimensions: string
  framedDimensions: string | null
  framed: boolean
  price: number
  image: {
    file_name: string
    alt: string
    width: number
    height: number
  } | null
  display: boolean
  private: boolean
}

export interface PageData {
  slug: string
  period?: string
  title: string
  artworks: Artwork[]
}

interface PageDataFile {
  slug: string
  period: string
  title: string
  artworks: number[]
}

export interface SiteData {
  title: string
  description: string
  navigation: Array<{
    name: string
    href: string
  }>
  footer: {
    email: string
    instagram: {
      url: string
      icon: string
    }
  }
}

export interface AboutData {
  title: string
  description: string[]
  interview: {
    text: string
    url: string
  }
  timeline: Array<{
    year: string
    description: string
  }>
}

export interface ContactData {
  title: string
  description: string[]
  email: string
  instagram: {
    url: string
    handle: string
  }
}

export function loadSiteData(): SiteData {
  return siteData as SiteData
}

export function loadAboutData(): AboutData {
  return aboutData as AboutData
}

export function loadContactData(): ContactData {
  return contactData as ContactData
}

export function loadPageData(slug: string, period: string): PageData | null {
  const key = `${slug}-${period}` as keyof typeof pageDataMap
  const data = pageDataMap[key]
  if (!data) return null
  
  // Load full artwork data from artworks.json using the ID references
  const artworks = data.artworks
    .map(artworkId => artworksData[artworkId.toString() as keyof typeof artworksData])
    .filter((artwork): artwork is Artwork => artwork !== undefined)
  
  return {
    slug: data.slug,
    period: data.period,
    title: data.title,
    artworks
  }
}

export function loadArtwork(id: string): Artwork | null {
  const artwork = artworksData[id as keyof typeof artworksData]
  return artwork ? { ...artwork } : null
}

export function loadAllArtworks(): Record<string, Artwork> {
  return { ...artworksData }
}

const pageDataMap = {
  'paintings-current': paintingsCurrentData as PageDataFile,
  'paintings-early': paintingsEarlyData as PageDataFile,
  'drawings-current': drawingsCurrentData as PageDataFile,
  'drawings-early': drawingsEarlyData as PageDataFile,
}

export function getValidSlugs(): string[] {
  return ['paintings', 'drawings']
}

export function getValidPeriods(): string[] {
  return ['current', 'early']
}

export function isValidSlugPeriod(slug: string, period: string): boolean {
  return getValidSlugs().includes(slug) && getValidPeriods().includes(period)
}

export function formatDimensions(dimensions: string): string {
  return dimensions.split('x').map(dim => `${dim.trim()}`).join(' x ') + 'mm'
}

export function formatPrice(price: number): string {
  if (price === -1) return 'Sold'
  return `$${price.toLocaleString()}`
}

export function getDimensionDetails(artwork: Artwork): string {
  let result = ''
  if (artwork.framedDimensions) {
    result = `Image ${formatDimensions(artwork.dimensions)}\nFrame ${formatDimensions(artwork.framedDimensions)}`
  } else if (artwork.framed) {
    result = `Image ${formatDimensions(artwork.dimensions)}\nFramed`
  } else {
    result = `Image ${formatDimensions(artwork.dimensions)}\nUnframed`
  }
  return result
}

export function getImageUrl(fileName: string): string {
  const baseUrl = 'https://pub-2d1102fe4474488abe8682f618a8222f.r2.dev'
  return `${baseUrl}/${fileName}`
}