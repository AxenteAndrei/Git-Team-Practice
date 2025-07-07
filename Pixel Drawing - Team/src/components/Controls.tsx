import { Undo2, Redo2, Download, Trash2 } from 'lucide-react';
import React from 'react';

interface ControlsProps {
  onClearCanvas: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  pixelSize: number;
  onPixelSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onImport: (file: File) => void;
  onNewDrawing: () => void;
}

export default function Controls({
  onClearCanvas,
  onUndo,
  onRedo,
  onExport,
  pixelSize,
  onPixelSizeChange,
  canUndo,
  canRedo,
  onImport,
  onNewDrawing
}: ControlsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* New Drawing Button replaces Canvas Size Controls */}
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-green-600 transition"
          onClick={onNewDrawing}
        >
          New Drawing
        </button>

        {/* Pixel Size Control */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Zoom:</label>
          <button
            onClick={() => onPixelSizeChange(Math.max(8, pixelSize - 2))}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg font-bold text-gray-900"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            −
          </button>
          <input
            type="range"
            min="8"
            max="32"
            value={pixelSize}
            onChange={(e) => onPixelSizeChange(parseInt(e.target.value))}
            className="w-20 accent-blue-500"
          />
          <button
            onClick={() => onPixelSizeChange(Math.min(32, pixelSize + 2))}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg font-bold text-gray-900"
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
          <span className="text-sm text-gray-500">{pixelSize}px</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium
              ${canUndo
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Undo2 size={16} />
            <span>Undo</span>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium
              ${canRedo
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Redo2 size={16} />
            <span>Redo</span>
          </button>
          
          <button
            onClick={onClearCanvas}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            <span className="text-sm">Clear</span>
          </button>
          
          <button
            onClick={onExport}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
          >
            <Download size={16} />
            <span className="text-sm">Export</span>
          </button>
          
          <button
            onClick={handleImportClick}
            className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
          >
            <span className="text-sm">Import</span>
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}