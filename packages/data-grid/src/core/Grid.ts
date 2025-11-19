import { EventEmitter } from "../utils/EventEmitter";
import { Column } from "./Column";
import { Row } from "./Row";
import { Viewport } from "./Viewport";
import {
  GridOptions,
  ColumnDefinition,
  SortDirection,
  FilterCondition,
  RowSelection,
  PaginationState,
  GroupingState,
} from "../types";

export class Grid<T = any> extends EventEmitter {
  private columns: Column<T>[] = [];
  private rows: Row<T>[] = [];
  private viewport: Viewport;
  private options: GridOptions<T>;
  private rowData: T[] = [];
  private filteredData: T[] = [];
  private sortedData: T[] = [];
  private currentData: T[] = [];
  private sortState: Map<string, SortDirection> = new Map();
  private filters: FilterCondition[] = [];
  private selection: RowSelection = {
    type: "multiple",
    selectedRows: new Set(),
  };
  private pagination: PaginationState | null = null;
  private grouping: GroupingState | null = null;

  constructor(options: GridOptions<T>) {
    super();
    this.options = {
      rowHeight: 30,
      headerHeight: 40,
      enableSorting: true,
      enableFiltering: true,
      enablePagination: false,
      pageSize: 100,
      enableGrouping: false,
      enableSelection: false,
      selectionType: "multiple",
      enableCellEditing: false,
      enableColumnResize: true,
      enableColumnReorder: false,
      enableExport: true,
      animateRows: true,
      ...options,
    };

    this.viewport = new Viewport({
      width: 800,
      height: 600,
      rowHeight: this.options.rowHeight!,
      headerHeight: this.options.headerHeight!,
    });

    this.initializeColumns();
    
    if (this.options.enablePagination) {
      this.initializePagination();
    }
    
    this.setRowData(options.rowData || []);

    if (this.options.enableGrouping) {
      this.grouping = {
        groupByColumns: [],
        expandedGroups: new Set(),
        collapsedGroups: new Set(),
      };
    }
  }

  private initializeColumns(): void {
    this.columns = this.options.columns.map((def) => new Column(def));
  }

  private initializePagination(): void {
    this.pagination = {
      currentPage: 1,
      pageSize: this.options.pageSize!,
      totalPages: 1,
      totalItems: 0,
    };
  }

  setRowData(data: T[]): void {
    this.rowData = data;
    this.applyFiltersAndSort();
    this.emit("rowDataChanged", { data });
  }

  getRowData(): T[] {
    return this.rowData;
  }

  getColumns(): Column<T>[] {
    return this.columns;
  }

  getRows(): Row<T>[] {
    return this.rows;
  }

  getViewport(): Viewport {
    return this.viewport;
  }

  setViewportSize(width: number, height: number): void {
    this.viewport.updateConfig({ width, height });
    this.emit("viewportChanged", { width, height });
  }

  private applyFiltersAndSort(): void {
    let data = [...this.rowData];

    if (this.filters.length > 0) {
      data = this.applyFilters(data);
    }
    this.filteredData = data;

    if (this.sortState.size > 0) {
      data = this.applySorting(data);
    }
    this.sortedData = data;

    if (
      this.options.enableGrouping &&
      this.grouping &&
      this.grouping.groupByColumns.length > 0
    ) {
      data = this.applyGrouping(data);
    }

    this.currentData = data;

    if (this.pagination) {
      this.pagination.totalItems = data.length;
      this.pagination.totalPages = Math.max(
        1,
        Math.ceil(data.length / this.pagination.pageSize)
      );
      if (
        this.pagination.currentPage > this.pagination.totalPages &&
        this.pagination.totalPages > 0
      ) {
        this.pagination.currentPage = this.pagination.totalPages;
      }
      if (this.pagination.currentPage < 1) {
        this.pagination.currentPage = 1;
      }

      const start =
        (this.pagination.currentPage - 1) * this.pagination.pageSize;
      const end = start + this.pagination.pageSize;
      data = data.slice(start, end);
    }

    this.rows = data.map((item, index) => {
      const row = new Row(item, index);
      row.selected = this.selection.selectedRows.has(index);

      if ((item as any).__isGroup === true) {
        row.isGroupRow = true;
        row.groupKey = (item as any).__groupKey;
        const itemLevel = (item as any).__groupLevel;
        row.groupLevel = typeof itemLevel === "number" ? itemLevel : 0;
        row.expanded = (item as any).__expanded ?? true;
      }

      return row;
    });

    this.viewport.setTotalRows(this.currentData.length);
    this.emit("dataChanged", { rows: this.rows });
  }

  private applyFilters(data: T[]): T[] {
    return data.filter((row) => {
      return this.filters.every((filter) => {
        const column = this.columns.find((col) => col.id === filter.columnId);
        if (!column) return true;

        const value = column.getValue(row);
        const filterValue = filter.value;

        switch (filter.operator) {
          case "equals":
            return value === filterValue;
          case "contains":
            return String(value)
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          case "greaterThan":
            return Number(value) > Number(filterValue);
          case "lessThan":
            return Number(value) < Number(filterValue);
          case "startsWith":
            return String(value)
              .toLowerCase()
              .startsWith(String(filterValue).toLowerCase());
          case "endsWith":
            return String(value)
              .toLowerCase()
              .endsWith(String(filterValue).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  private applySorting(data: T[]): T[] {
    const sorted = [...data];
    const sortColumns = Array.from(this.sortState.entries())
      .filter(([_, direction]) => direction !== null)
      .map(([columnId, direction]) => ({
        columnId,
        direction: direction as "asc" | "desc",
      }));

    if (sortColumns.length === 0) return sorted;

    sorted.sort((a, b) => {
      for (const { columnId, direction } of sortColumns) {
        const column = this.columns.find((col) => col.id === columnId);
        if (!column) continue;

        const valueA = column.getValue(a);
        const valueB = column.getValue(b);

        let comparison = 0;
        if (valueA == null && valueB == null) comparison = 0;
        else if (valueA == null) comparison = 1;
        else if (valueB == null) comparison = -1;
        else {
          if (typeof valueA === "number" && typeof valueB === "number") {
            comparison = valueA - valueB;
          } else {
            comparison = String(valueA).localeCompare(String(valueB));
          }
        }

        if (comparison !== 0) {
          return direction === "asc" ? comparison : -comparison;
        }
      }
      return 0;
    });

    return sorted;
  }

  private applyGrouping(data: T[]): T[] {
    if (!this.grouping || this.grouping.groupByColumns.length === 0) {
      return data;
    }

    const grouped = this.createNestedGroups(
      data,
      this.grouping.groupByColumns,
      0
    );

    return grouped;
  }

  private createNestedGroups(
    data: T[],
    groupColumns: string[],
    level: number,
    parentKey: string = ""
  ): any[] {
    if (level >= groupColumns.length) {
      return data;
    }

    const grouped: any[] = [];
    const groups = new Map<string, T[]>();
    const colId = groupColumns[level];
    const col = this.columns.find((c) => c.id === colId);

    data.forEach((row) => {
      const groupValue = col ? String(col.getValue(row)) : "";
      if (!groups.has(groupValue)) {
        groups.set(groupValue, []);
      }
      groups.get(groupValue)!.push(row);
    });

    groups.forEach((rows, groupValue) => {
      const fullGroupKey = parentKey
        ? `${parentKey}|${groupValue}`
        : groupValue;

      const collapsedGroups = this.grouping!.collapsedGroups || new Set();
      const isExpanded = !collapsedGroups.has(fullGroupKey);

      const groupRow = {
        __isGroup: true,
        __groupKey: fullGroupKey,
        __groupValue: groupValue,
        __groupLevel: level,
        __rows: rows,
        __expanded: isExpanded,
      };

      grouped.push(groupRow);

      if (isExpanded) {
        if (level < groupColumns.length - 1) {
          const nestedGroups = this.createNestedGroups(
            rows,
            groupColumns,
            level + 1,
            fullGroupKey
          );
          grouped.push(...nestedGroups);
        } else {
          grouped.push(...rows);
        }
      }
    });

    return grouped;
  }

  sortColumn(columnId: string, direction: SortDirection): void {
    if (!this.options.enableSorting) return;

    const column = this.columns.find((col) => col.id === columnId);
    if (!column || !column.sortable) return;

    if (direction === null) {
      this.sortState.delete(columnId);
    } else {
      this.sortState.set(columnId, direction);
    }

    this.applyFiltersAndSort();
    this.emit("sortChanged", { columnId, direction });
  }

  getSortState(columnId: string): SortDirection {
    return this.sortState.get(columnId) || null;
  }

  getSortStates(): Map<string, SortDirection> {
    return new Map(this.sortState);
  }

  getFilterCondition(columnId: string): FilterCondition | null {
    return this.filters.find((f) => f.columnId === columnId) || null;
  }

  getActiveFilters(): FilterCondition[] {
    return [...this.filters];
  }

  filterColumn(columnId: string, condition: FilterCondition | null): void {
    if (!this.options.enableFiltering) return;

    this.filters = this.filters.filter((f) => f.columnId !== columnId);
    if (condition) {
      this.filters.push(condition);
    }

    this.applyFiltersAndSort();
    this.emit("filterChanged", { columnId, condition });
  }

  selectRow(index: number, selected: boolean = true): void {
    if (!this.options.enableSelection) return;

    // Check if row is selectable
    const targetRow = this.rows[index];
    if (targetRow && this.options.isRowSelectable) {
      if (!this.options.isRowSelectable(targetRow.data, index)) {
        return; // Row is not selectable
      }
    }

    if (this.selection.type === "single") {
      this.selection.selectedRows.clear();
      if (selected) {
        this.selection.selectedRows.add(index);
      }
    } else {
      if (selected) {
        this.selection.selectedRows.add(index);
      } else {
        this.selection.selectedRows.delete(index);
      }
    }

    this.selection.lastSelectedIndex = index;
    if (targetRow) {
      targetRow.selected = selected;
    }

    this.emit("selectionChanged", {
      selectedRows: Array.from(this.selection.selectedRows),
    });
  }

  selectAll(selected: boolean = true): void {
    if (!this.options.enableSelection || this.selection.type === "single")
      return;

    if (selected) {
      this.rows.forEach((_, index) => this.selection.selectedRows.add(index));
      this.rows.forEach((row) => (row.selected = true));
    } else {
      this.selection.selectedRows.clear();
      this.rows.forEach((row) => (row.selected = false));
    }

    this.emit("selectionChanged", {
      selectedRows: Array.from(this.selection.selectedRows),
    });
  }

  getSelectedRows(): Row<T>[] {
    return Array.from(this.selection.selectedRows)
      .map((index) => this.rows[index])
      .filter(Boolean);
  }

  setCellValue(rowIndex: number, columnId: string, value: any): void {
    if (!this.options.enableCellEditing) return;

    const row = this.rows[rowIndex];
    const column = this.columns.find((col) => col.id === columnId);

    if (!row || !column || !column.editable) return;

    const updatedData = column.setValue(row.data, value);
    row.updateData(updatedData);

    const originalIndex = this.currentData.findIndex(
      (item) => item === row.data
    );
    if (originalIndex !== -1) {
      this.currentData[originalIndex] = updatedData;
    }

    this.emit("cellValueChanged", {
      rowIndex,
      columnId,
      value,
      row: updatedData,
    });
  }

  resizeColumn(columnId: string, newWidth: number): void {
    if (!this.options.enableColumnResize) return;

    const column = this.columns.find((col) => col.id === columnId);
    if (column && column.resizable) {
      column.width = newWidth;
      this.emit("columnResized", { columnId, width: newWidth });
    }
  }

  setPage(page: number): void {
    if (!this.pagination) return;

    this.pagination.currentPage = Math.max(
      1,
      Math.min(page, this.pagination.totalPages)
    );
    this.applyFiltersAndSort();
    this.emit("pageChanged", { page: this.pagination.currentPage });
  }

  setPageSize(size: number): void {
    if (!this.pagination) return;

    this.pagination.pageSize = size;
    this.pagination.totalPages = Math.max(
      1,
      Math.ceil(this.pagination.totalItems / size)
    );
    this.pagination.currentPage = 1;
    this.applyFiltersAndSort();
    this.emit("pageSizeChanged", { pageSize: size });
  }

  getPaginationState(): PaginationState | null {
    return this.pagination ? { ...this.pagination } : null;
  }

  groupByColumns(columnIds: string[]): void {
    if (!this.options.enableGrouping || !this.grouping) return;

    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const id of columnIds) {
      if (!seen.has(id)) {
        seen.add(id);
        uniqueIds.push(id);
      }
    }

    this.grouping.groupByColumns = uniqueIds;
    this.applyFiltersAndSort();
    this.emit("groupingChanged", { columnIds: uniqueIds });
  }

  getGroupByColumns(): string[] {
    return this.grouping ? [...this.grouping.groupByColumns] : [];
  }

  toggleGroup(groupKey: string): void {
    if (!this.grouping) return;

    if (!this.grouping.collapsedGroups) {
      this.grouping.collapsedGroups = new Set();
    }

    if (this.grouping.collapsedGroups.has(groupKey)) {
      this.grouping.collapsedGroups.delete(groupKey);
    } else {
      this.grouping.collapsedGroups.add(groupKey);
    }

    this.applyFiltersAndSort();
    const collapsedGroups = this.grouping.collapsedGroups || new Set();
    this.emit("groupToggled", {
      groupKey,
      expanded: !collapsedGroups.has(groupKey),
    });
  }

  exportToCSV(filename: string = "grid-export.csv"): void {
    if (!this.options.enableExport) return;

    const headers = this.columns.map((col) => col.headerName).join(",");
    const rows = this.currentData.map((row) => {
      return this.columns
        .map((col) => {
          const value = col.getValue(row);
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.emit("exported", { format: "csv", filename });
  }

  exportToExcel(filename: string = "grid-export.xlsx"): void {
    this.exportToCSV(filename.replace(".xlsx", ".csv"));
    this.emit("exported", { format: "excel", filename });
  }
}

