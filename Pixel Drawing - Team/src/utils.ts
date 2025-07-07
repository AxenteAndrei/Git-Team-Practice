import { Color, Pixel, CanvasState } from './types';

export const defaultColor: Color = { r: 0, g: 0, b: 0, a: 1 };
export const transparentColor: Color = { r: 255, g: 255, b: 255, a: 0 };

export function colorToString(color: Color): string {
  if (color.a === 0) return 'transparent';
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function stringToColor(colorString: string): Color {
  if (colorString === 'transparent') return transparentColor;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = colorString;
  ctx.fillRect(0, 0, 1, 1);
  const imageData = ctx.getImageData(0, 0, 1, 1);
  const [r, g, b, a] = imageData.data;
  
  return { r, g, b, a: a / 255 };
}

export function createEmptyCanvas(width: number, height: number): CanvasState {
  const pixels: Pixel[][] = [];
  
  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      pixels[y][x] = {
        color: transparentColor,
        isEmpty: true
      };
    }
  }
  
  return { pixels, width, height };
}

export function colorsEqual(a: Color, b: Color): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

export function floodFill(
  canvasState: CanvasState,
  startX: number,
  startY: number,
  newColor: Color
): CanvasState {
  const { pixels, width, height } = canvasState;
  const targetColor = pixels[startY][startX].color;
  
  if (colorsEqual(targetColor, newColor)) return canvasState;
  
  const newPixels = pixels.map(row => row.map(pixel => ({ ...pixel })));
  const stack: [number, number][] = [[startX, startY]];
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (!colorsEqual(newPixels[y][x].color, targetColor)) continue;
    
    newPixels[y][x] = {
      color: newColor,
      isEmpty: newColor.a === 0
    };
    
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return { ...canvasState, pixels: newPixels };
}

export function exportCanvasAsPNG(canvasState: CanvasState): void {
  const { pixels, width, height } = canvasState;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixels[y][x];
      if (!pixel.isEmpty) {
        ctx.fillStyle = colorToString(pixel.color);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  
  canvas.toBlob(blob => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `pixel-art-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  });
}

export function blendColors(fg: Color, bg: Color): Color {
  // Alpha compositing: out = fg.a * fg + (1 - fg.a) * bg
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
    g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
    b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
    a: a
  };
}