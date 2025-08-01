#!/usr/bin/env node

/**
 * Cleanup Artworks JSON
 * 
 * Removes unnecessary 'formats' field from image objects after R2 migration.
 * The formats field contained Strapi's auto-generated image variants which
 * are no longer needed since Cloudflare Images handles optimization dynamically.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanupArtworks() {
  console.log('🧹 Starting artworks.json cleanup...\n');
  
  try {
    const artworksPath = path.join(__dirname, '..', 'data', 'artworks.json');
    
    // Read current artworks data
    console.log('📖 Reading artworks.json...');
    const content = await fs.readFile(artworksPath, 'utf-8');
    const artworks = JSON.parse(content);
    
    let cleanedCount = 0;
    let totalImages = 0;
    
    // Process each artwork
    Object.values(artworks).forEach(artwork => {
      if (artwork.image) {
        totalImages++;
        
        // Remove formats field if it exists
        if (artwork.image.formats) {
          delete artwork.image.formats;
          cleanedCount++;
          console.log(`  ✂️  Cleaned: ${artwork.title} (ID: ${artwork.id})`);
        }
      }
    });
    
    if (cleanedCount === 0) {
      console.log('✅ No cleanup needed - formats field not found');
      return;
    }
    
    // Create backup first
    const backupPath = artworksPath + '.pre-cleanup';
    await fs.copyFile(artworksPath, backupPath);
    console.log(`\n💾 Backup created: ${path.basename(backupPath)}`);
    
    // Write cleaned data
    await fs.writeFile(artworksPath, JSON.stringify(artworks, null, 2), 'utf-8');
    
    // Calculate file size reduction
    const originalStats = await fs.stat(backupPath);
    const newStats = await fs.stat(artworksPath);
    const sizeReduction = originalStats.size - newStats.size;
    const percentReduction = ((sizeReduction / originalStats.size) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Cleanup Complete!');
    console.log('='.repeat(50));
    console.log(`📊 Total artworks: ${Object.keys(artworks).length}`);
    console.log(`🖼️  Images processed: ${totalImages}`);
    console.log(`✂️  Formats removed: ${cleanedCount}`);
    console.log(`📉 File size reduced: ${(sizeReduction / 1024).toFixed(1)}KB (${percentReduction}%)`);
    console.log(`💾 Backup saved as: ${path.basename(backupPath)}`);
    
    console.log('\n💡 Benefits:');
    console.log('  • Smaller JSON payload');
    console.log('  • Cleaner data structure');
    console.log('  • No redundant Strapi image variants');
    console.log('  • Dynamic optimization via Cloudflare Images');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup
await cleanupArtworks();