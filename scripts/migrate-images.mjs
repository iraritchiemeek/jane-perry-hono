#!/usr/bin/env node

/**
 * Simple S3 to Cloudflare Images Migration
 * 
 * What this does:
 * 1. Finds all S3 URLs in JSON data files
 * 2. Downloads images using fetch() (no AWS credentials needed!)
 * 3. Uploads to R2 using Cloudflare API
 * 4. Updates JSON files with new optimized URLs
 * 
 * Required environment variables:
 * - CLOUDFLARE_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID  
 * - R2_SECRET_ACCESS_KEY
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: 'jane-perry-images',
  customDomain: 'images.jane-perry.com' // You'll set this up in Cloudflare dashboard
};

class SimpleImageMigrator {
  constructor() {
    this.processedUrls = new Map();
    this.stats = { total: 0, processed: 0, errors: 0 };
    
    // Initialize R2 client (S3-compatible)
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey,
      },
    });
  }

  /**
   * Get S3 URLs from artworks.json
   */
  async getS3Urls() {
    const artworksPath = path.join(__dirname, '..', 'data', 'artworks.json');
    const content = await fs.readFile(artworksPath, 'utf-8');
    const artworks = JSON.parse(content);
    
    const urls = [];
    
    // Get the image.url from each artwork
    Object.values(artworks).forEach(artwork => {
      if (artwork.image?.url) {
        urls.push(artwork.image.url);
      }
    });
    
    return urls;
  }

  /**
   * Extract filename from S3 URL
   */
  getFilenameFromUrl(url) {
    return url.split('/').pop();
  }

  /**
   * Download image from public S3 URL
   */
  async downloadImage(url) {
    console.log(`  📥 Downloading: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    return {
      buffer: new Uint8Array(buffer),
      contentType: response.headers.get('content-type') || 'image/jpeg',
      contentLength: buffer.byteLength
    };
  }

  /**
   * Upload to R2 using AWS SDK (S3-compatible API)
   */
  async uploadToR2(imageData, filename) {
    console.log(`  📤 Uploading ${imageData.contentLength} bytes as: ${filename}`);
    
    try {
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: filename,
        Body: imageData.buffer,
        ContentType: imageData.contentType,
        ContentLength: imageData.contentLength,
      });
      
      const result = await this.r2Client.send(command);
      
      const r2Url = `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${filename}`;
      const optimizedUrl = `https://${config.customDomain}/cdn-cgi/image/format=auto,quality=85/${filename}`;
      
      console.log(`  ✅ Uploaded successfully (ETag: ${result.ETag})`);
      
      return {
        filename,
        r2Url,
        optimizedUrl,
        etag: result.ETag
      };
    } catch (error) {
      console.error(`  ❌ Upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a single image
   */
  async processImage(s3Url) {
    if (this.processedUrls.has(s3Url)) {
      console.log(`⏭️  Skipping already processed: ${this.getFilenameFromUrl(s3Url)}`);
      return this.processedUrls.get(s3Url);
    }

    try {
      const filename = this.getFilenameFromUrl(s3Url);
      console.log(`🖼️  Processing: ${filename}`);
      
      // Download from S3
      const imageData = await this.downloadImage(s3Url);
      
      // Upload to R2
      const uploadResult = await this.uploadToR2(imageData, filename);
      
      // Cache result
      this.processedUrls.set(s3Url, uploadResult);
      this.stats.processed++;
      
      console.log(`  ✅ Done: ${uploadResult.optimizedUrl}`);
      return uploadResult;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Update artworks.json with new URLs
   */
  async updateDataFiles() {
    const artworksPath = path.join(__dirname, '..', 'data', 'artworks.json');
    const content = await fs.readFile(artworksPath, 'utf-8');
    const artworks = JSON.parse(content);
    
    console.log(`\n📝 Updating artworks.json...`);
    
    let updated = false;
    
    // Update only the base image.url for each artwork
    Object.values(artworks).forEach(artwork => {
      if (artwork.image?.url && this.processedUrls.has(artwork.image.url)) {
        artwork.image.url = this.processedUrls.get(artwork.image.url).optimizedUrl;
        updated = true;
      }
    });
    
    if (updated) {
      // Create backup first
      const backupPath = artworksPath + '.backup';
      await fs.copyFile(artworksPath, backupPath);
      
      // Write updated file
      await fs.writeFile(artworksPath, JSON.stringify(artworks, null, 2), 'utf-8');
      console.log(`  ✅ Updated: artworks.json (backup created)`);
    } else {
      console.log(`  ⏭️  No changes needed`);
    }
  }

  /**
   * Main migration process
   */
  async migrate() {
    console.log('🚀 Starting simple S3 to Cloudflare Images migration...\n');
    
    try {
      // Get all image URLs from artworks.json
      const s3Urls = await this.getS3Urls();
      this.stats.total = s3Urls.length;
      
      if (s3Urls.length === 0) {
        console.log('✅ No S3 URLs found - migration may already be complete!');
        return;
      }
      
      console.log(`📋 Found ${s3Urls.length} images to migrate:`);
      s3Urls.forEach((url, i) => {
        const filename = this.getFilenameFromUrl(url);
        console.log(`  ${i + 1}. ${filename}`);
      });
      
      console.log(`\n🔄 Processing images...`);
      
      // Process all images in parallel (134 images is manageable)
      console.log(`\n🚀 Processing all ${s3Urls.length} images in parallel...`);
      
      const results = await Promise.allSettled(
        s3Urls.map(url => this.processImage(url))
      );
      
      // Log any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.log(`\n⚠️  ${failures.length} images failed to process:`);
        failures.forEach((failure, index) => {
          console.log(`  ${index + 1}. ${failure.reason?.message || 'Unknown error'}`);
        });
      }
      
      // Update data files
      await this.updateDataFiles();
      
      // Summary
      console.log('\n' + '='.repeat(50));
      console.log('🎉 Migration Summary');
      console.log('='.repeat(50));
      console.log(`Total images: ${this.stats.total}`);
      console.log(`Successfully processed: ${this.stats.processed}`);
      console.log(`Errors: ${this.stats.errors}`);
      
      if (this.stats.errors === 0) {
        console.log('\n✅ Migration completed successfully!');
      } else {
        console.log('\n⚠️  Migration completed with some errors.');
      }
      
      console.log('\n💡 Next steps:');
      console.log('1. Set up R2 bucket: jane-perry-images');
      console.log('2. Configure custom domain: images.jane-perry.com');
      console.log('3. Deploy the Hono app with image optimization');
      console.log('4. Test image loading on the live site');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }
}

// Check environment variables (only need R2 credentials now)
const requiredEnvVars = ['CLOUDFLARE_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n💡 Get these from your Cloudflare dashboard:');
  console.error('   - Account ID: Right sidebar on any Cloudflare page');
  console.error('   - R2 credentials: R2 > Manage R2 API tokens');
  process.exit(1);
}

// Run migration
const migrator = new SimpleImageMigrator();
await migrator.migrate();