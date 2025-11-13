#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Script to copy images from backend to frontend public folder during build
async function copyImages() {
  const sourceDir = path.join(
    __dirname,
    '..',
    '..',
    'backendtest4',
    'output',
    'markdowns',
    'TSB_Honda-full-with-serials_artifacts'
  );
  const destDir = path.join(__dirname, '..', 'public', 'diagnostic-images');

  try {
    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.log('Source image directory not found:', sourceDir);
      return;
    }

    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy all image files
    const files = fs.readdirSync(sourceDir);
    let copiedCount = 0;

    for (const file of files) {
      if (file.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
      }
    }

    console.log(`Successfully copied ${copiedCount} images to ${destDir}`);
  } catch (error) {
    console.error('Error copying images:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  copyImages();
}

module.exports = copyImages;
