import React, { useRef, useEffect, useState } from 'react';
import { CanvasState, Color, Tool, BrushShape, Pixel } from '../types';
import { colorToString, floodFill, blendColors, invertColor } from '../utils';

interface CanvasProps {
  canvasState: CanvasState;
  onCanvasChange: (newState: CanvasState) => void;
  currentColor: Color;
  currentTool: Tool;
  pixelSize: number;
  onColorPick?: (color: Color) => void;
  brushShape: BrushShape;
  brushSize: number;
  shapeType: 'circle' | 'square' | 'rectangle' | 'smile';
  shapeFilled: boolean;
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
  shapeType,
  shapeFilled,
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

  const getLinePoints = (x0: number, y0: number, x1: number, y1: number) => {
    const points: { x: number; y: number }[] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    while (true) {
      points.push({ x, y });
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return points;
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

    // Interpolate between lastDrawnPixel and current coords
    if (lastDrawnPixel) {
      const points = getLinePoints(lastDrawnPixel.x, lastDrawnPixel.y, coords.x, coords.y);
      for (const point of points) {
        drawPixel(point.x, point.y, true);
      }
    } else {
      drawPixel(coords.x, coords.y, true);
    }

    setLastDrawnPixel(coords);
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
    } else {
      // For negative tool, reset drawnPixelsRef for single click
      if (currentTool === 'negative') {
        drawnPixelsRef.current = new Set();
      }
      drawPixel(coords.x, coords.y);
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
    } else if (currentTool === 'negative') {
      const brushPixels = getBrushPixels(x, y, brushShape, brushSize, canvasState.width, canvasState.height);
      for (const { x: bx, y: by } of brushPixels) {
        const key = `${bx},${by}`;
        if (!newPixels[by][bx].isEmpty && (!useLocal || !drawnPixelsRef.current.has(key))) {
          newPixels[by][bx] = {
            color: invertColor(newPixels[by][bx].color),
            isEmpty: false
          };
          if (useLocal) drawnPixelsRef.current.add(key);
        }
      }
    } else if (currentTool === 'shape') {
      // Draw shape at (x, y) with brushSize and shapeType
      const size = brushSize * 2 + 1;
      if (shapeType === 'circle' || shapeType === 'smile') {
        // Draw filled or empty circle
        const radius = Math.floor(size / 2);
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const bx = x + dx;
            const by = y + dy;
            if (bx < 0 || bx >= canvasState.width || by < 0 || by >= canvasState.height) continue;
            const dist = dx * dx + dy * dy;
            if (
              (shapeFilled && dist <= radius * radius) ||
              (!shapeFilled && dist <= radius * radius && dist >= (radius - 1) * (radius - 1))
            ) {
              let color = currentColor;
              if (shapeType === 'smile') {
                // Smile: yellow face, black eyes/mouth
                color = { r: 255, g: 221, b: 51, a: 1 };
                // Eyes
                if ((dy === -Math.floor(radius/2) && Math.abs(dx) === Math.floor(radius/2)) ||
                    (dy === -Math.floor(radius/2) && dx === 0 && radius > 2)) {
                  color = { r: 0, g: 0, b: 0, a: 1 };
                }
                // Smile (simple arc)
                if (dy === Math.floor(radius/2) && Math.abs(dx) < radius/2) {
                  color = { r: 0, g: 0, b: 0, a: 1 };
                }
                // Remove black middle pixel
                if (dx === 0 && dy === 0) {
                  color = { r: 255, g: 221, b: 51, a: 1 };
                }
              }
              newPixels[by][bx] = {
                color,
                isEmpty: color.a === 0
              };
            }
          }
        }
      } else if (shapeType === 'square') {
        const half = Math.floor(size / 2);
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const bx = x + dx;
            const by = y + dy;
            if (bx < 0 || bx >= canvasState.width || by < 0 || by >= canvasState.height) continue;
            if (
              (shapeFilled) ||
              (!shapeFilled && (Math.abs(dx) === half || Math.abs(dy) === half))
            ) {
              newPixels[by][bx] = {
                color: currentColor,
                isEmpty: currentColor.a === 0
              };
            }
          }
        }
      } else if (shapeType === 'rectangle') {
        const halfW = size;
        const halfH = Math.floor(size / 2);
        for (let dy = -halfH; dy <= halfH; dy++) {
          for (let dx = -halfW; dx <= halfW; dx++) {
            const bx = x + dx;
            const by = y + dy;
            if (bx < 0 || bx >= canvasState.width || by < 0 || by >= canvasState.height) continue;
            if (
              (shapeFilled) ||
              (!shapeFilled && (Math.abs(dx) === halfW || Math.abs(dy) === halfH))
            ) {
              newPixels[by][bx] = {
                color: currentColor,
                isEmpty: currentColor.a === 0
              };
            }
          }
        }
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