export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
}

export class VirtualScroller {
  private config: VirtualScrollConfig;

  constructor(config: VirtualScrollConfig) {
    this.config = {
      overscan: 5,
      ...config
    };
  }

  calculate(scrollTop: number): VirtualScrollResult {
    const { itemHeight, containerHeight, totalItems, overscan = 5 } = this.config;

    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + containerHeight;
    
    const bufferPixels = overscan * itemHeight;
    const firstPixel = Math.max(0, visibleTop - bufferPixels);
    const lastPixel = visibleBottom + bufferPixels;
    
    const startIndex = Math.max(0, Math.floor(firstPixel / itemHeight));
    const endIndex = Math.min(totalItems - 1, Math.floor(lastPixel / itemHeight));
    
    const offsetY = startIndex * itemHeight;

    return {
      startIndex,
      endIndex,
      visibleItems: endIndex - startIndex + 1,
      offsetY
    };
  }

  updateConfig(config: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

