import React, { useState } from 'react';
import { ProcessingStatus, StampConfig, PdfPageImage, LayoutMode } from './types';
import UploadZone from './components/UploadZone';
import StampControls from './components/StampControls';
import LayoutControls from './components/LayoutControls';
import PreviewArea from './components/PreviewArea';
import { convertPdfToImages } from './services/pdfService';
import { FileText, ScrollText } from 'lucide-react';

const DEFAULT_STAMP: StampConfig = {
  text: 'APPROVED',
  subText: '2024-10-27',
  size: 200,
  color: '#D32F2F',
  opacity: 1,
  shape: 'square',
  paddingX: 50,
  paddingY: 50,
};

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [pdfPages, setPdfPages] = useState<PdfPageImage[]>([]);
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_STAMP);
  const [fileName, setFileName] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('vertical');

  const handleFileSelect = async (file: File) => {
    try {
      setStatus(ProcessingStatus.PROCESSING_PDF);
      setFileName(file.name);
      const images = await convertPdfToImages(file);
      setPdfPages(images);
      setStatus(ProcessingStatus.READY);
    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
      alert("Failed to process PDF. Please try a simpler file.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
               <ScrollText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">PDF Stitcher <span className="text-slate-400 font-light">&</span> Seal</h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
             Privacy First: Processing happens in your browser
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Section (Visible if no file) */}
        {status === ProcessingStatus.IDLE && (
           <div className="max-w-2xl mx-auto mt-12">
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-bold text-slate-900 mb-4">Combine Pages & Add Your Official Seal</h2>
                 <p className="text-lg text-slate-600">Turn multi-page PDFs into a single continuous image and apply a custom digital stamp in seconds.</p>
              </div>
              <UploadZone onFileSelect={handleFileSelect} />
           </div>
        )}

        {/* Workspace (Visible if file loaded or processing) */}
        {(status !== ProcessingStatus.IDLE) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                 <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate" title={fileName}>{fileName}</span>
                 </div>
                 <button 
                   onClick={() => {
                     setStatus(ProcessingStatus.IDLE);
                     setPdfPages([]);
                   }}
                   className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                 >
                   Change
                 </button>
              </div>

              <LayoutControls 
                currentMode={layoutMode}
                onChange={setLayoutMode}
              />

              <StampControls 
                config={stampConfig} 
                onChange={setStampConfig} 
              />
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-8">
              <PreviewArea 
                pages={pdfPages} 
                stampConfig={stampConfig} 
                layoutMode={layoutMode}
                isProcessing={status === ProcessingStatus.PROCESSING_PDF}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;