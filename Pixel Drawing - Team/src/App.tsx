import { useState, useCallback } from 'react';
import { Palette, Sun, Moon } from 'lucide-react';
import Canvas from './components/Canvas';
import ColorPalette from './components/ColorPalette';
import Toolbar from './components/Toolbar';
import Controls from './components/Controls';
import { CanvasState, Color, Tool, HistoryState, BrushShape, Pixel } from './types';
import { createEmptyCanvas, defaultColor, exportCanvasAsPNG } from './utils';
import React from 'react';

function App() {
  // Multiple canvases state
  const [canvases, setCanvases] = useState<Array<{
    name: string;
    canvasState: CanvasState;
    history: HistoryState[];
    historyIndex: number;
  }>>([
    {
      name: 'Canvas 1',
      canvasState: createEmptyCanvas(32, 32),
      history: [{ canvasState: createEmptyCanvas(32, 32), timestamp: Date.now() }],
      historyIndex: 0,
    },
  ]);
  const [activeCanvas, setActiveCanvas] = useState(0);

  // Extract current canvas data
  const current = canvases[activeCanvas];
  const { canvasState, history, historyIndex } = current;

  const [currentColor, setCurrentColor] = useState<Color>(defaultColor);
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [pixelSize, setPixelSize] = useState(16);
  const [showHelp, setShowHelp] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [brushShape, setBrushShape] = useState<BrushShape>('circle');
  const [brushSize, setBrushSize] = useState<number>(3);
  const [recentCustomColors, setRecentCustomColors] = useState<Color[]>(
    Array(8).fill({ r: 255, g: 255, b: 255, a: 1 })
  );
  const [darkMode, setDarkMode] = useState(false);
  const [showNewDrawingModal, setShowNewDrawingModal] = useState(false);
  const [selectedNewSize, setSelectedNewSize] = useState<{w: number, h: number}>({w: 32, h: 32});

  // Toggle dark mode class on html element
  React.useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

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

  // Canvas management functions
  const addCanvas = () => {
    setCanvases(prev => [
      ...prev,
      {
        name: `Canvas ${prev.length + 1}`,
        canvasState: createEmptyCanvas(32, 32),
        history: [{ canvasState: createEmptyCanvas(32, 32), timestamp: Date.now() }],
        historyIndex: 0,
      },
    ]);
    setActiveCanvas(canvases.length); // switch to new canvas
  };

  const deleteCanvas = () => {
    if (canvases.length === 1) return;
    const newCanvases = canvases.filter((_, i) => i !== activeCanvas);
    setCanvases(newCanvases);
    setActiveCanvas(Math.max(0, activeCanvas - 1));
  };

  const switchCanvas = (idx: number) => setActiveCanvas(idx);

  // Update current canvas state/history
  const updateCurrentCanvas = (update: Partial<typeof current>) => {
    setCanvases(prev => prev.map((c, i) =>
      i === activeCanvas ? { ...c, ...update } : c
    ));
  };

  // Save to history on every canvas change (except undo/redo)
  const handleCanvasChange = useCallback((newState: CanvasState) => {
    updateCurrentCanvas({
      canvasState: newState,
      history: (() => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ canvasState: newState, timestamp: Date.now() });
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      })(),
      historyIndex: Math.min(historyIndex + 1, 49),
    });
  }, [history, historyIndex, activeCanvas]);

  const handleCanvasSizeChange = useCallback((width: number, height: number) => {
    if (width < 8 || width > 128 || height < 8 || height > 128) return;
    const newState = createEmptyCanvas(width, height);
    updateCurrentCanvas({
      canvasState: newState,
      history: [{ canvasState: newState, timestamp: Date.now() }],
      historyIndex: 0,
    });
  }, [activeCanvas]);

  const handleClearCanvas = useCallback(() => {
    const newState = createEmptyCanvas(canvasState.width, canvasState.height);
    updateCurrentCanvas({
      canvasState: newState,
      history: [{ canvasState: newState, timestamp: Date.now() }],
      historyIndex: 0,
    });
  }, [canvasState.width, canvasState.height, activeCanvas]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      updateCurrentCanvas({
        canvasState: history[historyIndex - 1].canvasState,
        historyIndex: historyIndex - 1,
      });
    }
  }, [history, historyIndex, activeCanvas]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      updateCurrentCanvas({
        canvasState: history[historyIndex + 1].canvasState,
        historyIndex: historyIndex + 1,
      });
    }
  }, [history, historyIndex, activeCanvas]);

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
      width = Math.min(width, MAX_SIZE);
      height = Math.min(height, MAX_SIZE);
    }
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const pixels: Pixel[][] = [];
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
      pixels.push(row as Pixel[]);
    }
    updateCurrentCanvas({
      canvasState: { pixels, width, height },
      history: [{ canvasState: { pixels, width, height }, timestamp: Date.now() }],
      historyIndex: 0,
    });
  }, [activeCanvas]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const openHelp = async () => {
    setShowHelp(true);
    const res = await fetch('/README.md');
    const text = await res.text();
    setReadmeContent(text);
  };

  const closeHelp = () => setShowHelp(false);

  // Helper for creating a white preview
  const renderPreview = (w: number, h: number) => (
    <div
      style={{
        width: 48,
        height: 48,
        border: '1px solid #ccc',
        background: 'repeating-linear-gradient(45deg, #fff, #fff 4px, #f0f0f0 4px, #f0f0f0 8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: '#888',
        margin: '0 auto',
      }}
    >
      <div style={{width: Math.max(8, 32 * w / 64), height: Math.max(8, 32 * h / 64), background: '#fff', border: '1px solid #eee'}} />
    </div>
  );

  // Handler for new drawing (modal)
  const handleNewDrawing = () => {
    const newState = createEmptyCanvas(selectedNewSize.w, selectedNewSize.h);
    setCanvases(prev => [
      ...prev,
      {
        name: `Canvas ${prev.length + 1}`,
        canvasState: newState,
        history: [{ canvasState: newState, timestamp: Date.now() }],
        historyIndex: 0,
      },
    ]);
    setActiveCanvas(canvases.length); // switch to new canvas
    setShowNewDrawingModal(false);
  };

  // Handler for save and new drawing (modal)
  const handleSaveAndNew = () => {
    exportCanvasAsPNG(canvasState);
    setTimeout(() => {
      handleNewDrawing();
    }, 100); // Give time for download
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col text-gray-900 dark:text-gray-100">
      {/* Canvas Tabs */}
      <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
        {canvases.map((c, i) => (
          <button
            key={i}
            onClick={() => switchCanvas(i)}
            className={`px-3 py-1 rounded-t font-medium transition-colors ${i === activeCanvas ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {c.name}
          </button>
        ))}
        <button
          onClick={addCanvas}
          className="ml-2 px-3 py-1 rounded-t bg-green-500 text-white font-bold hover:bg-green-600 transition-colors"
          title="Add new canvas"
        >
          +
        </button>
        {canvases.length > 1 && (
          <button
            onClick={deleteCanvas}
            className="ml-2 px-3 py-1 rounded-t bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
            title="Delete current canvas"
          >
            ×
          </button>
        )}
      </div>
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pixel Art Studio</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Create beautiful pixel art with precision</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="ml-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-800 dark:text-gray-100" />}
          </button>
        </div>
      </div>
      {/* Controls */}
      <Controls
        onNewDrawing={() => setShowNewDrawingModal(true)}
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