export interface Layout {
  fieldX: number;
  fieldY: number;
  cellSize: number;
  fieldWidth: number;
  fieldHeight: number;
  nextX: number;
  nextY: number;
  holdX: number;
  holdY: number;
  hudX: number;
  hudY: number;
}

export function calculateLayout(canvas: HTMLCanvasElement): Layout {
  const { width, height } = canvas;
  const isLandscape = width > height;
  
  if (isLandscape) {
    return calculateDesktopLayout(width, height);
  } else {
    return calculateMobileLayout(width, height);
  }
}

function calculateDesktopLayout(width: number, height: number): Layout {
  const fieldAspect = 10 / 20;
  const availableHeight = height * 0.9;
  const availableWidth = width * 0.6;
  
  let cellSize: number;
  
  if (availableWidth * (1 / fieldAspect) <= availableHeight) {
    cellSize = availableWidth / 10;
  } else {
    cellSize = availableHeight / 20;
  }
  
  const fieldWidth = cellSize * 10;
  const fieldHeight = cellSize * 20;
  const fieldX = width * 0.1;
  const fieldY = (height - fieldHeight) / 2;
  
  const rightPanelX = fieldX + fieldWidth + 40;
  
  return {
    fieldX,
    fieldY,
    cellSize,
    fieldWidth,
    fieldHeight,
    nextX: rightPanelX,
    nextY: fieldY,
    holdX: fieldX - 120,
    holdY: fieldY,
    hudX: rightPanelX,
    hudY: fieldY + 200
  };
}

function calculateMobileLayout(width: number, height: number): Layout {
  const availableWidth = width * 0.9;
  const cellSize = availableWidth / 10;
  
  const fieldWidth = cellSize * 10;
  const fieldHeight = cellSize * 20;
  const fieldX = (width - fieldWidth) / 2;
  const fieldY = height * 0.1;
  
  return {
    fieldX,
    fieldY,
    cellSize,
    fieldWidth,
    fieldHeight,
    nextX: fieldX + fieldWidth + 10,
    nextY: fieldY,
    holdX: fieldX - 60,
    holdY: fieldY,
    hudX: fieldX,
    hudY: fieldY + fieldHeight + 20
  };
}