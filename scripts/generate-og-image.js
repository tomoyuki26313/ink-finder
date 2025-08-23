// Script to generate OG image from HTML template
// Run: node scripts/generate-og-image.js

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateOGImage() {
  console.log('Generating OG image...');
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to OG image dimensions
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2 // For better quality
    });
    
    // Load the HTML template
    const htmlPath = path.join(__dirname, '../public/og-image-generator.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent);
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Take screenshot
    const outputPath = path.join(__dirname, '../public/og-image.jpg');
    await page.screenshot({
      path: outputPath,
      type: 'jpeg',
      quality: 95
    });
    
    console.log(`✅ OG image generated successfully at: ${outputPath}`);
    
    // Also generate a PNG version for better quality
    const pngPath = path.join(__dirname, '../public/og-image.png');
    await page.screenshot({
      path: pngPath,
      type: 'png'
    });
    
    console.log(`✅ PNG version also generated at: ${pngPath}`);
    
    await browser.close();
  } catch (error) {
    console.error('Error generating OG image:', error);
    process.exit(1);
  }
}

// Run the function
generateOGImage();