// Simple script to generate PNG icons from SVG
// Since ImageMagick is not available, we'll use a browser-based approach
// For now, we'll create a simple HTML file that can be opened in browser to generate icons

const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Generate Peymen Icons</title>
</head>
<body>
  <canvas id="canvas192" width="192" height="192"></canvas>
  <canvas id="canvas512" width="512" height="512"></canvas>
  <script>
    function generateIcon(size) {
      const canvas = document.getElementById(\`canvas\${size}\`);
      const ctx = canvas.getContext('2d');
      
      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, size, size);
      bgGradient.addColorStop(0, '#6366f1');
      bgGradient.addColorStop(0.5, '#8b5cf6');
      bgGradient.addColorStop(1, '#ec4899');
      
      const center = size / 2;
      const radius = size * 0.47;
      
      // Draw background circle
      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Letter P - white
      const scale = size / 512;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(180 * scale, 140 * scale, 140 * scale, 40 * scale);
      ctx.fillRect(180 * scale, 140 * scale, 40 * scale, 240 * scale);
      ctx.fillRect(180 * scale, 340 * scale, 140 * scale, 40 * scale);
      ctx.fillRect(280 * scale, 240 * scale, 40 * scale, 100 * scale);
      
      // Cut out inner part
      ctx.fillStyle = bgGradient;
      ctx.fillRect(220 * scale, 180 * scale, 60 * scale, 60 * scale);
      
      return canvas.toDataURL('image/png');
    }
    
    const icon192 = generateIcon(192);
    const icon512 = generateIcon(512);
    
    console.log('192x192:', icon192.substring(0, 50) + '...');
    console.log('512x512:', icon512.substring(0, 50) + '...');
    
    // Download links
    const link192 = document.createElement('a');
    link192.download = 'icon-192.png';
    link192.href = icon192;
    link192.click();
    
    setTimeout(() => {
      const link512 = document.createElement('a');
      link512.download = 'icon-512.png';
      link512.href = icon512;
      link512.click();
    }, 500);
  </script>
</body>
</html>`;

fs.writeFileSync('generate-icons.html', htmlContent);
console.log('Created generate-icons.html - Open in browser to generate PNG icons');
