import { Tool, BrushShape } from '../types';
import { Pencil, Eraser, Paintbrush, Pipette, Brush, Contrast } from 'lucide-react';

interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  brushShape: BrushShape;
  onBrushShapeChange: (shape: BrushShape) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

const tools = [
  { id: 'pencil' as Tool, icon: Pencil, label: 'Pencil' },
  { id: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
  { id: 'fill' as Tool, icon: Paintbrush, label: 'Fill' },
  { id: 'eyedropper' as Tool, icon: Pipette, label: 'Eyedropper' },
  { id: 'brush' as Tool, icon: Brush, label: 'Brush' },
  { id: 'negative' as Tool, icon: Contrast, label: 'Negative Color' },
];

export default function Toolbar({ currentTool, onToolChange, brushShape, onBrushShapeChange, brushSize, onBrushSizeChange }: ToolbarProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Tools</h3>
      
      <div className="space-y-2 mb-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                currentTool === tool.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{tool.label}</span>
            </button>
          );
        })}
      </div>
      {/* Brush Options */}
      {(currentTool === 'brush' || currentTool === 'negative') && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brush Shape</label>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 rounded-lg border ${brushShape === 'circle' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => onBrushShapeChange('circle')}
              >
                Circle
              </button>
              <button
                className={`px-3 py-1 rounded-lg border ${brushShape === 'square' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => onBrushShapeChange('square')}
              >
                Square
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brush Size</label>
            <input
              type="range"
              min={1}
              max={10}
              value={brushSize}
              onChange={e => onBrushSizeChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600 mt-1">{brushSize} px</div>
          </div>
        </div>
      )}
    </div>
  );
}