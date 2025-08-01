/**
 * Cloudflare Image Optimization Worker
 * 
 * Handles:
 * - Dynamic image resizing via URL parameters
 * - Format optimization (WebP/AVIF conversion)
 * - Aggressive caching for performance
 * - Fallback to original R2 images
 */

import { Hono } from 'hono';
import { cache } from 'hono/cache';

interface Env {
  IMAGES: ImagesBinding;
  R2_IMAGES: R2Bucket;
  ASSETS: AssetBinding;
}

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  gravity?: 'auto' | 'side' | 'center' | 'left' | 'right' | 'top' | 'bottom';
  background?: string;
  blur?: number;
  brightness?: number;
  contrast?: number;
  gamma?: number;
  sharpen?: number;
}

const imageApp = new Hono<{ Bindings: Env }>();

// Cache static images aggressively
imageApp.use('/cdn-cgi/image/*', cache({
  cacheName: 'jane-perry-images',
  cacheControl: 'public, max-age=86400, s-maxage=31536000', // 24h browser, 1 year edge
}));

/**
 * Parse transformation options from URL parameters
 */
function parseTransformOptions(searchParams: URLSearchParams): ImageTransformOptions {
  const options: ImageTransformOptions = {};

  // Parse comma-separated options from the path (Cloudflare Images style)
  const transformString = searchParams.get('transform') || '';
  const transformPairs = transformString.split(',').filter(Boolean);
  
  transformPairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      switch (key) {
        case 'width':
        case 'w':
          options.width = parseInt(value);
          break;
        case 'height':
        case 'h':
          options.height = parseInt(value);
          break;
        case 'quality':
        case 'q':
          options.quality = parseInt(value);
          break;
        case 'format':
        case 'f':
          options.format = value as ImageTransformOptions['format'];
          break;
        case 'fit':
          options.fit = value as ImageTransformOptions['fit'];
          break;
        case 'gravity':
        case 'g':
          options.gravity = value as ImageTransformOptions['gravity'];
          break;
        case 'background':
        case 'bg':
          options.background = value;
          break;
        case 'blur':
          options.blur = parseInt(value);
          break;
        case 'brightness':
          options.brightness = parseFloat(value);
          break;
        case 'contrast':
          options.contrast = parseFloat(value);
          break;
        case 'gamma':
          options.gamma = parseFloat(value);
          break;
        case 'sharpen':
          options.sharpen = parseFloat(value);
          break;
      }
    }
  });

  // Also support individual query parameters
  if (searchParams.has('width')) options.width = parseInt(searchParams.get('width')!);
  if (searchParams.has('height')) options.height = parseInt(searchParams.get('height')!);
  if (searchParams.has('quality')) options.quality = parseInt(searchParams.get('quality')!);
  if (searchParams.has('format')) options.format = searchParams.get('format') as ImageTransformOptions['format'];

  // Set defaults
  if (!options.quality) options.quality = 85;
  if (!options.format) options.format = 'auto';
  if (!options.fit) options.fit = 'scale-down';

  return options;
}

/**
 * Get responsive image sizes based on device type
 */
function getResponsiveWidth(userAgent: string, requestedWidth?: number): number {
  if (requestedWidth) return requestedWidth;

  // Simple device detection based on user agent
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const isTablet = /iPad|Tablet/i.test(userAgent);

  if (isMobile && !isTablet) return 320; // Mobile phones
  if (isTablet) return 768; // Tablets
  return 1200; // Desktop/laptop
}

/**
 * Main image optimization handler
 */
imageApp.get('/cdn-cgi/image/:options/*', async (c) => {
  try {
    const options = c.req.param('options') || '';
    const imagePath = c.req.param('*');
    
    if (!imagePath) {
      return c.text('Image path required', 400);
    }

    console.log(`Processing image: ${imagePath} with options: ${options}`);

    // Parse transformation options from URL path
    const searchParams = new URLSearchParams();
    searchParams.set('transform', options);
    const transformOptions = parseTransformOptions(searchParams);

    // Handle responsive width if width=auto
    if (options.includes('width=auto')) {
      const userAgent = c.req.header('User-Agent') || '';
      transformOptions.width = getResponsiveWidth(userAgent);
    }

    // Get original image from R2
    const originalImage = await c.env.R2_IMAGES.get(imagePath);
    
    if (!originalImage) {
      console.log(`Image not found in R2: ${imagePath}`);
      return c.text('Image not found', 404);
    }

    // Apply transformations using Cloudflare Images
    let transformedImage = c.env.IMAGES.input(originalImage.body);

    // Apply width/height transformations
    if (transformOptions.width || transformOptions.height) {
      const resizeOptions: any = {};
      if (transformOptions.width) resizeOptions.width = transformOptions.width;
      if (transformOptions.height) resizeOptions.height = transformOptions.height;
      if (transformOptions.fit) resizeOptions.fit = transformOptions.fit;
      
      transformedImage = transformedImage.transform(resizeOptions);
    }

    // Apply other effects
    if (transformOptions.blur) {
      transformedImage = transformedImage.blur(transformOptions.blur);
    }
    
    if (transformOptions.brightness !== undefined) {
      transformedImage = transformedImage.brightness(transformOptions.brightness);
    }
    
    if (transformOptions.contrast !== undefined) {
      transformedImage = transformedImage.contrast(transformOptions.contrast);
    }
    
    if (transformOptions.gamma !== undefined) {
      transformedImage = transformedImage.gamma(transformOptions.gamma);
    }
    
    if (transformOptions.sharpen !== undefined) {
      transformedImage = transformedImage.sharpen(transformOptions.sharpen);
    }

    // Set output format and quality
    const outputOptions: any = {
      quality: transformOptions.quality
    };

    // Handle format=auto for best compression
    if (transformOptions.format === 'auto') {
      const acceptHeader = c.req.header('Accept') || '';
      if (acceptHeader.includes('image/avif')) {
        outputOptions.format = 'image/avif';
      } else if (acceptHeader.includes('image/webp')) {
        outputOptions.format = 'image/webp';
      } else {
        outputOptions.format = 'image/jpeg';
      }
    } else if (transformOptions.format && transformOptions.format !== 'auto') {
      outputOptions.format = `image/${transformOptions.format}`;
    }

    // Generate final image
    const result = await transformedImage.output(outputOptions);
    const response = result.response();

    // Add optimization headers
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=31536000');
    headers.set('X-Image-Optimized', 'true');
    headers.set('X-Transform-Options', JSON.stringify(transformOptions));
    headers.set('Vary', 'Accept, User-Agent');

    return new Response(response.body, {
      status: response.status,
      headers
    });

  } catch (error) {
    console.error('Image processing error:', error);
    
    // Fallback: try to serve original image from R2
    try {
      const imagePath = c.req.param('*');
      const originalImage = await c.env.R2_IMAGES.get(imagePath!);
      
      if (originalImage) {
        const headers = new Headers();
        originalImage.writeHttpMetadata(headers);
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('X-Fallback', 'original-r2');
        
        return new Response(originalImage.body, { headers });
      }
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
    }
    
    return c.text('Image processing failed', 500);
  }
});

/**
 * Health check endpoint
 */
imageApp.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'jane-perry-image-optimizer',
    timestamp: new Date().toISOString(),
    features: [
      'dynamic-resizing',
      'format-optimization', 
      'responsive-images',
      'aggressive-caching',
      'webp-avif-support'
    ]
  });
});

/**
 * Image info endpoint - returns metadata about an image
 */
imageApp.get('/info/*', async (c) => {
  try {
    const imagePath = c.req.param('*');
    
    if (!imagePath) {
      return c.json({ error: 'Image path required' }, 400);
    }

    const originalImage = await c.env.R2_IMAGES.get(imagePath);
    
    if (!originalImage) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const metadata = {
      path: imagePath,
      size: originalImage.size,
      etag: originalImage.etag,
      uploaded: originalImage.uploaded,
      httpMetadata: originalImage.httpMetadata,
      customMetadata: originalImage.customMetadata,
      optimizedUrls: {
        small: `/cdn-cgi/image/width=320,quality=80/${imagePath}`,
        medium: `/cdn-cgi/image/width=768,quality=85/${imagePath}`,
        large: `/cdn-cgi/image/width=1200,quality=85/${imagePath}`,
        webp: `/cdn-cgi/image/format=webp,quality=85/${imagePath}`,
        avif: `/cdn-cgi/image/format=avif,quality=80/${imagePath}`
      }
    };

    return c.json(metadata);
  } catch (error) {
    console.error('Image info error:', error);
    return c.json({ error: 'Failed to get image info' }, 500);
  }
});

export { imageApp };