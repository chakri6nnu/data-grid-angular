import { Injectable } from '@angular/core';
import { Grid } from '../core/Grid';
import { Row } from '../core/Row';
import { Column } from '../core/Column';
import { GridOptions, SortDirection, FilterCondition, PaginationState } from '../types';
import { AngularColumnDefinition } from './types';

@Injectable({
  providedIn: 'root'
})
export class DataGridService {
  private gridInstances = new Map<string, Grid<any>>();

  createGrid<T = any>(
    gridId: string,
    options: {
      columns: AngularColumnDefinition<T>[];
      rowData: T[];
      rowHeight?: number;
      headerHeight?: number;
      enableSorting?: boolean;
      enableFiltering?: boolean;
      enablePagination?: boolean;
      pageSize?: number;
      enableGrouping?: boolean;
      enableSelection?: boolean;
      selectionType?: "single" | "multiple";
      enableCellEditing?: boolean;
      enableColumnResize?: boolean;
      enableColumnReorder?: boolean;
      enableExport?: boolean;
      animateRows?: boolean;
      isRowSelectable?: (row: T, rowIndex: number) => boolean;
    }
  ): Grid<T> {
    const gridOptions: GridOptions<T> = {
      columns: options.columns,
      rowData: options.rowData,
      rowHeight: options.rowHeight,
      headerHeight: options.headerHeight,
      enableSorting: options.enableSorting,
      enableFiltering: options.enableFiltering,
      enablePagination: options.enablePagination,
      pageSize: options.pageSize,
      enableGrouping: options.enableGrouping,
      enableSelection: options.enableSelection,
      selectionType: options.selectionType,
      enableCellEditing: options.enableCellEditing,
      enableColumnResize: options.enableColumnResize,
      enableColumnReorder: options.enableColumnReorder,
      enableExport: options.enableExport,
      animateRows: options.animateRows,
      isRowSelectable: options.isRowSelectable
    };

    const grid = new Grid<T>(gridOptions);
    this.gridInstances.set(gridId, grid);
    return grid;
  }

  getGrid<T = any>(gridId: string): Grid<T> | undefined {
    return this.gridInstances.get(gridId) as Grid<T> | undefined;
  }

  destroyGrid(gridId: string): void {
    const grid = this.gridInstances.get(gridId);
    if (grid) {
      grid.removeAllListeners();
      this.gridInstances.delete(gridId);
    }
  }

  sortColumn<T = any>(gridId: string, columnId: string, direction: SortDirection): void {
    const grid = this.getGrid<T>(gridId);
    grid?.sortColumn(columnId, direction);
  }

  getSortState<T = any>(gridId: string, columnId: string): SortDirection {
    const grid = this.getGrid<T>(gridId);
    return grid?.getSortState(columnId) || null;
  }

  getSortStates<T = any>(gridId: string): Map<string, SortDirection> {
    const grid = this.getGrid<T>(gridId);
    return grid?.getSortStates() || new Map();
  }

  filterColumn<T = any>(gridId: string, columnId: string, condition: FilterCondition | null): void {
    const grid = this.getGrid<T>(gridId);
    grid?.filterColumn(columnId, condition);
  }

  getFilterCondition<T = any>(gridId: string, columnId: string): FilterCondition | null {
    const grid = this.getGrid<T>(gridId);
    return grid?.getFilterCondition(columnId) || null;
  }

  selectRow<T = any>(gridId: string, index: number, selected: boolean = true): void {
    const grid = this.getGrid<T>(gridId);
    grid?.selectRow(index, selected);
  }

  selectAll<T = any>(gridId: string, selected: boolean = true): void {
    const grid = this.getGrid<T>(gridId);
    grid?.selectAll(selected);
  }

  getSelectedRows<T = any>(gridId: string): Row<T>[] {
    const grid = this.getGrid<T>(gridId);
    return grid?.getSelectedRows() || [];
  }

  setCellValue<T = any>(gridId: string, rowIndex: number, columnId: string, value: any): void {
    const grid = this.getGrid<T>(gridId);
    grid?.setCellValue(rowIndex, columnId, value);
  }

  resizeColumn<T = any>(gridId: string, columnId: string, newWidth: number): void {
    const grid = this.getGrid<T>(gridId);
    grid?.resizeColumn(columnId, newWidth);
  }

  setPage<T = any>(gridId: string, page: number): void {
    const grid = this.getGrid<T>(gridId);
    grid?.setPage(page);
  }

  setPageSize<T = any>(gridId: string, size: number): void {
    const grid = this.getGrid<T>(gridId);
    grid?.setPageSize(size);
  }

  getPaginationState<T = any>(gridId: string): PaginationState | null {
    const grid = this.getGrid<T>(gridId);
    return grid?.getPaginationState() || null;
  }

  groupByColumns<T = any>(gridId: string, columnIds: string[]): void {
    const grid = this.getGrid<T>(gridId);
    grid?.groupByColumns(columnIds);
  }

  getGroupByColumns<T = any>(gridId: string): string[] {
    const grid = this.getGrid<T>(gridId);
    return grid?.getGroupByColumns() || [];
  }

  toggleGroup<T = any>(gridId: string, groupKey: string): void {
    const grid = this.getGrid<T>(gridId);
    grid?.toggleGroup(groupKey);
  }

  exportToCSV<T = any>(gridId: string, filename?: string): void {
    const grid = this.getGrid<T>(gridId);
    grid?.exportToCSV(filename);
  }

  exportToExcel<T = any>(gridId: string, filename?: string): void {
    const grid = this.getGrid<T>(gridId);
    grid?.exportToExcel(filename);
  }

  getRows<T = any>(gridId: string): Row<T>[] {
    const grid = this.getGrid<T>(gridId);
    return grid?.getRows() || [];
  }

  getColumns<T = any>(gridId: string): Column<T>[] {
    const grid = this.getGrid<T>(gridId);
    return grid?.getColumns() || [];
  }

  setRowData<T = any>(gridId: string, rowData: T[]): void {
    const grid = this.getGrid<T>(gridId);
    grid?.setRowData(rowData);
  }

  setViewportSize<T = any>(gridId: string, width: number, height: number): void {
    const grid = this.getGrid<T>(gridId);
    grid?.setViewportSize(width, height);
  }

  getViewport<T = any>(gridId: string) {
    const grid = this.getGrid<T>(gridId);
    return grid?.getViewport();
  }

  getPaginationDisplayRange<T = any>(gridId: string) {
    const grid = this.getGrid<T>(gridId);
    const pagination = grid?.getPaginationState();
    if (!pagination) return null;
    
    const start = (pagination.currentPage - 1) * pagination.pageSize + 1;
    const end = Math.min(
      pagination.currentPage * pagination.pageSize,
      pagination.totalItems
    );
    
    return {
      text: `${start}-${end} of ${pagination.totalItems}`,
    };
  }

  getVisiblePageNumbers<T = any>(gridId: string): (number | string)[] {
    const grid = this.getGrid<T>(gridId);
    const pagination = grid?.getPaginationState();
    if (!pagination) return [];
    
    const currentPage = pagination.currentPage;
    const totalPages = pagination.totalPages;
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  }

  getRowPositions<T = any>(gridId: string): Map<number, number> {
    return new Map();
  }
}

