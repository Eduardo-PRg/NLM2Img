import React, { useEffect, useRef, useState } from 'react';
import { PdfPageImage, StampConfig, LayoutMode } from '../types';
import { stitchImagesAndStamp } from '../services/pdfService';
import { Download, Loader2 } from 'lucide-react';

interface PreviewAreaProps {
  pages: PdfPageImage[];
  stampConfig: StampConfig;
  isProcessing: boolean;
  layoutMode: LayoutMode;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ pages, stampConfig, isProcessing, layoutMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isStitching, setIsStitching] = useState(false);

  // Helper to draw the stamp on a standalone canvas
  const createStampCanvas = (): HTMLCanvasElement => {
    const size = 300; // Resolution for stamp rendering
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Clear
    ctx.clearRect(0, 0, size, size);

    const { text, subText, color, shape, opacity } = stampConfig;
    
    // Apply opacity
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 8;
    
    const center = size / 2;
    const radius = size / 2 - 10;
    const boxSize = size - 20;

    // Draw Border
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(center, center, radius, 0, Math.PI * 2);
    } else {
      ctx.roundRect(10, 10, boxSize, boxSize, 20);
    }
    ctx.stroke();

    // Inner Border (thinner)
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(center, center, radius - 15, 0, Math.PI * 2);
    } else {
        ctx.strokeRect(25, 25, boxSize - 30, boxSize - 30);
    }
    ctx.stroke();

    // Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Main Text
    ctx.font = 'bold 60px "Noto Serif SC", serif';
    // Basic text wrapping for square stamps
    if (shape === 'square' && text.length > 4) {
       // split into two lines
       const mid = Math.ceil(text.length / 2);
       const l1 = text.slice(0, mid);
       const l2 = text.slice(mid);
       ctx.fillText(l1, center, center - 20);
       ctx.fillText(l2, center, center + 40);
    } else {
       ctx.fillText(text, center, subText ? center - 15 : center);
    }

    // Sub Text
    if (subText) {
      ctx.font = '500 24px "Inter", sans-serif';
      ctx.fillText(subText, center, center + 65);
    }

    // Grunge effect (simple noise)
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas;
  };

  // Re-generate the stitched image whenever pages, stamp config, or layout mode changes
  useEffect(() => {
    if (pages.length === 0) return;

    const generate = async () => {
      setIsStitching(true);
      // Short delay to allow UI to update to loading state
      await new Promise(r => setTimeout(r, 50));
      
      const stampCanvas = createStampCanvas();
      const url = await stitchImagesAndStamp(pages, stampCanvas, layoutMode);
      setPreviewUrl(url);
      setIsStitching(false);
    };

    generate();
  }, [pages, stampConfig, layoutMode]);


  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `stamped_document_${layoutMode}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isProcessing) {
     return (
        <div className="flex flex-col items-center justify-center h-96 bg-slate-100 rounded-xl border border-slate-200">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Processing PDF Pages...</p>
        </div>
     );
  }

  if (pages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
            <p>Upload a PDF to see preview</p>
        </div>
      );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-bold text-slate-800">Preview</h3>
         <button 
           onClick={handleDownload}
           disabled={!previewUrl || isStitching}
           className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
         >
           {isStitching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
           <span>Download Image</span>
         </button>
      </div>

      <div className="relative w-full bg-slate-200 rounded-xl overflow-hidden min-h-[500px] border border-slate-300 shadow-inner flex justify-center items-start p-8 overflow-y-auto max-h-[80vh]">
         {isStitching && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3">
                   <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                   <span className="font-medium text-slate-700">Applying Stamp...</span>
                </div>
            </div>
         )}
         {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Stitched PDF" 
              className="shadow-2xl max-w-full h-auto object-contain bg-white" 
            />
         )}
      </div>
    </div>
  );
};

export default PreviewArea;