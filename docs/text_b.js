
// Text Between Images - Proof of Concept
import { fal } from "@fal-ai/client";
import fetch from "node-fetch";
import fs from "fs";

// ═══════════════════════════════════════════════════════════════════════════
// 🔑 INSERT YOUR FAL API KEY HERE
// ═══════════════════════════════════════════════════════════════════════════
const FAL_KEY = "c0f7a4ff-1f7a-49e3-a1f3-4a6e1c18f48f:68a1a302b10bb8ccda4b5f7854c297ea";

fal.config({ credentials: FAL_KEY });

async function downloadImage(url) {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}

async function createTextBetween(imageUrl, text) {
  console.log("🚀 Starting text-between process...");
  
  try {
    // Step 1: Remove background using FAL API
    console.log("🔄 Removing background...");
    const result = await fal.subscribe("fal-ai/bria/background/remove", {
      input: { image_url: imageUrl },
      logs: false,
    });
    
    const foregroundUrl = result.data.image.url;
    console.log("✅ Background removed successfully");
    
    // Step 2: Download images
    console.log("📥 Downloading images...");
    const [backgroundBuffer, foregroundBuffer] = await Promise.all([
      downloadImage(imageUrl),
      downloadImage(foregroundUrl)
    ]);
    
    // Step 3: Create HTML canvas approach (simplified)
    console.log("✏️  Creating composite...");
    
    // For this proof of concept, let's save the images separately
    // and create a simple HTML file that shows the layered result
    fs.writeFileSync('background.jpg', backgroundBuffer);
    fs.writeFileSync('foreground.png', foregroundBuffer);
    
    // Create a simple HTML demonstration
    const htmlDemo = `
<!DOCTYPE html>
<html>
<head>
    <title>Text Between Images - Final Demo</title>
    <style>
        :root {
            --primary-color: #2575fc;
            --dark-bg: #1a1a1a;
            --light-bg: #2a2a2a;
            --border-color: rgba(255,255,255,0.1);
        }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--dark-bg); 
            margin: 0; 
            padding: 0;
            color: white;
            user-select: none; /* Prevent text selection during drag */
        }
        .header {
            text-align: center;
            background: linear-gradient(45deg, #6a11cb 0%, var(--primary-color) 100%);
            padding: 20px;
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .editor-layout {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 40px;
            padding: 40px;
            max-width: 1800px;
            margin: 0 auto;
        }
        .image-preview-container {
            flex: 3;
            min-width: 0;
        }
        .controls-container {
            flex: 1;
            min-width: 400px;
            position: sticky;
            top: 40px;
        }
        .controls {
            background: var(--light-bg);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
        }
        .control-row {
            display: flex;
            flex-direction: column;
            margin-bottom: 25px;
        }
        .control-row-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .control-row label {
            font-weight: bold;
        }
        .slider {
            width: 100%;
        }
        .image-stack { 
            position: relative; 
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            line-height: 0;
        }
        .background-layer {
            display: block;
            width: 100%;
            border-radius: 15px;
        }
        .text-layer {
            position: absolute;
            top: 50%;
            left: 50%;
            z-index: 2;
            transform: translate(-50%, -50%);
            color: white; 
            font-size: 80px; 
            font-weight: 900; 
            text-shadow: 0px 6px 12px rgba(0,0,0,0.7);
            font-family: 'Impact', 'Arial Black', sans-serif;
            transition: font-size 0.1s ease, color 0.1s ease, text-shadow 0.1s ease;
            white-space: nowrap;
            cursor: move;
        }
        .foreground-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 3;
            pointer-events: none;
        }
        .success {
            background: linear-gradient(45deg, #11998e, #38ef7d);
            color: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 40px;
            font-weight: bold;
        }
        .color-swatch-container {
            display: flex;
            gap: 10px;
        }
        .color-swatch {
            width: 35px;
            height: 35px;
            border: 2px solid transparent;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .color-swatch:hover, .color-swatch.active {
            transform: scale(1.1);
            border-color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Text Between Images - Interactive Demo</h1>
        <p>This demo proves the core concept of layering text between a background and an AI-extracted foreground.</p>
    </div>
    
    <div class="success">
        ✅ CONCEPT VALIDATED! The 3-layer compositing works.
    </div>
    
    <div class="editor-layout">
        <div class="image-preview-container">
            <div class="image-stack">
                <img src="background.jpg" class="background-layer" />
                <div class="text-layer" id="textLayer">${text}</div>
                <img src="foreground.png" class="foreground-layer" />
            </div>
        </div>
        
        <div class="controls-container">
            <div class="controls">
                <h3>🎛️ Live Controls (Drag text to move)</h3>
                
                <div class="control-row">
                    <div class="control-row-header">
                        <label>Text Size:</label>
                        <div class="value-display" id="textSizeValue">80px</div>
                    </div>
                    <input type="range" id="textSize" class="slider" min="10" max="300" value="80">
                </div>
                
                <div class="control-row">
                     <div class="control-row-header">
                        <label>Text Color:</label>
                    </div>
                    <div class="color-swatch-container">
                        <div class="color-swatch active" style="background: white;" onclick="changeTextColor('white', this)"></div>
                        <div class="color-swatch" style="background: #ffdd59;" onclick="changeTextColor('#ffdd59', this)"></div>
                        <div class="color-swatch" style="background: #ff4757;" onclick="changeTextColor('#ff4757', this)"></div>
                        <div class="color--swatch" style="background: #48dbfb;" onclick="changeTextColor('#48dbfb', this)"></div>
                        <div class="color-swatch" style="background: #1dd1a1;" onclick="changeTextColor('#1dd1a1', this)"></div>
                    </div>
                </div>
                
                <div class="control-row">
                    <div class="control-row-header">
                        <label>Shadow Size:</label>
                        <div class="value-display" id="shadowIntensityValue">6px</div>
                    </div>
                    <input type="range" id="shadowIntensity" class="slider" min="0" max="25" value="6">
                </div>
            </div>
        </div>
    </div>
    
    <script>
         const textLayer = document.getElementById('textLayer');
         const imageStack = document.querySelector('.image-stack');
         
         const textSizeSlider = document.getElementById('textSize');
         const shadowIntensitySlider = document.getElementById('shadowIntensity');
         
         const textSizeValue = document.getElementById('textSizeValue');
         const shadowIntensityValue = document.getElementById('shadowIntensityValue');
         
         // Update Text Size
         textSizeSlider.addEventListener('input', (e) => {
             textLayer.style.fontSize = e.target.value + 'px';
             textSizeValue.textContent = e.target.value + 'px';
         });
         
         // Update Shadow Intensity
         shadowIntensitySlider.addEventListener('input', (e) => {
             const intensity = e.target.value;
             textLayer.style.textShadow = \`0px \${intensity}px \${intensity * 2}px rgba(0,0,0,0.7)\`;
             shadowIntensityValue.textContent = intensity + 'px';
         });
         
         // Change Text Color
         function changeTextColor(color, element) {
             textLayer.style.color = color;
             document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
             element.classList.add('active');
         }

         // --- Drag and Drop Logic ---
         let isDragging = false;

         textLayer.addEventListener('mousedown', function(event) {
             isDragging = true;
             textLayer.style.cursor = 'grabbing';
             textLayer.style.transition = 'none'; // Disable transition for smooth dragging

             document.addEventListener('mousemove', onDrag);
             document.addEventListener('mouseup', onStopDrag);
         });

         function onDrag(event) {
             if (!isDragging) return;
             event.preventDefault();

             const parentRect = imageStack.getBoundingClientRect();
             
             // Calculate position as a percentage to remain responsive
             let x = ((event.clientX - parentRect.left) / parentRect.width) * 100;
             let y = ((event.clientY - parentRect.top) / parentRect.height) * 100;

             // Clamp values to keep the text's center within the container
             x = Math.max(0, Math.min(100, x));
             y = Math.max(0, Math.min(100, y));

             textLayer.style.left = x + '%';
             textLayer.style.top = y + '%';
         }

         function onStopDrag() {
             isDragging = false;
             textLayer.style.cursor = 'move';
             textLayer.style.transition = 'font-size 0.1s ease, color 0.1s ease, text-shadow 0.1s ease'; // Re-enable transitions
             
             document.removeEventListener('mousemove', onDrag);
             document.removeEventListener('mouseup', onStopDrag);
         }
    </script>
</body>
</html>`;
    
    fs.writeFileSync('demo.html', htmlDemo);
    
    console.log("✅ SUCCESS! Drag-and-Drop enabled.");
    console.log("  📁 background.jpg - Original image");
    console.log("  📁 foreground.png - Subject with background removed"); 
    console.log("  📁 demo.html - Final interactive demonstration with dragging");
    console.log("");
    console.log("🌐 Refresh demo.html. You can now drag the text to position it!");
    
    return "demo.html";
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI Usage
// ═══════════════════════════════════════════════════════════════════════════
const [,, imageUrl, text] = process.argv;

if (!imageUrl || !text) {
  console.log(`
🎯 USAGE:
   node text_b.js <IMAGE_URL> <TEXT>

📝 EXAMPLE:
   node text_b.js "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg" "ESCAPE"
  `);
  process.exit(1);
}

// Run the magic
createTextBetween(imageUrl, text).catch(console.error);
