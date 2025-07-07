import { Undo2, Redo2, Download, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

interface ControlsProps {
  canvasWidth: number;
  canvasHeight: number;
  onCanvasSizeChange: (width: number, height: number) => void;
  onClearCanvas: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  pixelSize: number;
  onPixelSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onImport: (file: File) => void;
}

export default function Controls({
  canvasWidth,
  canvasHeight,
  onCanvasSizeChange,
  onClearCanvas,
  onUndo,
  onRedo,
  onExport,
  pixelSize,
  onPixelSizeChange,
  canUndo,
  canRedo,
  onImport
}: ControlsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Local state for canvas size inputs
  const [widthInput, setWidthInput] = useState(canvasWidth.toString());
  const [heightInput, setHeightInput] = useState(canvasHeight.toString());

  // Keep local state in sync with props
  React.useEffect(() => {
    setWidthInput(canvasWidth.toString());
  }, [canvasWidth]);
  React.useEffect(() => {
    setHeightInput(canvasHeight.toString());
  }, [canvasHeight]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInput(e.target.value.replace(/[^0-9]/g, ''));
  };
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeightInput(e.target.value.replace(/[^0-9]/g, ''));
  };

  const commitWidth = () => {
    const width = parseInt(widthInput, 10);
    if (!isNaN(width) && width >= 8 && width <= 128 && width !== canvasWidth) {
      onCanvasSizeChange(width, canvasHeight);
    } else {
      setWidthInput(canvasWidth.toString());
    }
  };
  const commitHeight = () => {
    const height = parseInt(heightInput, 10);
    if (!isNaN(height) && height >= 8 && height <= 128 && height !== canvasHeight) {
      onCanvasSizeChange(canvasWidth, height);
    } else {
      setHeightInput(canvasHeight.toString());
    }
  };

  const handleWidthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitWidth();
  };
  const handleHeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitHeight();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Canvas Size Controls */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Size:</label>
          <input
            type="number"
            min="8"
            max="128"
            value={widthInput}
            onChange={handleWidthChange}
            onBlur={commitWidth}
            onKeyDown={handleWidthKeyDown}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">×</span>
          <input
            type="number"
            min="8"
            max="128"
            value={heightInput}
            onChange={handleHeightChange}
            onBlur={commitHeight}
            onKeyDown={handleHeightKeyDown}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        {/* Pixel Size Control */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Zoom:</label>
          <input
            type="range"
            min="8"
            max="32"
            value={pixelSize}
            onChange={(e) => onPixelSizeChange(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-500">{pixelSize}px</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Undo2 size={16} />
            <span className="text-sm">Undo</span>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Redo2 size={16} />
            <span className="text-sm">Redo</span>
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