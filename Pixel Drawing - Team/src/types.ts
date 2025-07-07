export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Pixel {
  color: Color;
  isEmpty: boolean;
}

export interface CanvasState {
  pixels: Pixel[][];
  width: number;
  height: number;
}

export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'brush';

export type BrushShape = 'circle' | 'square';

export interface HistoryState {
  canvasState: CanvasState;
  timestamp: number;
}