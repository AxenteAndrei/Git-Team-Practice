import { useState, useCallback } from 'react';
import { Palette } from 'lucide-react';
import Canvas from './components/Canvas';
import ColorPalette from './components/ColorPalette';
import Toolbar from './components/Toolbar';
import Controls from './components/Controls';
import { CanvasState, Color, Tool, HistoryState, BrushShape } from './types';
import { createEmptyCanvas, defaultColor, exportCanvasAsPNG } from './utils';

function App() {
  const [canvasState, setCanvasState] = useState<CanvasState>(() => createEmptyCanvas(32, 32));
  const [currentColor, setCurrentColor] = useState<Color>(defaultColor);
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [pixelSize, setPixelSize] = useState(16);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [brushShape, setBrushShape] = useState<BrushShape>('circle');
  const [brushSize, setBrushSize] = useState<number>(3);
  const [recentCustomColors, setRecentCustomColors] = useState<Color[]>(
    Array(8).fill({ r: 255, g: 255, b: 255, a: 1 })
  );

  const pushRecentCustomColor = useCallback((color: Color) => {
    setRecentCustomColors(prev => {
      const colorEquals = (a: Color, b: Color) =>
        a.r === b.r && a.g === b.g && a.b === b.b && Math.abs(a.a - b.a) < 0.01;
      if (prev.some(c => colorEquals(c, color))) {
        return prev;
      }
      const next = [color, ...prev];
      return next.slice(0, 8);
    });
  }, []);

  const saveToHistory = useCallback((state: CanvasState) => {
    const newHistoryEntry: HistoryState = {
      canvasState: state,
      timestamp: Date.now()
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryEntry);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  const handleCanvasChange = useCallback((newState: CanvasState) => {
    setCanvasState(newState);
    saveToHistory(newState);
  }, [saveToHistory]);

  const handleCanvasSizeChange = useCallback((width: number, height: number) => {
    if (width < 8 || width > 128 || height < 8 || height > 128) return;
    
    const newState = createEmptyCanvas(width, height);
    setCanvasState(newState);
    saveToHistory(newState);
  }, [saveToHistory]);

  const handleClearCanvas = useCallback(() => {
    const newState = createEmptyCanvas(canvasState.width, canvasState.height);
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState.width, canvasState.height, saveToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasState(history[newIndex].canvasState);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasState(history[newIndex].canvasState);
    }
  }, [history, historyIndex]);

  const handleExport = useCallback(() => {
    exportCanvasAsPNG(canvasState);
  }, [canvasState]);

  const handleImportImage = useCallback(async (file: File) => {
    const MAX_SIZE = 128;
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => { img.onload = resolve; });
    let width = img.width;
    let height = img.height;
    // Only scale down if needed
    if (width > MAX_SIZE || height > MAX_SIZE) {
      const scale = Math.min(MAX_SIZE / width, MAX_SIZE / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    } else {
      // If either dimension is still above MAX_SIZE (shouldn't happen, but just in case)
      width = Math.min(width, MAX_SIZE);
      height = Math.min(height, MAX_SIZE);
    }
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const pixels = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];
        const a = imageData[idx + 3] / 255;
        row.push({ color: { r, g, b, a }, isEmpty: a === 0 });
      }
      pixels.push(row);
    }
    setCanvasState({ pixels, width, height });
    saveToHistory({ pixels, width, height });
    setHistoryIndex((prev) => prev + 1);
  }, [saveToHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const openHelp = async () => {
    setShowHelp(true);
    const res = await fetch('/README.md');
    const text = await res.text();
    setReadmeContent(text);
  };

  const closeHelp = () => setShowHelp(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Help Button */}
      <button
        onClick={openHelp}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-500 text-white text-2xl font-bold shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
        title="Help"
        style={{ lineHeight: 1 }}
      >
        ?
      </button>
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={closeHelp}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              title="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">App Features</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-[60vh] overflow-y-auto">{readmeContent}</pre>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pixel Art Studio</h1>
            <p className="text-sm text-gray-600">Create beautiful pixel art with precision</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Controls
        canvasWidth={canvasState.width}
        canvasHeight={canvasState.height}
        onCanvasSizeChange={handleCanvasSizeChange}
        onClearCanvas={handleClearCanvas}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        pixelSize={pixelSize}
        onPixelSizeChange={setPixelSize}
        canUndo={canUndo}
        canRedo={canRedo}
        onImport={handleImportImage}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <Toolbar
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            brushShape={brushShape}
            onBrushShapeChange={setBrushShape}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
          />
          
          <ColorPalette
            currentColor={currentColor}
            onColorChange={setCurrentColor}
            customColors={recentCustomColors}
          />
          
          {/* Info Panel */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Canvas: {canvasState.width} × {canvasState.height}</div>
              <div>Tool: {currentTool}</div>
              <div>Zoom: {pixelSize}px per pixel</div>
              <div>History: {history.length} states</div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <Canvas
          canvasState={canvasState}
          onCanvasChange={handleCanvasChange}
          currentColor={currentColor}
          currentTool={currentTool}
          pixelSize={pixelSize}
          onColorPick={setCurrentColor}
          brushShape={brushShape}
          brushSize={brushSize}
          onCustomColorUsed={pushRecentCustomColor}
        />
      </div>
    </div>
  );
}

export default App;