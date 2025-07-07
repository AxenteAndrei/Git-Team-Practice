import { useState } from 'react';
import { Color } from '../types';
import { colorToString, stringToColor } from '../utils';

interface ColorPaletteProps {
  currentColor: Color;
  onColorChange: (color: Color) => void;
  customColors: Color[];
}

const defaultColors: Color[] = [
  { r: 0, g: 0, b: 0, a: 1 },
  { r: 255, g: 255, b: 255, a: 1 },
  { r: 255, g: 0, b: 0, a: 1 },
  { r: 0, g: 255, b: 0, a: 1 },
  { r: 0, g: 0, b: 255, a: 1 },
  { r: 255, g: 255, b: 0, a: 1 },
  { r: 255, g: 0, b: 255, a: 1 },
  { r: 0, g: 255, b: 255, a: 1 },
  { r: 128, g: 128, b: 128, a: 1 },
  { r: 192, g: 192, b: 192, a: 1 },
  { r: 128, g: 0, b: 0, a: 1 },
  { r: 0, g: 128, b: 0, a: 1 },
  { r: 0, g: 0, b: 128, a: 1 },
  { r: 128, g: 128, b: 0, a: 1 },
  { r: 128, g: 0, b: 128, a: 1 },
  { r: 0, g: 128, b: 128, a: 1 },
  { r: 255, g: 165, b: 0, a: 1 },
  { r: 255, g: 192, b: 203, a: 1 },
  { r: 160, g: 82, b: 45, a: 1 },
  { r: 128, g: 0, b: 128, a: 1 },
];

export default function ColorPalette({ currentColor, onColorChange, customColors }: ColorPaletteProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColorValue, setCustomColorValue] = useState('#000000');
  const [customAlpha, setCustomAlpha] = useState(1);

  const handleCustomColorChange = (value: string) => {
    setCustomColorValue(value);
    const color = stringToColor(value);
    const newColor = { ...color, a: customAlpha };
    onColorChange(newColor);
  };

  const handleAlphaChange = (value: number) => {
    setCustomAlpha(value);
    const color = stringToColor(customColorValue);
    const newColor = { ...color, a: value };
    onColorChange(newColor);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Colors</h3>
      
      {/* Current Color Display */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Current Color</div>
        <div 
          className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
          style={{ backgroundColor: colorToString(currentColor) }}
        />
      </div>

      {/* Default Color Palette */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {defaultColors.map((color, index) => (
          <button
            key={index}
            onClick={() => onColorChange(color)}
            className={`w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform ${
              colorToString(color) === colorToString(currentColor)
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: colorToString(color) }}
            title={`RGB(${color.r}, ${color.g}, ${color.b})`}
          />
        ))}
      </div>

      {/* Custom Color Sockets */}
      {customColors.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Recent Custom Colors</div>
          <div className="flex flex-wrap gap-2">
            {customColors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => onColorChange(color)}
                className={`w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform ${
                  colorToString(color) === colorToString(currentColor)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: colorToString(color) }}
                title={`RGB(${color.r}, ${color.g}, ${color.b}), A: ${Math.round(color.a * 100)}%`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Color Picker */}
      <div>
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          {showCustomPicker ? 'Hide' : 'Show'} Custom Color
        </button>
        
        {showCustomPicker && (
          <div className="mt-3 space-y-2">
            <input
              type="color"
              value={customColorValue}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={customColorValue}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              placeholder="#000000"
            />
            <div className="flex items-center space-x-2">
              <label htmlFor="opacity-slider" className="text-sm text-gray-600">Opacity</label>
              <input
                id="opacity-slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={customAlpha}
                onChange={(e) => handleAlphaChange(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">{Math.round(customAlpha * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}