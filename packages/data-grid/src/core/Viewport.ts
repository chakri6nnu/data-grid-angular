import { VirtualScroller, VirtualScrollResult } from '../utils/VirtualScroller';
import { Row } from './Row';

export interface ViewportConfig {
  width: number;
  height: number;
  rowHeight: number;
  headerHeight: number;
}

export class Viewport {
  private config: ViewportConfig;
  private virtualScroller: VirtualScroller;
  private scrollTop: number = 0;
  private scrollLeft: number = 0;
  private totalRows: number = 0;

  constructor(config: ViewportConfig) {
    this.config = config;
    this.virtualScroller = new VirtualScroller({
      itemHeight: config.rowHeight,
      containerHeight: config.height - config.headerHeight,
      totalItems: 0
    });
  }

  updateConfig(config: Partial<ViewportConfig>): void {
    this.config = { ...this.config, ...config };
    this.virtualScroller.updateConfig({
      itemHeight: this.config.rowHeight,
      containerHeight: this.config.height - this.config.headerHeight
    });
  }

  setTotalRows(count: number): void {
    this.totalRows = count;
    this.virtualScroller.updateConfig({ totalItems: count });
  }

  setScrollTop(value: number): void {
    this.scrollTop = Math.max(0, value);
  }

  setScrollLeft(value: number): void {
    this.scrollLeft = Math.max(0, value);
  }

  getScrollTop(): number {
    return this.scrollTop;
  }

  getScrollLeft(): number {
    return this.scrollLeft;
  }

  getVisibleRange(): VirtualScrollResult {
    return this.virtualScroller.calculate(this.scrollTop);
  }

  getConfig(): ViewportConfig {
    return { ...this.config };
  }

  getTotalRows(): number {
    return this.totalRows;
  }
}

