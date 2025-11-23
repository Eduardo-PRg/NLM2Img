import { PdfPageImage, LayoutMode } from '../types';

// We rely on the global window.pdfjsLib loaded via CDN in index.html 
// to avoid complex bundler configuration for the worker file in this specific environment.
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const convertPdfToImages = async (file: File): Promise<PdfPageImage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the document
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const images: PdfPageImage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2.0; // Higher scale for better quality
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    images.push({
      blob: canvas.toDataURL('image/jpeg', 0.85),
      width: viewport.width,
      height: viewport.height,
      pageIndex: i
    });
  }

  return images;
};

const calculateOptimalGrid = (count: number, itemWidth: number, itemHeight: number) => {
  let bestMetric = -1;
  let bestRows = Math.ceil(Math.sqrt(count));
  let bestCols = Math.ceil(count / bestRows);

  // Iterate to find the grid configuration that results in the largest content when fit into a square
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const gridW = cols * itemWidth;
    const gridH = rows * itemHeight;
    
    // We want to minimize the max dimension (this effectively maximizes the scale factor for a fixed square)
    // Metric: 1 / max(gridW, gridH)
    // We just want to minimize Math.max(gridW, gridH)
    
    const maxDim = Math.max(gridW, gridH);
    
    // We also prefer fuller grids (fewer empty spots), but size is primary
    // Let's strictly minimize the bounding box size required relative to image size
    
    if (bestMetric === -1 || maxDim < bestMetric) {
        bestMetric = maxDim;
        bestRows = rows;
        bestCols = cols;
    }
  }
  
  return { rows: bestRows, cols: bestCols };
};

export const stitchImagesAndStamp = async (
  images: PdfPageImage[],
  stampCanvas: HTMLCanvasElement | null,
  layoutMode: LayoutMode = 'vertical'
): Promise<string> => {
  if (images.length === 0) return '';

  const maxWidth = Math.max(...images.map(img => img.width));
  const maxHeight = Math.max(...images.map(img => img.height));

  let canvasWidth = 0;
  let canvasHeight = 0;
  let rows = 0;
  let cols = 0;

  if (layoutMode === 'vertical') {
    canvasWidth = maxWidth;
    canvasHeight = images.reduce((sum, img) => sum + img.height, 0);
  } else {
    // GRID MODE
    const gridConfig = calculateOptimalGrid(images.length, maxWidth, maxHeight);
    rows = gridConfig.rows;
    cols = gridConfig.cols;
    
    // The canvas will be a square large enough to fit the grid
    // The grid dimensions are:
    const gridPixelWidth = cols * maxWidth;
    const gridPixelHeight = rows * maxHeight;
    
    // Make it a square based on the largest dimension needed
    const squareSize = Math.max(gridPixelWidth, gridPixelHeight);
    canvasWidth = squareSize;
    canvasHeight = squareSize;
  }

  // 2. Create the master canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Fill white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Draw images
  if (layoutMode === 'vertical') {
    let currentY = 0;
    for (const imgData of images) {
      const img = new Image();
      img.src = imgData.blob;
      await new Promise((resolve) => { img.onload = resolve; });

      const xOffset = (canvasWidth - imgData.width) / 2;
      ctx.drawImage(img, xOffset, currentY, imgData.width, imgData.height);
      currentY += imgData.height;
    }
  } else {
    // GRID MODE
    // Center the grid within the square canvas
    const gridPixelWidth = cols * maxWidth;
    const gridPixelHeight = rows * maxHeight;
    
    const startX = (canvasWidth - gridPixelWidth) / 2;
    const startY = (canvasHeight - gridPixelHeight) / 2;

    for (let i = 0; i < images.length; i++) {
      const imgData = images[i];
      const img = new Image();
      img.src = imgData.blob;
      await new Promise((resolve) => { img.onload = resolve; });

      const colIndex = i % cols;
      const rowIndex = Math.floor(i / cols);

      // Center the image within its cell if it's smaller than maxWidth/maxHeight
      const cellX = startX + colIndex * maxWidth;
      const cellY = startY + rowIndex * maxHeight;
      
      const imgX = cellX + (maxWidth - imgData.width) / 2;
      const imgY = cellY + (maxHeight - imgData.height) / 2;

      ctx.drawImage(img, imgX, imgY, imgData.width, imgData.height);
    }
  }

  // 4. Draw Stamp (if provided)
  if (stampCanvas) {
    const stampWidth = stampCanvas.width;
    const stampHeight = stampCanvas.height;
    
    // Scale stamp relative to document size
    // For grid mode (usually larger), we might want a slightly smaller relative stamp, 
    // but 20-25% is usually a good standard for visibility.
    const targetStampWidth = Math.min(canvasWidth * 0.2, 500); 
    const scaleRatio = targetStampWidth / stampWidth;
    const targetStampHeight = stampHeight * scaleRatio;

    const marginX = canvasWidth * 0.05;
    const marginY = canvasWidth * 0.05;

    const stampX = canvasWidth - targetStampWidth - marginX;
    const stampY = canvasHeight - targetStampHeight - marginY;

    ctx.drawImage(stampCanvas, stampX, stampY, targetStampWidth, targetStampHeight);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
};