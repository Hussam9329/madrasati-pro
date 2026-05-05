const pptxgen = require('pptxgenjs');
const html2pptx = require('/home/z/my-project/skills/ppt/scripts/html2pptx.js');
const path = require('path');

const slidesDir = path.join(__dirname);

const slideFiles = [
  'slide01-cover.html',
  'slide02-problem.html',
  'slide03-solution.html',
  'slide04-features.html',
  'slide05-qr-attendance.html',
  'slide06-grades.html',
  'slide07-roles.html',
  'slide08-technology.html',
  'slide09-dashboard.html',
  'slide10-future.html',
  'slide11-closing.html',
];

async function main() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Vision';
  pptx.company = 'Vision';
  pptx.subject = 'مدرستي Pro - نظام إدارة المدرسة الذكي';
  pptx.title = 'مدرستي Pro';

  // Font config for Arabic support
  const fontConfig = { cjk: 'Microsoft YaHei', latin: 'Arial' };

  let allWarnings = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const htmlFile = path.join(slidesDir, slideFiles[i]);
    console.log(`Processing slide ${i + 1}: ${slideFiles[i]}...`);
    
    try {
      const { slide, placeholders, warnings } = await html2pptx(htmlFile, pptx, { fontConfig });
      
      if (warnings.length > 0) {
        console.log(`  ⚠ Warnings for slide ${i + 1}:`);
        warnings.forEach(w => console.log(`    ${w}`));
        allWarnings.push({ slide: i + 1, warnings });
      } else {
        console.log(`  ✓ Slide ${i + 1} converted successfully`);
      }
    } catch (err) {
      console.error(`  ✗ Error on slide ${i + 1}: ${err.message}`);
      // Continue with other slides
    }
  }

  const outputPath = '/home/z/my-project/مدرستي_Pro_Presentation.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\n✓ Presentation saved to: ${outputPath}`);
  
  if (allWarnings.length > 0) {
    console.log(`\n⚠ Total slides with warnings: ${allWarnings.length}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
