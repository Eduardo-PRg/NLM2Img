import React from 'react';
import { LayoutMode } from '../types';
import { Columns, Grid } from 'lucide-react';

interface LayoutControlsProps {
  currentMode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({ currentMode, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        <Columns className="w-5 h-5 mr-2 text-indigo-600" />
        Layout Style
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChange('vertical')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            currentMode === 'vertical'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <div className="mb-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
             <div className="w-6 h-8 border-2 border-slate-300 border-dashed rounded-sm mx-auto flex flex-col gap-1 p-0.5">
                <div className="h-1.5 w-full bg-slate-300 rounded-xs"></div>
                <div className="h-1.5 w-full bg-slate-300 rounded-xs"></div>
                <div className="h-1.5 w-full bg-slate-300 rounded-xs"></div>
             </div>
          </div>
          <span className="text-sm font-semibold">Vertical Scroll</span>
          <span className="text-xs opacity-70 mt-1">Stitch Top to Bottom</span>
        </button>

        <button
          onClick={() => onChange('grid')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            currentMode === 'grid'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
           <div className="mb-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
             <div className="w-8 h-8 border-2 border-slate-300 rounded-sm mx-auto grid grid-cols-2 gap-0.5 p-0.5">
                <div className="bg-slate-300 rounded-xs"></div>
                <div className="bg-slate-300 rounded-xs"></div>
                <div className="bg-slate-300 rounded-xs"></div>
                <div className="bg-slate-300 rounded-xs"></div>
             </div>
          </div>
          <span className="text-sm font-semibold">Square Grid</span>
          <span className="text-xs opacity-70 mt-1">All in One 1:1 Image</span>
        </button>
      </div>
    </div>
  );
};

export default LayoutControls;