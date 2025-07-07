import React, { useRef, useEffect, useState } from 'react';
import { CanvasState, Color, Tool, BrushShape, Pixel } from '../types';
import { colorToString, floodFill, blendColors } from '../utils';

interface CanvasProps {
  canvasState: CanvasState;
  onCanvasChange: (newState: CanvasState) => void;
  currentColor: Color;
  currentTool: Tool;
  pixelSize: number;
  onColorPick?: (color: Color) => void;
  brushShape: BrushShape;
  brushSize: number;
  onCustomColorUsed?: (color: Color) => void;
}

export default function Canvas({
  canvasState,
  onCanvasChange,
  currentColor,
  currentTool,
  pixelSize,
  onColorPick,
  brushShape,
  brushSize,
  onCustomColorUsed
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawnPixel, setLastDrawnPixel] = useState<{x: number, y: number} | null>(null);
  const drawnPixelsRef = useRef<Set<string>>(new Set());
  const [localPixels, setLocalPixels] = useState<Pixel[][] | null>(null);

  // List of default colors (should match ColorPalette)
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

  const colorEquals = (a: Color, b: Color) =>
    a.r === b.r && a.g === b.g && a.b === b.b && Math.abs(a.a - b.a) < 0.01;
  const isDefaultColor = (color: Color) =>
    defaultColors.some(dc => colorEquals(dc, color));

  useEffect(() => {
    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d')!;
      const { width, height } = canvasState;
      const pixels = localPixels || canvasState.pixels;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw checkerboard background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }

      // Draw pixels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = pixels[y][x];
          if (!pixel.isEmpty) {
            ctx.fillStyle = colorToString(pixel.color);
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }

      // Draw grid (always)
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;

      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, height * pixelSize);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(width * pixelSize, y * pixelSize);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };
    drawCanvas();
  }, [canvasState, pixelSize, localPixels]);

  const getPixelCoordinates = (event: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);

    if (x >= 0 && x < canvasState.width && y >= 0 && y < canvasState.height) {
      return { x, y };
    }

    return null;
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const coords = getPixelCoordinates(event);
    if (!coords) return;

    setIsDrawing(true);
    setLastDrawnPixel(coords);
    drawnPixelsRef.current = new Set(); // Clear for new stroke
    setLocalPixels(canvasState.pixels.map(row => row.map(pixel => ({ ...pixel }))));
    drawPixel(coords.x, coords.y, true);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing) return;

    const coords = getPixelCoordinates(event);
    if (!coords) return;

    // Avoid drawing on the same pixel repeatedly in a stroke
    const key = `${coords.x},${coords.y}`;
    if (drawnPixelsRef.current.has(key)) {
      return;
    }
    drawnPixelsRef.current.add(key);

    // Avoid drawing on the same pixel as lastDrawnPixel (legacy check)
    if (lastDrawnPixel && coords.x === lastDrawnPixel.x && coords.y === lastDrawnPixel.y) {
      return;
    }

    setLastDrawnPixel(coords);
    drawPixel(coords.x, coords.y, true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastDrawnPixel(null);
    drawnPixelsRef.current = new Set(); // Clear after stroke
    if (localPixels) {
      onCanvasChange({ ...canvasState, pixels: localPixels });
      setLocalPixels(null);
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    const coords = getPixelCoordinates(event);
    if (!coords) return;

    if (currentTool === 'fill') {
      const newState = floodFill(canvasState, coords.x, coords.y, currentColor);
      onCanvasChange(newState);
    } else if (currentTool === 'eyedropper') {
      const pixel = canvasState.pixels[coords.y][coords.x];
      if (!pixel.isEmpty) {
        if (onColorPick) {
          onColorPick(pixel.color);
        }
        // This would need to be passed up to parent
        console.log('Eyedropper picked:', pixel.color);
      }
    }
  };

  const getBrushPixels = (centerX: number, centerY: number, shape: BrushShape, size: number, width: number, height: number) => {
    const pixels: { x: number; y: number }[] = [];
    const radius = Math.floor(size / 2);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (shape === 'circle') {
          if (dx * dx + dy * dy <= radius * radius) {
            pixels.push({ x, y });
          }
        } else {
          pixels.push({ x, y });
        }
      }
    }
    return pixels;
  };

  // Call onCustomColorUsed when a custom color is actually used
  const notifyCustomColorUsed = () => {
    if (onCustomColorUsed && !isDefaultColor(currentColor)) {
      onCustomColorUsed(currentColor);
    }
  };

  const drawPixel = (x: number, y: number, useLocal?: boolean) => {
    if (currentTool === 'fill' || currentTool === 'eyedropper') return;

    const basePixels = useLocal && localPixels ? localPixels : canvasState.pixels;
    const newPixels = basePixels.map(row => row.map(pixel => ({ ...pixel })));
    
    if (currentTool === 'pencil') {
      const baseColor = newPixels[y][x].color;
      const blendedColor = blendColors(currentColor, baseColor);
      newPixels[y][x] = {
        color: blendedColor,
        isEmpty: blendedColor.a === 0
      };
    } else if (currentTool === 'eraser') {
      newPixels[y][x] = {
        color: { r: 255, g: 255, b: 255, a: 0 },
        isEmpty: true
      };
    } else if (currentTool === 'brush') {
      const brushPixels = getBrushPixels(x, y, brushShape, brushSize, canvasState.width, canvasState.height);
      for (const { x: bx, y: by } of brushPixels) {
        const baseColor = newPixels[by][bx].color;
        const blendedColor = blendColors(currentColor, baseColor);
        newPixels[by][bx] = {
          color: blendedColor,
          isEmpty: blendedColor.a === 0
        };
      }
    }

    if (useLocal) {
      setLocalPixels(newPixels);
    } else {
      onCanvasChange({ ...canvasState, pixels: newPixels });
    }
    notifyCustomColorUsed();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
      <div
        className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-center overflow-auto"
        style={{
          maxWidth: '80vw',
          maxHeight: '80vh',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasState.width * pixelSize}
          height={canvasState.height * pixelSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          className="cursor-crosshair border border-gray-200 rounded"
          style={{ imageRendering: 'pixelated', display: 'block' }}
        />
      </div>
    </div>
  );
}